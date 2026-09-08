import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { generateShopQRCodeDataUrl } from '@/services/qrService';
import { Shop } from '@/models/Shop';
import { User } from '@/models/User';
import { Printer } from '@/models/Printer';

export async function POST(req: NextRequest) {
  try {
    const { isFallback } = await connectDB();
    const body = await req.json();

    const {
      ownerName,
      ownerEmail,
      ownerPhone,
      password,
      shopName,
      address,
      city = 'Noida',
      area = 'Sector 18',
      pincode = '201301',
      lat = 28.5704,
      lng = 77.3245,
      printerName = 'HP LaserJet Pro',
      printerModel = 'MFP M428fdw',
      printerType = 'MONOCHROME',
      bwPrice = 2.0,
      colorPrice = 10.0,
      duplexPrice = 3.5,
      supportsDuplex = true,
      paperSizes = ['A4', 'Legal'],
      bindingAvailability = true,
    } = body;

    if (!ownerName || !ownerEmail || !ownerPhone || !password || !shopName || !address) {
      return NextResponse.json(
        { error: 'Please provide all required owner and shop information' },
        { status: 400 }
      );
    }

    // Check if owner with email or phone already exists
    let existingUser: any = null;
    if (!isFallback) {
      try {
        existingUser = await User.findOne({
          $or: [{ email: ownerEmail.toLowerCase() }, { phone: ownerPhone }],
        });
      } catch (err) {
        console.warn('DB query failed, checking memory:', err);
      }
    }

    if (!existingUser) {
      existingUser = memoryStore.users.find(
        (u) =>
          u.email.toLowerCase() === ownerEmail.toLowerCase() ||
          u.phone === ownerPhone
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or phone number already exists' },
        { status: 409 }
      );
    }

    const shopId = `shop_${Date.now()}`;
    const ownerId = `usr_owner_${Date.now()}`;
    const hashedPassword = await hashPassword(password);

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

    // 2. Generate QR code for shop
    const qrCodeUrl = await generateShopQRCodeDataUrl(shopId);

    // 3. Create Shop
    const fullAddress = `${address}, ${area}, ${city} - ${pincode}`;
    const newShop = {
      _id: shopId,
      name: shopName,
      ownerId,
      address: fullAddress,
      location: {
        type: 'Point',
        coordinates: [Number(lng) || 77.3245, Number(lat) || 28.5704],
      },
      phone: ownerPhone,
      email: ownerEmail.toLowerCase(),
      qrCodeUrl,
      upiId: `${shopName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
      upiQrUrl: '',
      isActive: true,
      isOnline: true,
      isBusy: false,
      rating: 5.0,
      reviewCount: 1,
      currentQueueCount: 0,
      estimatedWaitMinutes: 2,
      capabilities: {
        supportedSizes: paperSizes,
        colorPrinting: printerType === 'COLOR',
        duplexPrinting: Boolean(supportsDuplex),
        supportedBindings: bindingAvailability
          ? ['None', 'Corner Staple', 'Spiral Binding']
          : ['None'],
      },
      pricingRates: {
        bwSingle: Number(bwPrice) || 2.0,
        bwDuplex: Number(duplexPrice) || 3.5,
        colorSingle: Number(colorPrice) || 10.0,
        colorDuplex: (Number(colorPrice) || 10.0) * 1.8,
        a3Surcharge: 5.0,
        spiralBinding: bindingAvailability ? 35.0 : 0,
        stapleBinding: 5.0,
      },
      activePlan: 'Free Launch Plan',
      subscriptionStatus: 'ACTIVE' as const,
      totalRevenue: 0,
      cashCollected: 0,
      onlineCollected: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 4. Create Initial Printer
    const initialPrinter = {
      _id: `prn_${Date.now()}`,
      shopId,
      name: printerName,
      model: printerModel,
      type: (printerType === 'COLOR' ? 'COLOR' : 'MONOCHROME') as any,
      paperSizes,
      status: 'AVAILABLE' as const,
      ppmSpeed: 35,
      currentJobId: null,
      currentDocumentName: null,
      queueCount: 0,
      totalPrintsCompleted: 0,
      supportsDuplex: Boolean(supportsDuplex),
      connectionType: 'NETWORK_IP' as const,
      ipAddress: '192.168.1.100',
      portNumber: 9100,
      isLinked: true,
      pairingCode: `PRINLY-${Date.now().toString().slice(-4)}`,
      lastPingAt: new Date(),
      notes: 'Initial primary workhorse connected during Prinly onboarding',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isFallback) {
      try {
        await User.create(ownerUser);
        await Shop.create(newShop);
        await Printer.create(initialPrinter);
      } catch (err) {
        console.warn('MongoDB save error, storing in memoryStore:', err);
        memoryStore.users.push(ownerUser);
        memoryStore.shops.push(newShop);
        memoryStore.printers.push(initialPrinter);
      }
    } else {
      memoryStore.users.push(ownerUser);
      memoryStore.shops.push(newShop);
      memoryStore.printers.push(initialPrinter);
    }

    // 5. Generate Auth Token
    const token = signToken({
      userId: ownerId,
      name: ownerName,
      email: ownerEmail.toLowerCase(),
      role: 'SHOP_OWNER',
      shopId,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Your Prinly Hub has been onboarded successfully!',
      user: {
        id: ownerId,
        name: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        role: 'SHOP_OWNER',
        shopId,
      },
      shop: newShop,
      token,
    });

    // Set cookie
    response.cookies.set('printporter_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Error in printer onboarding:', error);
    return NextResponse.json(
      { error: error.message || 'Server error during printer owner registration' },
      { status: 500 }
    );
  }
}
