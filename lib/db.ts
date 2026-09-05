import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Global cache for Mongoose in Next.js hot-reload environment
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isFallback: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
  // eslint-disable-next-line no-var
  var memoryStore:
    | {
        users: any[];
        shops: any[];
        printers: any[];
        orders: any[];
        plans: any[];
        payments: any[];
        settings?: any;
        [key: string]: any;
      }
    | undefined;
  // eslint-disable-next-line no-var
  var io: any | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  isFallback: false,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/printporter_db';

// In-Memory Data Store fallback
if (!global.memoryStore) {
  global.memoryStore = {
    users: [],
    shops: [],
    printers: [],
    orders: [],
    plans: [],
    payments: [],
    settings: {
      platformFeeEnabled: false,
      platformFeeType: 'FLAT',
      platformFeeAmount: 0,
      platformFeeLabel: 'Platform Convenience Fee',
    },
  };
}

if (!global.memoryStore.settings) {
  global.memoryStore.settings = {
    platformFeeEnabled: false,
    platformFeeType: 'FLAT',
    platformFeeAmount: 0,
    platformFeeLabel: 'Platform Convenience Fee',
  };
}

export const memoryStore = global.memoryStore;

export async function connectDB(): Promise<{ isFallback: boolean }> {
  if (cached.conn) {
    return { isFallback: cached.isFallback };
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2500, // Fast timeout to failover to in-memory store smoothly
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        cached.isFallback = false;
        console.log('✅ Connected to MongoDB at', MONGODB_URI);
        return m;
      })
      .catch((err) => {
        console.warn('⚠️ MongoDB connection failed (using in-memory resilient store):', err.message);
        cached.isFallback = true;
        // Return dummy object
        return null as any;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.isFallback = true;
  }

  // Ensure default seed data exists in memory/db
  await ensureSeedData();

  return { isFallback: cached.isFallback };
}

