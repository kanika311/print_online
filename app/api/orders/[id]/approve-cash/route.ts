import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { emitSocketEvent } from '@/lib/socketServer';
import { Order } from '@/models/Order';
import { Shop } from '@/models/Shop';
import { Payment } from '@/models/Payment';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authorize(req, ['ADMIN', 'SHOP_OWNER']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const orderId = params.id;

    let order: any = null;
    let isMongoDoc = false;

    if (!isFallback) {
      try {
        order = await Order.findOne({
          $or: [{ _id: orderId }, { orderNumber: orderId }],
        });
        if (order) isMongoDoc = true;
      } catch (err) {
        console.warn('MongoDB order lookup failed in approve-cash:', err);
      }
    }

    if (!order) {
      order = memoryStore.orders.find(
        (o) => o._id.toString() === orderId || o.orderNumber === orderId
      );
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { message: 'Cash payment already approved for this order', order },
        { status: 200 }
      );
    }

    // Approve cash payment
    order.paymentStatus = 'PAID';
    order.status = 'QUEUED';
    order.approvedAt = new Date();
    order.updatedAt = new Date();

    const shop = memoryStore.shops.find(
      (s) => s._id.toString() === order.shopId
    );

    const commissionRate = 0.03; // 3%
    const commission = +(order.totalPrice * commissionRate).toFixed(2);
    const shopCut = +(order.totalPrice - commission).toFixed(2);

    // Record cash transaction ledger
    const paymentRecord = {
      _id: `pay_cash_${Date.now()}`,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      shopId: order.shopId,
      shopName: order.shopName,
      customerId: order.customerId,
      customerName: order.customerName,
      amount: order.totalPrice,
      paymentType: 'CASH' as const,
      paymentStatus: 'SUCCESS' as const,
      adminCommission: commission,
      shopEarnings: shopCut,
      transactionId: `TXN_CASH_${Math.floor(100000 + Math.random() * 900000)}`,
      approvedAt: new Date(),
      notes: `Counter cash payment approved by ${authResult.session?.name || 'Shop Staff'}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.payments.unshift(paymentRecord);

    if (shop) {
      shop.totalRevenue = (shop.totalRevenue || 0) + order.totalPrice;
      shop.cashCollected = (shop.cashCollected || 0) + order.totalPrice;
      shop.currentQueueCount = (shop.currentQueueCount || 0) + 1;
    }

    if (isMongoDoc && typeof order.save === 'function') {
      await order.save();
    } else if (!isFallback) {
      try {
        await Order.findOneAndUpdate(
          { $or: [{ _id: orderId }, { orderNumber: orderId }] },
          {
            $set: {
              paymentStatus: 'PAID',
              status: 'QUEUED',
              approvedAt: order.approvedAt,
              updatedAt: order.updatedAt,
            },
          }
        );
      } catch (err) {
        console.warn('DB update error, persisted in memory:', err);
      }
    }

    if (!isFallback) {
      try {
        await Payment.create(paymentRecord);
      } catch (err) {
        console.warn('DB payment insert error:', err);
      }
    }

    const orderObj = typeof order.toObject === 'function' ? order.toObject() : order;
    const memIdx = memoryStore.orders.findIndex(
      (o) => o._id.toString() === orderId || o.orderNumber === orderId
    );
    if (memIdx >= 0) {
      memoryStore.orders[memIdx] = orderObj;
    } else {
      memoryStore.orders.unshift(orderObj);
    }

    const eventPayload = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      shopId: order.shopId,
      status: 'QUEUED',
      paymentStatus: 'PAID',
      message: 'Cash payment approved by printer shop. Order queued for printing!',
      approvedAt: order.approvedAt,
    };

    // Emit live WebSocket events
    emitSocketEvent('order:cash_approved', eventPayload, `order:${order._id}`);
    emitSocketEvent('order:status_updated', eventPayload, `order:${order._id}`);
    emitSocketEvent('order:status_updated', eventPayload, `shop:${order.shopId}`);
    emitSocketEvent('order:cash_approved', eventPayload);

    return NextResponse.json({
      success: true,
      message: `Cash payment of ₹${order.totalPrice} approved! Order queued.`,
      order,
      payment: paymentRecord,
    });
  } catch (error: any) {
    console.error('Cash approval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve cash payment' },
      { status: 500 }
    );
  }
}
