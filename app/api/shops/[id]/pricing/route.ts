import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { Shop } from '@/models/Shop';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isFallback } = await connectDB();
    const shopId = params.id;

    let shop = memoryStore.shops.find((s) => s._id.toString() === shopId || s.id === shopId);
    if (!shop && !isFallback) {
      try {
        shop = await Shop.findById(shopId).lean();
      } catch {}
      if (!shop) {
        try {
          shop = await Shop.findOne({ _id: shopId }).lean();
        } catch {}
      }
    }

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({ pricingRates: shop.pricingRates || {} });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleUpdatePricing(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult =  authorize(req, ['ADMIN', 'SHOP_OWNER']);
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
        { error: 'Unauthorized to update this shop' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const pricingRates = body.pricingRates || body;

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
      memShop.pricingRates = {
        ...memShop.pricingRates,
        ...pricingRates,
      };
      memShop.updatedAt = new Date();
    }

    if (dbShop) {
      dbShop.pricingRates = {
        ...dbShop.pricingRates,
        ...pricingRates,
      };
      dbShop.updatedAt = new Date();
      try {
        await dbShop.save();
      } catch (err) {
        console.warn('DB error saving shop pricing:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing rates saved successfully!',
      pricingRates: memShop?.pricingRates || dbShop?.pricingRates,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PUT = handleUpdatePricing;
export const PATCH = handleUpdatePricing;
