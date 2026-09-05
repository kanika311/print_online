import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN', 'SHOP_OWNER']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    let targetShopId = searchParams.get('shopId');

    if (authResult.session?.role === 'SHOP_OWNER') {
      targetShopId = authResult.session.shopId || targetShopId;
    }

    let orders = memoryStore.orders;
    let printers = memoryStore.printers;
    let payments = memoryStore.payments;

    if (targetShopId) {
      orders = orders.filter((o) => o.shopId === targetShopId);
      printers = printers.filter((p) => p.shopId === targetShopId);
      payments = payments.filter((p) => p.shopId === targetShopId);
    }

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
    const queuedOrders = orders.filter((o) => ['QUEUED', 'PENDING'].includes(o.status)).length;
    const printingOrders = orders.filter((o) => o.status === 'PRINTING').length;

    const totalPagesPrinted = orders.reduce(
      (acc, o) => acc + (o.pageCount * o.copies || 1),
      0
    );

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((acc, o) => acc + (o.totalPrice || 0), 0);

    const cashRevenue = payments
      .filter((p) => p.paymentType === 'CASH')
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const onlineRevenue = payments
      .filter((p) => p.paymentType === 'ONLINE')
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const availablePrinters = printers.filter((p) => p.status === 'AVAILABLE').length;
    const busyPrinters = printers.filter((p) => p.status === 'BUSY').length;
    const offlinePrinters = printers.filter((p) => p.status === 'OFFLINE').length;

    // Simulated 7-day revenue trend
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const revenueTrend = days.map((day, idx) => ({
      day,
      revenue: Math.round(500 + Math.random() * 1200 + (idx === 6 ? 800 : 0)),
      orders: Math.round(8 + Math.random() * 20),
    }));

    return NextResponse.json({
      kpis: {
        totalRevenue,
        cashRevenue,
        onlineRevenue,
        totalOrders,
        completedOrders,
        queuedOrders,
        printingOrders,
        totalPagesPrinted,
        printersCount: printers.length,
        availablePrinters,
        busyPrinters,
        offlinePrinters,
        totalShops: memoryStore.shops.length,
        totalUsers: memoryStore.users.length,
      },
      revenueTrend,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
