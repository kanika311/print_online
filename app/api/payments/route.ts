import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { Payment } from '@/models/Payment';

export async function GET(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN', 'SHOP_OWNER']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    let payments = memoryStore.payments;

    if (authResult.session?.role === 'SHOP_OWNER') {
      const ownerShopId = authResult.session.shopId || shopId;
      if (ownerShopId) {
        payments = payments.filter((p) => p.shopId === ownerShopId);
      }
    } else if (shopId) {
      payments = payments.filter((p) => p.shopId === shopId);
    }

    // Ledger totals
    const totalVolume = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const cashTotal = payments
      .filter((p) => p.paymentType === 'CASH')
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    const onlineTotal = payments
      .filter((p) => p.paymentType === 'ONLINE')
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalCommission = payments.reduce(
      (acc, p) => acc + (p.adminCommission || 0),
      0
    );
    const totalShopEarnings = payments.reduce(
      (acc, p) => acc + (p.shopEarnings || 0),
      0
    );

    return NextResponse.json({
      payments,
      summary: {
        totalVolume,
        cashTotal,
        onlineTotal,
        totalCommission,
        totalShopEarnings,
        transactionCount: payments.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
