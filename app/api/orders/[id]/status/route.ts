import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { OrderStatusSchema } from '@/lib/validations';
import { emitSocketEvent } from '@/lib/socketServer';
import { Order } from '@/models/Order';
import { Printer } from '@/models/Printer';

export async function PATCH(
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
    const body = await req.json();

    const parsed = OrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const newStatus = parsed.data.status;

    let order = memoryStore.orders.find(
      (o) => o._id.toString() === orderId || o.orderNumber === orderId
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date();

    const printer = memoryStore.printers.find(
      (p) => p._id.toString() === order.printerId
    );

    // Automation logic for printer status
    if (newStatus === 'PRINTING') {
      order.startedPrintingAt = new Date();
      if (printer) {
        printer.status = 'BUSY';
        printer.currentJobId = order._id.toString();
        printer.currentDocumentName = order.fileName;
        emitSocketEvent('printer:status_updated', {
          printerId: printer._id,
          shopId: printer.shopId,
          status: 'BUSY',
          currentDocumentName: order.fileName,
        }, `shop:${order.shopId}`);
      }
    } else if (['READY', 'PORTER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(newStatus)) {
      if (newStatus === 'COMPLETED' || newStatus === 'DELIVERED') {
        order.completedAt = new Date();
      }
      if (printer && printer.currentJobId === order._id.toString()) {
        printer.status = 'AVAILABLE';
        printer.currentJobId = null;
        printer.currentDocumentName = null;
        printer.totalPrintsCompleted = (printer.totalPrintsCompleted || 0) + (order.pageCount * order.copies || 1);
        emitSocketEvent('printer:status_updated', {
          printerId: printer._id,
          shopId: printer.shopId,
          status: 'AVAILABLE',
          currentDocumentName: null,
        }, `shop:${order.shopId}`);
      }
    }

    // Persist to MongoDB if active
    if (!isFallback) {
      try {
        await Order.findByIdAndUpdate(order._id, {
          status: newStatus,
          startedPrintingAt: order.startedPrintingAt,
          completedAt: order.completedAt,
        });
      } catch (err) {
        console.warn('DB update error, persisted in memory:', err);
      }
    }

    const eventPayload = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      shopId: order.shopId,
      printerId: order.printerId,
      status: newStatus,
      previousStatus,
      updatedAt: order.updatedAt,
    };

    // Emit live real-time WebSocket update to customer order room, shop room, and globally
    emitSocketEvent('order:status_updated', eventPayload, `order:${order._id}`);
    emitSocketEvent('order:status_updated', eventPayload, `shop:${order.shopId}`);
    emitSocketEvent('order:status_updated', eventPayload);

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
