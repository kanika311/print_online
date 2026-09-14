import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { calculateQueueEstimate } from '@/services/queueService';
import { Order } from '@/models/Order';
import { Printer } from '@/models/Printer';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isFallback } = await connectDB();
    const orderId = params.id;

    let order: any = null;
    if (!isFallback) {
      try {
        order = await Order.findOne({
          $or: [{ _id: orderId }, { orderNumber: orderId }],
        }).lean();
      } catch (err) {
        console.warn('MongoDB order query error:', err);
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

    // Dynamic queue position calculation:
    // Orders ahead for the same printer created before this order that are still QUEUED or PRINTING
    let queueAheadCount = 0;
    let pendingPagesAhead = 0;

    if (['PENDING', 'QUEUED', 'PRINTING'].includes(order.status)) {
      let activeOrdersForPrinter: any[] = [];
      if (!isFallback) {
        try {
          activeOrdersForPrinter = await Order.find({
            printerId: order.printerId,
            status: { $in: ['QUEUED', 'PRINTING'] },
            createdAt: { $lt: new Date(order.createdAt) },
            _id: { $ne: order._id },
          }).lean();
        } catch {
          activeOrdersForPrinter = [];
        }
      }

      if (activeOrdersForPrinter.length === 0) {
        activeOrdersForPrinter = memoryStore.orders.filter(
          (o) =>
            o.printerId === order.printerId &&
            ['QUEUED', 'PRINTING'].includes(o.status) &&
            new Date(o.createdAt).getTime() < new Date(order.createdAt).getTime() &&
            o._id.toString() !== order._id.toString()
        );
      }

      queueAheadCount = activeOrdersForPrinter.length;
      pendingPagesAhead = activeOrdersForPrinter.reduce(
        (acc, o) => acc + (o.pageCount * o.copies || 1),
        0
      );
    }

    let printer: any = null;
    if (!isFallback) {
      try {
        printer = await Printer.findById(order.printerId).lean();
      } catch {}
    }
    if (!printer) {
      printer = memoryStore.printers.find(
        (p) => p._id.toString() === order.printerId
      );
    }

    const estimate = calculateQueueEstimate({
      queueAheadCount,
      totalPendingPagesAhead: pendingPagesAhead,
      printerPpmSpeed: printer?.ppmSpeed || 30,
      currentJobPages: order.pageCount * order.copies,
    });

    const isPrintingNow = order.status === 'PRINTING';
    const dynamicPosition = isPrintingNow ? 1 : queueAheadCount + 1;
    const dynamicETA = isPrintingNow ? 1 : estimate.estimatedWaitMinutes;

    return NextResponse.json({
      order: {
        ...order,
        queuePosition: dynamicPosition,
        estimatedWaitMinutes: dynamicETA,
        statusLabel: isPrintingNow ? 'Printing now on machine' : estimate.statusLabel,
      },
      printer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
