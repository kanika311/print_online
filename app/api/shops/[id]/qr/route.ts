import { NextRequest, NextResponse } from 'next/server';
import { generateShopQRCodeDataUrl } from '@/services/qrService';
import { connectDB, memoryStore } from '@/lib/db';
import { Shop } from '@/models/Shop';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shopId = params.id;
    await connectDB();

    const shop = memoryStore.shops.find((s) => s._id.toString() === shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const qrDataUrl = await generateShopQRCodeDataUrl(shopId);

    return NextResponse.json({
      shopId,
      shopName: shop.name,
      qrDataUrl,
      targetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop/${shopId}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
