import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize, hashPassword } from '@/lib/auth';
import { ShopRegisterSchema } from '@/lib/validations';
import { generateShopQRCodeDataUrl } from '@/services/qrService';
import { Shop } from '@/models/Shop';
import { User } from '@/models/User';
import { Printer } from '@/models/Printer';

export async function GET(req: NextRequest) {
  try {
    const { isFallback } = await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase() || '';

    let shops: any[] = [];
    if (!isFallback) {
      try {
        shops = await Shop.find({}).lean();
      } catch (err) {
        console.warn('DB query error, using memory store:', err);
        shops = memoryStore.shops;
      }
    } else {
      shops = memoryStore.shops;
    }

    if (search) {
      shops = shops.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.address.toLowerCase().includes(search)
      );
    }

    // Attach printer counts & active printers info
    const enrichedShops = await Promise.all(
      shops.map(async (shop) => {
        let printers: any[] = [];
        if (!isFallback) {
          try {
            printers = await Printer.find({ shopId: shop._id.toString() }).lean();
          } catch {
            printers = memoryStore.printers.filter(
              (p) => p.shopId === shop._id.toString()
            );
          }
        } else {
          printers = memoryStore.printers.filter(
            (p) => p.shopId === shop._id.toString()
          );
        }

        const availablePrinters = printers.filter((p) => p.status === 'AVAILABLE').length;
        const busyPrinters = printers.filter((p) => p.status === 'BUSY').length;

        return {
          ...shop,
          id: shop._id,
          totalPrinters: printers.length,
          availablePrinters,
          busyPrinters,
        };
      })
    );

    return NextResponse.json({ shops: enrichedShops });
  } catch (error: any) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shops' },
      { status: 500 }
    );
  }
}

// Admin only: Register new printer shop and create printer-owner login credentials
export async function POST(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const body = await req.json();

    const parsed = ShopRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      name,
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
      address,
      lat,
      lng,
      activePlan,
      capabilities,
    } = parsed.data;

    // Check if user with ownerEmail already exists
    const existingOwner = memoryStore.users.find(
      (u) => u.email.toLowerCase() === ownerEmail.toLowerCase()
    );
    if (existingOwner) {
      return NextResponse.json(
        { error: 'A user with this owner email already exists' },
        { status: 409 }
      );
    }

    const shopId = `shop_${Date.now()}`;
    const ownerId = `usr_owner_${Date.now()}`;
    const hashedPassword = await hashPassword(ownerPassword);

    // 1. Create Owner User
    const ownerUser = {
      _id: ownerId,
      name: ownerName,
      email: ownerEmail.toLowerCase(),
      phone: ownerPhone,
      password: hashedPassword,
      role: 'SHOP_OWNER' as const,
      shopId,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(ownerName)}`,
      isBlocked: false,
      walletBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 2. Generate QR Code for shop
    const qrCodeUrl = await generateShopQRCodeDataUrl(shopId);

    // 3. Create Shop
    const newShop = {
      _id: shopId,
      name,
      ownerId,
      address,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      phone: ownerPhone,
      email: ownerEmail,
      qrCodeUrl,
      isOnline: true,
      isBusy: false,
      rating: 5.0,
      reviewCount: 0,
      currentQueueCount: 0,
      estimatedWaitMinutes: 3,
      capabilities: capabilities || {
        supportedSizes: ['A4', 'A3', 'Legal', 'Letter'],
        colorPrinting: true,
        duplexPrinting: true,
        supportedBindings: ['None', 'Corner Staple', 'Spiral Binding'],
      },
      pricingRates: {
        bwSingle: 2.0,
        bwDuplex: 3.5,
        colorSingle: 10.0,
        colorDuplex: 18.0,
        a3Surcharge: 5.0,
        spiralBinding: 35.0,
        stapleBinding: 5.0,
      },
      activePlan: activePlan || 'Pro Cyber Cafe',
      subscriptionStatus: 'ACTIVE',
      totalRevenue: 0,
      cashCollected: 0,
      onlineCollected: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 4. Create default printer for the shop
    const defaultPrinter = {
      _id: `prn_${Date.now()}`,
      shopId,
      name: `${name} Primary Multifunction`,
      model: 'Canon / HP Pro Series',
      type: 'COLOR' as const,
      paperSizes: ['A4', 'Legal', 'Letter'],
      status: 'AVAILABLE' as const,
      ppmSpeed: 30,
      currentJobId: null,
      currentDocumentName: null,
      queueCount: 0,
      totalPrintsCompleted: 0,
      supportsDuplex: true,
      notes: 'Initial standard printer configured during onboarding',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isFallback) {
      try {
        await User.create(ownerUser);
        await Shop.create(newShop);
        await Printer.create(defaultPrinter);
      } catch (err) {
        console.warn('DB creation error, stored in memory:', err);
        memoryStore.users.push(ownerUser);
        memoryStore.shops.push(newShop);
        memoryStore.printers.push(defaultPrinter);
      }
    } else {
      memoryStore.users.push(ownerUser);
      memoryStore.shops.push(newShop);
      memoryStore.printers.push(defaultPrinter);
    }

    return NextResponse.json({
      success: true,
      message: 'Shop registered successfully and owner credentials created!',
      shop: newShop,
      credentials: {
        email: ownerEmail,
        password: ownerPassword, // Returned once so admin can view/copy
        loginUrl: '/printer/login',
      },
    });
  } catch (error: any) {
    console.error('Error registering shop:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register shop' },
      { status: 500 }
    );
  }
}

// Admin: Activate or Deactivate shop
export async function PATCH(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const body = await req.json();
    const { shopId, isActive } = body;

    const shop = memoryStore.shops.find(
      (s) => s._id.toString() === shopId
    );

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    shop.isActive = Boolean(isActive);
    shop.updatedAt = new Date();

    if (!isFallback) {
      try {
        await Shop.findByIdAndUpdate(shop._id, { isActive: shop.isActive });
      } catch (err) {
        console.warn('DB update error in shop activation PATCH:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Shop ${shop.isActive ? 'activated' : 'deactivated'} successfully`,
      shop,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update shop status' },
      { status: 500 }
    );
  }
}

