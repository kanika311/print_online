import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { Shop } from '@/models/Shop';

async function handleUpdatePlan(
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
    const shopId = params.id;

    if (
      authResult.session?.role === 'SHOP_OWNER' &&
      authResult.session.shopId &&
      authResult.session.shopId !== shopId
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to update this shop plan' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const planName = body.planName || body.planId || body.activePlan || 'Free Launch Plan';

    let memShop = memoryStore.shops.find((s) => s._id.toString() === shopId || s.id === shopId);
    let dbShop: any = null;

    if (!isFallback) {
      try {
        dbShop = await Shop.findById(shopId);
      } catch {}
      if (!dbShop) {
        try {
          dbShop = await Shop.findOne({ _id: shopId });
        } catch {}
      }
    }

    if (!memShop && !dbShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (memShop) {
      memShop.activePlan = planName;
      memShop.updatedAt = new Date();
    }

    if (dbShop) {
      dbShop.activePlan = planName;
      dbShop.updatedAt = new Date();
      try {
        await dbShop.save();
      } catch (err) {
        console.warn('DB error updating shop plan:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Subscription plan updated to "${planName}"!`,
      activePlan: planName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const POST = handleUpdatePlan;
export const PATCH = handleUpdatePlan;
export const PUT = handleUpdatePlan;
