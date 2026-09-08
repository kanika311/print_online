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
    cms: null,
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

export const defaultCmsConfig = {
  version: '1.0.0',
  status: 'PUBLISHED',
  publishedAt: new Date(),
  hero: {
    badge: 'Smart Cyber Cafe Print Network • Zero Waiting Time',
    headlinePart1: 'Your Documents.',
    headlinePart2: 'Printed Nearby.',
    subheading:
      'Upload online, choose a nearby Prinly Hub, pay digitally and collect your prints without waiting in line.',
    primaryCtaText: 'Find a Printing Hub',
    primaryCtaLink: '#nearby-shops',
    secondaryCtaText: 'Become a Prinly Hub',
    secondaryCtaLink: '/printer/register',
    stat1Number: '~2 Mins',
    stat1Label: 'Avg. Collection Time',
    stat2Number: '₹0 Fee',
    stat2Label: 'Direct Shop UPI',
    stat3Number: '100% Private',
    stat3Label: 'Auto-deleted Files',
  },
  roles: {
    userCard: {
      tag: 'FOR CUSTOMERS',
      title: 'Print documents from anywhere',
      description:
        'Upload your documents, find a nearby Prinly printing hub, customize your print settings, pay digitally, and collect your prints.',
      primaryCta: 'Continue as User',
      secondaryCta: 'Login / Register',
    },
    printerCard: {
      tag: 'FOR PRINTER & CYBER CAFE OWNERS',
      title: 'Turn your printer into a Prinly Hub',
      description:
        'Register your cyber cafe or printing shop, receive online print orders, manage your printer queue, and grow your local printing business.',
      primaryCta: 'Register Your Printer',
      secondaryCta: 'Printer Owner Login',
    },
  },
  sections: [
    { id: 'perspectives', title: 'Role Perspectives', visible: true, order: 1 },
    { id: 'hero', title: 'Hero Banner', visible: true, order: 2 },
    { id: 'network', title: 'Interactive 3D Network', visible: true, order: 3 },
    { id: 'howItWorks', title: 'How Prinly Works', visible: true, order: 4 },
    { id: 'nearbyHubs', title: 'Nearby Printing Hubs', visible: true, order: 5 },
    { id: 'features', title: 'Platform Benefits', visible: true, order: 6 },
    { id: 'printerCta', title: 'Printer Hub Partner CTA', visible: true, order: 7 },
    { id: 'faq', title: 'Frequently Asked Questions', visible: true, order: 8 },
    { id: 'footer', title: 'Footer Section', visible: true, order: 9 },
  ],
  features: [
    {
      id: 'feat_1',
      title: 'Zero Queue Cloud Spooling',
      description:
        'Files are pre-processed and sent directly to the shop’s active printer tray. No standing in counter lines.',
      badge: 'High Speed',
    },
    {
      id: 'feat_2',
      title: 'Direct Shopkeeper UPI / Cash',
      description:
        'Pay directly to the local shopkeeper using GPay, PhonePe, Paytm, or choose cash on collection.',
      badge: 'Transparent',
    },
    {
      id: 'feat_3',
      title: 'Total Document Privacy',
      description:
        '256-bit SSL encrypted transit. Uploaded files are automatically erased right after printing.',
      badge: 'Confidential',
    },
    {
      id: 'feat_4',
      title: 'Full Format & Duplex Freedom',
      description:
        'Support for PDF, Word docs, images, colored brochures, spiral binding, and staple options.',
      badge: 'Flexible',
    },
  ],
  howItWorksCustomer: [
    {
      step: 1,
      title: 'Select a Nearby Hub',
      description: 'Pick any local cyber cafe on the GPS radar or scan their counter QR standee.',
      badge: 'Step 1',
    },
    {
      step: 2,
      title: 'Upload & Configure',
      description: 'Upload your document and choose B&W/Color, Duplex, Copies, and paper size.',
      badge: 'Step 2',
    },
    {
      step: 3,
      title: 'Pay & Collect Instantly',
      description: 'Pay via Shop UPI or counter cash and grab your warm prints hot off the tray.',
      badge: 'Step 3',
    },
  ],
  howItWorksHub: [
    {
      step: 1,
      title: 'Register Your Shop',
      description: 'Set up your hub profile, printer models, paper types, and custom per-page pricing.',
      badge: 'Step 1',
    },
    {
      step: 2,
      title: 'Receive Real-time Orders',
      description: 'Incoming customer orders arrive with audible sound alerts and live spool notifications.',
      badge: 'Step 2',
    },
    {
      step: 3,
      title: 'Confirm Payment & Grow',
      description: 'Confirm counter cash or UPI settlements, hand over prints, and build customer loyalty.',
      badge: 'Step 3',
    },
  ],
  faqs: [
    {
      id: 'faq_1',
      question: 'How do I print a document using Prinly?',
      answer:
        'Simply select a nearby Prinly hub or scan their counter QR code, upload your file (PDF, DOCX, or Image), customize your print settings (Color/B&W, Duplex), and pay digitally or in cash upon arrival.',
    },
    {
      id: 'faq_2',
      question: 'Are my uploaded documents secure and private?',
      answer:
        'Yes. Prinly uses 256-bit TLS encryption in transit. Files are only accessible to the designated printer for output and are automatically purged from the spooler after printing.',
    },
    {
      id: 'faq_3',
      question: 'How can cyber cafe or printer owners join Prinly?',
      answer:
        'Click on "Join as a Printing Hub" or "Register Your Printer". Complete our 5-minute onboarding with your shop details, printer fleet, and pricing. You will immediately start receiving online print orders from nearby students and professionals.',
    },
    {
      id: 'faq_4',
      question: 'What payment methods are supported?',
      answer:
        'Prinly supports direct UPI payments (Google Pay, PhonePe, Paytm), credit/debit cards, net banking, and cash at counter upon pickup.',
    },
    {
      id: 'faq_5',
      question: 'What is the Counter QR Standee?',
      answer:
        'Every Prinly partner shop receives a unique QR standee. Customers can simply walk in, scan the QR with any camera, upload their documents on the spot, and have them print out automatically without using WhatsApp or USB drives.',
    },
  ],
  testimonials: [
    {
      id: 't_1',
      name: 'Aman Sharma',
      role: 'Engineering Student, Delhi University',
      comment:
        'I used to waste 25 minutes waiting in queue outside the college cyber cafe before exams. With Prinly, I upload my assignment from hostel, walk in, and collect it instantly!',
      rating: 5,
    },
    {
      id: 't_2',
      name: 'Rajesh Gupta',
      role: 'Owner, Apex Digital Print & Cyber Cafe',
      comment:
        'Prinly increased my daily print volume by 40%. Students order online before reaching the shop, my printer keeps working smoothly without crowd bottlenecks, and payments come directly to my UPI.',
      rating: 5,
    },
    {
      id: 't_3',
      name: 'Pooja Verma',
      role: 'Chartered Accountant',
      comment:
        'Confidential tax audits require high privacy. Sending files on WhatsApp to strangers was always risky. Prinly gives clean, private printing without sharing my phone number.',
      rating: 5,
    },
  ],
  footer: {
    logoText: 'Prinly.in',
    tagline: 'Smart Cyber Cafe Print Network',
    description:
      'Prinly bridges remote digital documents with local cyber cafes and smart printers. Upload anywhere, print nearby, and collect instantly.',
    contactEmail: 'support@prinly.in',
    contactPhone: '+91 98111 22334',
    contactAddress: 'Prinly Technologies Inc., Sector 18, Commercial Hub, NCR, India',
    socialTwitter: 'https://twitter.com/prinly_in',
    socialInstagram: 'https://instagram.com/prinly.in',
    socialLinkedin: 'https://linkedin.com/company/prinly',
    quickLinks: [
      { label: 'Home', url: '/' },
      { label: 'Find Printing Hub', url: '#nearby-shops' },
      { label: 'Become a Hub', url: '/printer/register' },
      { label: 'How It Works', url: '#how-it-works' },
      { label: 'User Dashboard', url: '/user/dashboard' },
      { label: 'Printer Dashboard', url: '/printer/dashboard' },
    ],
  },
  legal: {
    termsAndConditions: `# Terms and Conditions of Prinly.in\n*Last Updated: 2026-01-01*\n\nWelcome to **Prinly.in** ("Prinly", "we", "us", or "our"), operated by Prinly Technologies. By accessing or using our website, services, and online printing network, you agree to be bound by these Terms and Conditions.\n\n## 1. Acceptance of Terms\nBy creating an account, uploading documents, or registering as a Printing Hub, you confirm that you have read, understood, and agreed to these terms.\n\n## 2. Printing Services\n- Prinly connects users with independent cyber cafes and printing hubs.\n- Users are responsible for the legality and copyright ownership of documents uploaded.\n- Printing specifications (color, duplex, binding) selected during order submission govern the final output.\n\n## 3. Printing Hub Partner Responsibilities\n- Printing Hubs agree to maintain active paper stock and operational printers.\n- Hubs must inspect and fulfill orders in a timely manner according to stated queue estimates.\n- Counter cash payments must be acknowledged through the Prinly dashboard.\n\n## 4. Privacy & Document Retention\n- All uploaded files are stored temporarily on secured servers solely for output spooling.\n- Files are purged automatically after successful completion of the print job.\n\n## 5. Limitation of Liability\nPrinly is not liable for typographical errors in user-provided files or delays caused by local shop power outages or hardware faults.`,
    privacyPolicy: `# Privacy Policy of Prinly.in\n*Last Updated: 2026-01-01*\n\nAt **Prinly.in**, we prioritize the security and confidentiality of your personal information and documents.\n\n## 1. Information We Collect\n- **Account Details:** Name, email address, phone number, and password hash.\n- **Order Details:** Print specifications, file metadata (name, page count, file size), and payment preferences.\n- **Location Data:** Approximate GPS location or chosen locality to match you with nearby printing hubs.\n\n## 2. File Confidentiality\n- Your uploaded documents are encrypted during transit using SSL/TLS protocols.\n- Hub owners only access document data for physical printing.\n- Documents are never indexed, analyzed, or shared with third parties.\n\n## 3. Contact Information\nFor privacy inquiries, reach us at **support@prinly.in**.`,
    refundPolicy: `# Refund and Cancellation Policy\n*Last Updated: 2026-01-01*\n\nAt **Prinly.in**, customer satisfaction is our highest priority.\n\n## 1. Cancellations\n- Orders can be cancelled free of charge if the status is **WAITING** or **PENDING** before the shopkeeper starts printing.\n- Once an order transitions to **PRINTING** or **READY**, cancellations cannot be processed because paper and toner have already been expended.\n\n## 2. Defective Output & Misprints\n- If a shop delivers unreadable prints, paper jams, or incorrect color format contrary to your order specs, you are eligible for an immediate reprint or full refund.\n- Report issues directly to the hub owner at the counter or contact Prinly support within 24 hours.\n\n## 3. Refund Timelines\n- Online refunds are processed to your original payment method within 2-4 business days.`,
    cancellationPolicy: `# Cancellation Policy\nOrders can be cancelled anytime prior to physical spooling. Once printing starts, orders are locked.`,
  },
};

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
    upiQrUrl: '',
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
    upiQrUrl: '',
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

  // Initialize CMS configuration
  if (!store.cms) {
    store.cms = JSON.parse(JSON.stringify(defaultCmsConfig));
  }
}
