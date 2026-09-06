import { NextRequest, NextResponse } from 'next/server';
import { generateShopQRCodeDataUrl } from '@/services/qrService';
import { connectDB, memoryStore } from '@/lib/db';
import { Shop } from '@/models/Shop';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params;
    const shopId = params.id;
    const { isFallback } = await connectDB();

    let shop: any = null;
    if (!isFallback) {
      try {
        shop = await Shop.findById(shopId).lean();
      } catch (err) {
        // May be string ID
      }
    }

    if (!shop) {
      shop = memoryStore.shops.find((s) => s._id.toString() === shopId);
    }

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const qrDataUrl = await generateShopQRCodeDataUrl(shopId);

    return NextResponse.json({
      shopId,
      shopName: shop.name,
      qrDataUrl,
      targetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://printonline-two.vercel.app'}/shop/${shopId}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