export async function ensureSeedData() {
  const store = global.memoryStore!;

  // 1. Check if seed already populated
  if (store.users.length > 0) return;

  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const shopPassword = await bcrypt.hash('Shop@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  // Users
  const adminUser = {
    _id: 'usr_admin_001',
    name: 'Super Admin',
    email: 'admin@printporter.com',
    phone: '+91 98765 43210',
    password: hashedPassword,
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isBlocked: false,
    walletBalance: 25000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const shopOwner1 = {
    _id: 'usr_owner_001',
    name: 'Rajesh Cyber Solutions',
    email: 'rajesh@cyberprint.com',
    phone: '+91 98111 22334',
    password: shopPassword,
    role: 'SHOP_OWNER',
    shopId: 'shop_001',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    isBlocked: false,
    walletBalance: 4200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const shopOwner2 = {
    _id: 'usr_owner_002',
    name: 'Campus Express Print',
    email: 'campus@expressprint.com',
    phone: '+91 98222 33445',
    password: shopPassword,
    role: 'SHOP_OWNER',
    shopId: 'shop_002',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    isBlocked: false,
    walletBalance: 3100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const customerUser = {
    _id: 'usr_cust_001',
    name: 'Aman Sharma',
    email: 'aman@student.edu',
    phone: '+91 98333 44556',
    password: userPassword,
    role: 'CUSTOMER',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    isBlocked: false,
    walletBalance: 250,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  store.users.push(adminUser, shopOwner1, shopOwner2, customerUser);

  // Shops
  const shop1 = {
    _id: 'shop_001',
    name: 'Apex Digital Print & Cyber Cafe',
    ownerId: 'usr_owner_001',
    address: 'Shop 14, Commercial Complex, Sector 18, Noida (Near Metro)',
    location: {
      type: 'Point',
      coordinates: [77.3245, 28.5704],
    },
    phone: '+91 98111 22334',
    email: 'rajesh@cyberprint.com',
    qrCodeUrl: '/api/shops/shop_001/qr',
    isOnline: true,
    isBusy: false,
    rating: 4.9,
    reviewCount: 148,
    currentQueueCount: 2,
    estimatedWaitMinutes: 4,
    capabilities: {
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
    upiId: 'apexprint@upi',
    upiQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dapexprint%40upi%26pn%3DApex%2520Digital%2520Print%26cu%3DINR',
    activePlan: 'Free Launch Plan',
    subscriptionStatus: 'ACTIVE',
    totalRevenue: 14500,
    cashCollected: 6200,
    onlineCollected: 8300,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const shop2 = {
    _id: 'shop_002',
    name: 'Campus Express Copy & Docs',
    ownerId: 'usr_owner_002',
    address: 'Gate 2, University North Campus, Delhi',
    location: {
      type: 'Point',
      coordinates: [77.209, 28.691],
    },
    phone: '+91 98222 33445',
    email: 'campus@expressprint.com',
    qrCodeUrl: '/api/shops/shop_002/qr',
    isOnline: true,
    isBusy: true,
    rating: 4.7,
    reviewCount: 92,
    currentQueueCount: 5,
    estimatedWaitMinutes: 12,
    capabilities: {
      supportedSizes: ['A4', 'Legal'],
      colorPrinting: true,
      duplexPrinting: true,
      supportedBindings: ['None', 'Corner Staple'],
    },
    pricingRates: {
      bwSingle: 1.5,
      bwDuplex: 2.8,
      colorSingle: 8.0,
      colorDuplex: 15.0,
      a3Surcharge: 4.0,
      spiralBinding: 30.0,
      stapleBinding: 3.0,
    },
    upiId: 'campusexpress@upi',
    upiQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dcampusexpress%40upi%26pn%3DCampus%2520Express%26cu%3DINR',
    activePlan: 'Free Launch Plan',
    subscriptionStatus: 'ACTIVE',
    totalRevenue: 8900,
    cashCollected: 4500,
    onlineCollected: 4400,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  store.shops.push(shop1, shop2);

  // Printers
  const printer1 = {
    _id: 'prn_001',
    shopId: 'shop_001',
    name: 'Canon imageRUNNER 2630i (Color Hub)',
    model: 'Canon iR 2630i Digital Multifunction',
    type: 'COLOR',
    paperSizes: ['A4', 'A3', 'Legal'],
    status: 'AVAILABLE',
    ppmSpeed: 30,
    currentJobId: null,
    currentDocumentName: null,
    queueCount: 1,
    totalPrintsCompleted: 2420,
    supportsDuplex: true,
    connectionType: 'NETWORK_IP',
    ipAddress: '192.168.1.105',
    portNumber: 9100,
    isLinked: true,
    pairingCode: 'PP-2630-CANON',
    lastPingAt: new Date(),
    notes: 'High resolution 1200 dpi vibrant color & duplex specialist',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const printer2 = {
    _id: 'prn_002',
    shopId: 'shop_001',
    name: 'HP LaserJet Pro MFP M428fdw (High Speed B&W)',
    model: 'HP LaserJet Pro M428fdw',
    type: 'MONOCHROME',
    paperSizes: ['A4', 'Legal', 'Letter'],
    status: 'AVAILABLE',
    ppmSpeed: 40,
    currentJobId: null,
    currentDocumentName: null,
    queueCount: 1,
    totalPrintsCompleted: 4890,
    supportsDuplex: true,
    connectionType: 'USB_PORT',
    usbPort: 'USB001 (HP Spooler Direct)',
    isLinked: true,
    pairingCode: 'PP-428-HP',
    lastPingAt: new Date(),
    notes: 'Super fast monochrome workhorse, best for notes and thesis',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const printer3 = {
    _id: 'prn_003',
    shopId: 'shop_002',
    name: 'Epson EcoTank L15150 (A3/A4)',
    model: 'Epson EcoTank L15150',
    type: 'COLOR',
    paperSizes: ['A4', 'A3'],
    status: 'BUSY',
    ppmSpeed: 25,
    currentJobId: 'ord_demo_002',
    currentDocumentName: 'Project_Design_Blueprint.pdf',
    queueCount: 3,
    totalPrintsCompleted: 1540,
    supportsDuplex: true,
    connectionType: 'NETWORK_IP',
    ipAddress: '192.168.1.120',
    portNumber: 9100,
    isLinked: true,
    pairingCode: 'PP-1515-EPSON',
    lastPingAt: new Date(),
    notes: 'Precision dye ink printing for diagrams and brochures',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  store.printers.push(printer1, printer2, printer3);

  // Plans: First plan is the Free Launch Plan Active for everyone!
  const planFree = {
    _id: 'plan_launch_free',
    name: 'Free Launch Plan',
    priceMonthly: 0,
    priceYearly: 0,
    maxPrinters: 99,
    commissionRate: 0.0,
    features: [
      '100% Free Platform Access during Launch',
      'Direct Shop UPI QR & Counter Cash Collection',
      'Zero Platform Commission (0% fee)',
      'Unlimited Printer Fleet Link & Monitoring',
      'Live Cloud Order Spooler & Pickup Alerts',
    ],
    isPopular: true,
    isActive: true,
    isLaunchFree: true,
    badge: 'ACTIVE FOR ALL SHOPS',
    colorScheme: 'emerald',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const plan1 = {
    _id: 'plan_starter',
    name: 'Starter Cyber Café',
    priceMonthly: 499,
    priceYearly: 4990,
    maxPrinters: 2,
    commissionRate: 5.0,
    features: [
      'Up to 2 connected printers',
      'Dynamic Shop QR code',
      'Cash & Online payments',
      'Standard queue management',
      'Email support',
    ],
    isPopular: false,
    isActive: true,
    colorScheme: 'slate',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const plan2 = {
    _id: 'plan_pro',
    name: 'Pro Cyber Cafe',
    priceMonthly: 1499,
    priceYearly: 14990,
    maxPrinters: 6,
    commissionRate: 3.0,
    features: [
      'Up to 6 connected printers',
      'Priority search ranking in area',
      'Custom QR with shop logo & badge',
      'Sound alerts on incoming orders',
      'Audited COD reconciliation ledger',
      'Real-time WebSocket instant sync',
      'Priority 24/7 hotline support',
    ],
    isPopular: false,
    isActive: true,
    colorScheme: 'cyan',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const plan3 = {
    _id: 'plan_enterprise',
    name: 'Enterprise Print Network',
    priceMonthly: 3999,
    priceYearly: 39990,
    maxPrinters: 25,
    commissionRate: 1.5,
    features: [
      'Unlimited printer fleet & branches',
      'Lowest platform fee (1.5%)',
      'Custom branding & whitelabel receipts',
      'Automated nightly payouts',
      'Dedicated account manager',
      'Enterprise SLA 99.9%',
    ],
    isPopular: false,
    isActive: true,
    colorScheme: 'purple',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  store.plans.push(planFree, plan1, plan2, plan3);

  // Orders
  const order1 = {
    _id: 'ord_demo_001',
    orderNumber: 'ORD-2026-9041',
    customerId: 'usr_cust_001',
    customerName: 'Aman Sharma',
    customerPhone: '+91 98333 44556',
    shopId: 'shop_001',
    shopName: 'Apex Digital Print & Cyber Cafe',
    printerId: 'prn_001',
    printerName: 'Canon imageRUNNER 2630i (Color Hub)',
    fileUrl: '/sample-document.pdf',
    fileName: 'Machine_Learning_Notes_Unit1.pdf',
    fileType: 'application/pdf',
    fileSizeBytes: 2450000,
    pageCount: 12,
    pageRange: 'All (1-12)',
    copies: 2,
    isColor: true,
    isDuplex: true,
    paperSize: 'A4',
    binding: 'Spiral Binding',
    notes: 'Please bind with transparent front sheet',
    totalPrice: 285.0,
    breakdown: {
      pagesTotal: 24,
      ratePerPage: 9.0,
      printingSubtotal: 216.0,
      bindingFee: 35.0,
      gstAmount: 34.0,
    },
    paymentType: 'CASH',
    paymentStatus: 'PAID',
    status: 'QUEUED',
    queuePosition: 1,
    estimatedWaitMinutes: 3,
    approvedAt: new Date(Date.now() - 1000 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    updatedAt: new Date(),
  };

  store.orders.push(order1);

  // Payments
  const payment1 = {
    _id: 'pay_demo_001',
    orderId: 'ord_demo_001',
    orderNumber: 'ORD-2026-9041',
    shopId: 'shop_001',
    shopName: 'Apex Digital Print & Cyber Cafe',
    customerId: 'usr_cust_001',
    customerName: 'Aman Sharma',
    amount: 285.0,
    paymentType: 'CASH',
    paymentStatus: 'SUCCESS',
    adminCommission: 8.55,
    shopEarnings: 276.45,
    transactionId: 'TXN_CASH_9921',
    approvedAt: new Date(Date.now() - 1000 * 60 * 2),
    notes: 'Counter cash received and confirmed by Rajesh',
    createdAt: new Date(Date.now() - 1000 * 60 * 2),
    updatedAt: new Date(),
  };

  store.payments.push(payment1);
}
