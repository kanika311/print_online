import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { OrderCreateSchema } from '@/lib/validations';
import { calculatePrintPrice } from '@/services/pricingService';
import { calculateQueueEstimate } from '@/services/queueService';
import { emitSocketEvent } from '@/lib/socketServer';
import { Order } from '@/models/Order';
import { Shop } from '@/models/Shop';
import { Printer } from '@/models/Printer';
import { Payment } from '@/models/Payment';

export async function GET(req: NextRequest) {
  try {
    const { isFallback } = await connectDB();
    const session = getSessionFromRequest(req);
    const { searchParams } = new URL(req.url);

    const shopId = searchParams.get('shopId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    let orders: any[] = [];
    if (!isFallback) {
      try {
        const query: any = {};
        if (shopId) query.shopId = shopId;
        if (customerId) query.customerId = customerId;
        if (status) query.status = status;
        orders = await Order.find(query).sort({ createdAt: -1 }).lean();
      } catch (err) {
        orders = memoryStore.orders;
      }
    } else {
      orders = memoryStore.orders;
    }

    if (shopId) {
      orders = orders.filter((o) => o.shopId === shopId);
    }
    if (customerId) {
      orders = orders.filter((o) => o.customerId === customerId);
    }
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    // Sort newest first
    orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isFallback } = await connectDB();
    const session = getSessionFromRequest(req);
    const body = await req.json();

    const parsed = OrderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Find Shop
    const shop = memoryStore.shops.find((s) => s._id.toString() === data.shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Find Printer
    const printer = memoryStore.printers.find(
      (p) => p._id.toString() === data.printerId
    );
    if (!printer) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    // Price Calculation
    const pricing = calculatePrintPrice({
      pageCount: data.pageCount,
      copies: data.copies,
      isColor: data.isColor,
      isDuplex: data.isDuplex,
      paperSize: data.paperSize,
      orientation: data.orientation,
      binding: data.binding,
      fulfillmentType: data.fulfillmentType,
      deliveryFee: data.deliveryFee,
      shopRates: shop.pricingRates,
    });

    // Active queue calculation for this shop/printer
    const activeAhead = memoryStore.orders.filter(
      (o) =>
        o.printerId === data.printerId &&
        ['QUEUED', 'PRINTING'].includes(o.status)
    );

    const pendingPagesAhead = activeAhead.reduce(
      (acc, o) => acc + (o.pageCount * o.copies || 1),
      0
    );

    const queueEstimate = calculateQueueEstimate({
      queueAheadCount: activeAhead.length,
      totalPendingPagesAhead: pendingPagesAhead,
      printerPpmSpeed: printer.ppmSpeed,
      currentJobPages: data.pageCount * data.copies,
    });

    const orderId = `ord_${Date.now()}`;
    const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const isOnline = data.paymentType === 'ONLINE';
    const isUpi = data.paymentType === 'UPI';
    const isPaidInstantly = isOnline || isUpi;
    const upiRefNumber = data.upiRefNumber || body.upiRefNumber;

    // Online & UPI orders move directly to QUEUED; Cash orders start as PENDING until approved
    const initialStatus = isPaidInstantly ? 'QUEUED' : 'PENDING';
    const initialPaymentStatus = isPaidInstantly ? 'PAID' : 'PENDING_APPROVAL';

    const customerId = session?.userId || `guest_${Date.now()}`;
    const customerName = session?.name || body.customerName || 'Walk-in Customer';
    const customerPhone = body.customerPhone || '+91 98765 00000';

    const orderFiles = data.files && data.files.length > 0 ? data.files : [
      {
        url: data.fileUrl,
        name: data.fileName,
        type: data.fileType,
        size: data.fileSizeBytes || 0,
        pages: data.pageCount,
      }
    ];

    // Platform Fee calculation if configured by Admin
    const settings = memoryStore.settings || {};
    let platformFee = 0;
    if (settings.platformFeeEnabled && Number(settings.platformFeeAmount) > 0) {
      if (settings.platformFeeType === 'PERCENT') {
        platformFee = Math.round(((pricing.totalPrice * settings.platformFeeAmount) / 100) * 100) / 100;
      } else {
        platformFee = Number(settings.platformFeeAmount);
      }
    }

    const finalTotalPrice = +(pricing.totalPrice + platformFee).toFixed(2);

    const newOrder = {
      _id: orderId,
      orderNumber,
      customerId,
      customerName,
      customerPhone,
      shopId: shop._id.toString(),
      shopName: shop.name,
      printerId: printer._id.toString(),
      printerName: printer.name,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSizeBytes: data.fileSizeBytes || 0,
      files: orderFiles,
      pageCount: data.pageCount,
      pageRange: data.pageRange || 'All',
      copies: data.copies,
      isColor: data.isColor,
      isDuplex: data.isDuplex,
      paperSize: data.paperSize,
      orientation: data.orientation || 'PORTRAIT',
      binding: data.binding,
      notes: data.notes || '',
      totalPrice: finalTotalPrice,
      breakdown: {
        pagesTotal: pricing.pagesTotal,
        ratePerPage: pricing.ratePerPage,
        printingSubtotal: pricing.printingSubtotal,
        bindingFee: pricing.bindingFee,
        deliveryFee: pricing.deliveryFee,
        gstAmount: pricing.gstAmount,
        platformFee,
      },
      paymentType: data.paymentType,
      paymentStatus: initialPaymentStatus,
      upiRefNumber: upiRefNumber || undefined,
      upiId: shop.upiId || 'apexprint@upi',
      fulfillmentType: data.fulfillmentType || 'PICKUP',
      deliveryAddress: data.deliveryAddress,
      deliveryFee: pricing.deliveryFee,
      status: initialStatus,
      queuePosition: queueEstimate.queuePosition,
      estimatedWaitMinutes: queueEstimate.estimatedWaitMinutes,
      approvedAt: isPaidInstantly ? new Date() : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isFallback) {
      try {
        await Order.create(newOrder);
      } catch (err) {
        console.warn('MongoDB order create failed, relying on memoryStore:', err);
      }
    }

    // Always keep memoryStore in sync
    const existingIdx = memoryStore.orders.findIndex((o) => o._id === newOrder._id);
    if (existingIdx >= 0) {
      memoryStore.orders[existingIdx] = newOrder;
    } else {
      memoryStore.orders.unshift(newOrder);
    }

    // If online or UPI payment, immediately record transaction
    if (isPaidInstantly) {
      // Free Launch Plan has 0% shop commission fee
      const commissionRate = (shop.activePlan === 'Free Launch Plan') ? 0.0 : 0.03;
      const baseCommission = +(pricing.totalPrice * commissionRate).toFixed(2);
      const totalAdminCommission = +(baseCommission + platformFee).toFixed(2);
      const shopCut = +(pricing.totalPrice - baseCommission).toFixed(2);

      const paymentRecord = {
        _id: `pay_${Date.now()}`,
        orderId,
        orderNumber,
        shopId: shop._id.toString(),
        shopName: shop.name,
        customerId,
        customerName,
        amount: finalTotalPrice,
        paymentType: isUpi ? ('UPI' as const) : ('ONLINE' as const),
        paymentStatus: 'SUCCESS' as const,
        adminCommission: totalAdminCommission,
        shopEarnings: shopCut,
        transactionId: isUpi ? (upiRefNumber || `UPI_TXN_${Date.now()}`) : `TXN_GATEWAY_${Date.now()}`,
        paymentGatewayRef: isUpi ? `shop_upi_${shop.upiId || 'direct'}` : `sim_gateway_${Date.now()}`,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryStore.payments.unshift(paymentRecord);
      shop.totalRevenue = (shop.totalRevenue || 0) + pricing.totalPrice;
      shop.onlineCollected = (shop.onlineCollected || 0) + pricing.totalPrice;
    }

    // Emit live WebSocket event to printer dashboard room & global
    emitSocketEvent('order:created', newOrder, `shop:${shop._id.toString()}`);
    emitSocketEvent('order:created', newOrder);

    return NextResponse.json({
      success: true,
      message: isUpi
        ? `UPI Payment received (UTR: ${upiRefNumber || 'Direct'})! Order spooled in print queue.`
        : isOnline
        ? 'Payment confirmed and order added to queue!'
        : 'Order created! Please present cash at the counter for approval.',
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
