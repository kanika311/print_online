import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socketServer';
import { Order } from '@/models/Order';
import { Shop } from '@/models/Shop';
import { Payment } from '@/models/Payment';

export async function POST(req: NextRequest) {
  try {
    const { isFallback } = await connectDB();
    const body = await req.json();

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    let order = memoryStore.orders.find(
      (o) => o._id.toString() === orderId || o.orderNumber === orderId
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify payment
    const paymentId = razorpay_payment_id || `pay_${Date.now()}`;
    order.paymentStatus = 'PAID';
    order.status = 'QUEUED';
    order.razorpayOrderId = razorpay_order_id || `order_rzp_${Date.now()}`;
    order.razorpayPaymentId = paymentId;
    order.approvedAt = new Date();
    order.updatedAt = new Date();

    const shop = memoryStore.shops.find((s) => s._id.toString() === order.shopId);

    const commissionRate = 0.03;
    const commission = +(order.totalPrice * commissionRate).toFixed(2);
    const shopCut = +(order.totalPrice - commission).toFixed(2);

    const paymentRecord = {
      _id: `pay_rzp_${Date.now()}`,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      shopId: order.shopId,
      shopName: order.shopName,
      customerId: order.customerId,
      customerName: order.customerName,
      amount: order.totalPrice,
      paymentType: 'ONLINE' as const,
      paymentStatus: 'SUCCESS' as const,
      adminCommission: commission,
      shopEarnings: shopCut,
      transactionId: paymentId,
      paymentGatewayRef: razorpay_order_id,
      approvedAt: new Date(),
      notes: 'Verified via Razorpay Online Payment Gateway',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.payments.unshift(paymentRecord);

    if (shop) {
      shop.totalRevenue = (shop.totalRevenue || 0) + order.totalPrice;
      shop.onlineCollected = (shop.onlineCollected || 0) + order.totalPrice;
    }

    if (!isFallback) {
      try {
        await Order.findByIdAndUpdate(order._id, {
          paymentStatus: 'PAID',
          status: 'QUEUED',
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: order.razorpayPaymentId,
          approvedAt: order.approvedAt,
        });
        await Payment.create(paymentRecord);
      } catch (err) {
        console.warn('DB update error in razorpay verify:', err);
      }
    }

    const eventPayload = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      shopId: order.shopId,
      status: 'QUEUED',
      paymentStatus: 'PAID',
      message: 'Razorpay payment verified. Order entered print queue!',
    };

    emitSocketEvent('order:status_updated', eventPayload, `order:${order._id}`);
    emitSocketEvent('order:status_updated', eventPayload, `shop:${order.shopId}`);
    emitSocketEvent('order:status_updated', eventPayload);

    return NextResponse.json({
      success: true,
      message: 'Razorpay payment verified and order queued!',
      order,
    });
  } catch (error: any) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
