import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socketServer';
import { Order } from '@/models/Order';
import { DeliveryOrder } from '@/models/DeliveryOrder';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isFallback } = await connectDB();
    const orderId = params.id;
    const body = await req.json();

    const { fulfillmentType, deliveryAddress, recipientPhone } = body;

    let order: any = null;
    let isMongoDoc = false;

    if (!isFallback) {
      try {
        order = await Order.findOne({
          $or: [{ _id: orderId }, { orderNumber: orderId }],
        });
        if (order) {
          isMongoDoc = true;
        }
      } catch (err) {
        console.warn('MongoDB order lookup failed in fulfillment route:', err);
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

    order.fulfillmentType = fulfillmentType;

    if (fulfillmentType === 'DELIVERY') {
      if (!deliveryAddress) {
        return NextResponse.json(
          { error: 'Delivery address is required for Porter delivery' },
          { status: 400 }
        );
      }

      order.deliveryAddress = deliveryAddress;
      order.deliveryFee = 40.0;
      order.deliveryEstimatedMinutes = 25;

      if (!order.breakdown) {
        order.breakdown = {} as any;
      }

      // Add delivery fee to breakdown if not already added
      if (!order.breakdown.deliveryFee) {
        order.breakdown.deliveryFee = 40.0;
        order.totalPrice = +(Number(order.totalPrice || 0) + 40.0).toFixed(2);
      }

      // Initialize DeliveryOrder record for Porter
      const deliveryRecord = {
        _id: `del_${Date.now()}`,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        shopId: order.shopId,
        shopName: order.shopName,
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: recipientPhone || order.customerPhone,
        deliveryAddress,
        deliveryFee: 40.0,
        porterStatus: 'ASSIGNED' as const,
        porterName: 'Vikram Singh (Porter Partner)',
        porterPhone: '+91 98980 88221',
        porterVehicleNumber: 'DL-5S-8812 (Hero Splendor)',
        estimatedDeliveryMinutes: 25,
        trackingUpdates: [
          {
            status: 'ORDER_PLACED',
            timestamp: new Date(),
            description: 'Printing in progress at cyber café. Porter partner assigned.',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (!isFallback) {
        try {
          await DeliveryOrder.create(deliveryRecord);
        } catch (e) {
          console.warn('DeliveryOrder insert error:', e);
        }
      }

      if (!global.memoryStore!.deliveryOrders) {
        global.memoryStore!.deliveryOrders = [];
      }
      global.memoryStore!.deliveryOrders.unshift(deliveryRecord);
    } else {
      order.deliveryFee = 0;
      order.deliveryAddress = undefined;
    }

    order.updatedAt = new Date();

    if (isMongoDoc && typeof order.save === 'function') {
      await order.save();
    } else if (!isFallback) {
      try {
        await Order.findOneAndUpdate(
          { $or: [{ _id: orderId }, { orderNumber: orderId }] },
          {
            $set: {
              fulfillmentType: order.fulfillmentType,
              deliveryAddress: order.deliveryAddress,
              deliveryFee: order.deliveryFee,
              deliveryEstimatedMinutes: order.deliveryEstimatedMinutes,
              totalPrice: order.totalPrice,
              'breakdown.deliveryFee': order.breakdown?.deliveryFee,
              updatedAt: order.updatedAt,
            },
          }
        );
      } catch (err) {
        console.warn('Order DB update error in fulfillment:', err);
      }
    }

    const orderObj = typeof order.toObject === 'function' ? order.toObject() : order;

    // Update in-memory store as well
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
      fulfillmentType: order.fulfillmentType,
      deliveryAddress: order.deliveryAddress,
      deliveryFee: order.deliveryFee,
    };

    emitSocketEvent('order:fulfillment_updated', eventPayload, `order:${order._id}`);
    emitSocketEvent('order:fulfillment_updated', eventPayload, `shop:${order.shopId}`);

    return NextResponse.json({
      success: true,
      message: `Fulfillment method set to ${fulfillmentType}`,
      order: orderObj,
    });
  } catch (error: any) {
    console.error('Fulfillment update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update fulfillment' },
      { status: 500 }
    );
  }
}
