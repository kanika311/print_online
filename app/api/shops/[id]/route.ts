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
      } catch (err) {
        console.warn('DB query error for shop printers:', err);
      }
    }

    const memPrinters = memoryStore.printers.filter((p) => p.shopId === shopId);
    if (!printers || printers.length === 0) {
      printers = memPrinters;
    } else if (memPrinters.length > 0) {
      const existingIds = new Set(printers.map((p: any) => (p._id || p.id).toString()));
      for (const mp of memPrinters) {
        if (!existingIds.has((mp._id || mp.id).toString())) {
          printers.push(mp);
        }
      }
    }

    // Get active queue orders
    let activeOrders: any[] = [];
    if (!isFallback) {
      try {
        activeOrders = await Order.find({
          shopId,
          status: { $in: ['QUEUED', 'PRINTING'] },
        }).lean();
      } catch (err) {
        console.warn('DB query error for shop orders:', err);
      }
    }

    const memOrders = memoryStore.orders.filter(
      (o) => o.shopId === shopId && ['QUEUED', 'PRINTING'].includes(o.status)
    );
    if (!activeOrders || activeOrders.length === 0) {
      activeOrders = memOrders;
    } else if (memOrders.length > 0) {
      const existingIds = new Set(activeOrders.map((o: any) => (o._id || o.id).toString()));
      for (const mo of memOrders) {
        if (!existingIds.has((mo._id || mo.id).toString())) {
          activeOrders.push(mo);
        }
      }
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
// PATCH / PUT: Allow printer owner or admin to update pricing rates, UPI settings and online status
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

    let memShop = memoryStore.shops.find(
      (s) => s._id.toString() === shopId || (s.id && s.id.toString() === shopId)
    );

    let dbShop: any = null;
    if (!isFallback) {
      try {
        dbShop = await Shop.findById(shopId);
      } catch (err) {}
      if (!dbShop) {
        try {
          dbShop = await Shop.findOne({ _id: shopId });
        } catch (err) {}
      }
    }

    if (!memShop && !dbShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (body.pricingRates) {
      if (memShop) {
        memShop.pricingRates = {
          ...memShop.pricingRates,
          ...body.pricingRates,
        };
      }
      if (dbShop) {
        dbShop.pricingRates = {
          ...dbShop.pricingRates,
          ...body.pricingRates,
        };
      }
    }

    if (body.name !== undefined) {
      const val = String(body.name);
      if (memShop) memShop.name = val;
      if (dbShop) dbShop.name = val;
    }
    if (body.address !== undefined) {
      const val = String(body.address);
      if (memShop) memShop.address = val;
      if (dbShop) dbShop.address = val;
    }
    if (body.phone !== undefined) {
      const val = String(body.phone).trim().replace(/[\s\-\(\)\+]/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
      if (val && !/^[6-9]\d{9}$/.test(val)) {
        return NextResponse.json(
          { error: 'Shop phone must be a valid 10-digit Indian mobile number' },
          { status: 400 }
        );
      }
      if (memShop) memShop.phone = val;
      if (dbShop) dbShop.phone = val;
    }
    if (body.ownerName !== undefined) {
      const val = String(body.ownerName).trim();
      if (memShop) memShop.ownerName = val;
      if (dbShop) dbShop.ownerName = val;
    }
    if (body.ownerPhone !== undefined) {
      const val = String(body.ownerPhone).trim().replace(/[\s\-\(\)\+]/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
      if (val && !/^[6-9]\d{9}$/.test(val)) {
        return NextResponse.json(
          { error: 'Owner phone must be a valid 10-digit Indian mobile number' },
          { status: 400 }
        );
      }
      if (memShop) memShop.ownerPhone = val;
      if (dbShop) dbShop.ownerPhone = val;
    }
    if (body.startingPrice !== undefined) {
      const val = Number(body.startingPrice);
      if (memShop) memShop.startingPrice = val;
      if (dbShop) dbShop.startingPrice = val;
    }
    if (body.upiId !== undefined) {
      const val = String(body.upiId).trim();
      if (val && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(val)) {
        return NextResponse.json(
          { error: 'Invalid UPI ID format (e.g. shopname@upi or 9876543210@paytm)' },
          { status: 400 }
        );
      }
      if (memShop) memShop.upiId = val;
      if (dbShop) dbShop.upiId = val;
    }
    if (body.upiQrUrl !== undefined) {
      const val = String(body.upiQrUrl).trim();
      if (memShop) memShop.upiQrUrl = val;
      if (dbShop) dbShop.upiQrUrl = val;
    }
    if (body.activePlan !== undefined) {
      const val = String(body.activePlan);
      if (memShop) memShop.activePlan = val;
      if (dbShop) dbShop.activePlan = val;
    }
    if (body.isOnline !== undefined) {
      const val = Boolean(body.isOnline);
      if (memShop) memShop.isOnline = val;
      if (dbShop) dbShop.isOnline = val;
    }
    if (body.isBusy !== undefined) {
      const val = Boolean(body.isBusy);
      if (memShop) memShop.isBusy = val;
      if (dbShop) dbShop.isBusy = val;
    }
    if (body.isActive !== undefined && authResult.session?.role === 'ADMIN') {
      const val = Boolean(body.isActive);
      if (memShop) memShop.isActive = val;
      if (dbShop) dbShop.isActive = val;
    }

    const now = new Date();
    if (memShop) memShop.updatedAt = now;

    if (dbShop && !isFallback) {
      dbShop.updatedAt = now;
      try {
        await dbShop.save();
      } catch (err) {
        console.warn('DB update error in shop PATCH/PUT:', err);
      }
    }

    const resultShop = memShop || dbShop?.toObject?.() || dbShop;

    return NextResponse.json({
      success: true,
      message: 'Shop settings updated successfully',
      shop: {
        ...resultShop,
        id: resultShop._id,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update shop' },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;

// DELETE: Allow Super Admin to delete shop and associated printers
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authorize(req, ['ADMIN']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const shopId = params.id;

    const shopIndex = memoryStore.shops.findIndex(
      (s) => s._id.toString() === shopId
    );

    if (shopIndex === -1) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    memoryStore.shops.splice(shopIndex, 1);
    memoryStore.printers = memoryStore.printers.filter((p) => p.shopId !== shopId);

    if (!isFallback) {
      try {
        await Shop.findByIdAndDelete(shopId);
        await Printer.deleteMany({ shopId });
      } catch (err) {
        console.warn('DB delete error in shop DELETE:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Shop removed successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete shop' },
      { status: 500 }
    );
  }
}
