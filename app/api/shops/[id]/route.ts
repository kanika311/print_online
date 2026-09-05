import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { Shop } from '@/models/Shop';
import { Printer } from '@/models/Printer';
import { Order } from '@/models/Order';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isFallback } = await connectDB();
    const shopId = params.id;

    let shop: any = null;
    if (!isFallback) {
      try {
        shop = await Shop.findById(shopId).lean();
      } catch (err) {
        // May be formatted as custom string id
      }
    }

    if (!shop) {
      shop = memoryStore.shops.find((s) => s._id.toString() === shopId);
    }

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Get shop printers
    let printers: any[] = [];
    if (!isFallback) {
      try {
        printers = await Printer.find({ shopId }).lean();
      } catch {
        printers = memoryStore.printers.filter((p) => p.shopId === shopId);
      }
    } else {
      printers = memoryStore.printers.filter((p) => p.shopId === shopId);
    }

    // Get active queue orders
    let activeOrders: any[] = [];
    if (!isFallback) {
      try {
        activeOrders = await Order.find({
          shopId,
          status: { $in: ['QUEUED', 'PRINTING'] },
        }).lean();
      } catch {
        activeOrders = memoryStore.orders.filter(
          (o) => o.shopId === shopId && ['QUEUED', 'PRINTING'].includes(o.status)
        );
      }
    } else {
      activeOrders = memoryStore.orders.filter(
        (o) => o.shopId === shopId && ['QUEUED', 'PRINTING'].includes(o.status)
      );
    }

    // Calculate total pages in queue
    const queuePages = activeOrders.reduce(
      (acc, o) => acc + (o.pageCount * o.copies || 1),
      0
    );

    const availablePrinters = printers.filter((p) => p.status === 'AVAILABLE');
    const busyPrinters = printers.filter((p) => p.status === 'BUSY');
    const offlinePrinters = printers.filter((p) => p.status === 'OFFLINE');

    return NextResponse.json({
      shop: {
        ...shop,
        id: shop._id,
        currentQueueCount: activeOrders.length,
        estimatedWaitMinutes: Math.max(2, Math.ceil(queuePages / 30) + activeOrders.length),
      },
      printers,
      stats: {
        totalPrinters: printers.length,
        available: availablePrinters.length,
        busy: busyPrinters.length,
        offline: offlinePrinters.length,
        activeQueueLength: activeOrders.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching shop detail:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shop detail' },
      { status: 500 }
    );
  }
}

// PATCH: Allow printer owner or admin to update pricing rates and online status
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
    const shopId = params.id;
    const body = await req.json();

    const shop = memoryStore.shops.find(
      (s) => s._id.toString() === shopId
    );

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (body.pricingRates) {
      shop.pricingRates = {
        ...shop.pricingRates,
        ...body.pricingRates,
      };
    }

    if (body.upiId !== undefined) shop.upiId = String(body.upiId);
    if (body.upiQrUrl !== undefined) shop.upiQrUrl = String(body.upiQrUrl);
    if (body.activePlan !== undefined) shop.activePlan = String(body.activePlan);
    if (body.isOnline !== undefined) shop.isOnline = Boolean(body.isOnline);
    if (body.isBusy !== undefined) shop.isBusy = Boolean(body.isBusy);
    if (body.isActive !== undefined && authResult.session?.role === 'ADMIN') {
      shop.isActive = Boolean(body.isActive);
    }

    shop.updatedAt = new Date();

    if (!isFallback) {
      try {
        await Shop.findByIdAndUpdate(shop._id, {
          pricingRates: shop.pricingRates,
          upiId: shop.upiId,
          upiQrUrl: shop.upiQrUrl,
          activePlan: shop.activePlan,
          isOnline: shop.isOnline,
          isBusy: shop.isBusy,
          isActive: shop.isActive,
        });
      } catch (err) {
        console.warn('DB update error in shop PATCH:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Shop settings updated successfully',
      shop,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update shop' },
      { status: 500 }
    );
  }
}
