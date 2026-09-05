import { v4 as uuidv4 } from 'uuid';

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface UserDoc {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'CUSTOMER' | 'SHOP_OWNER' | 'ADMIN' | 'DELIVERY_PARTNER';
  avatarUrl?: string;
  address?: string;
  location?: GeoLocation;
  walletBalance: number;
  isBlocked: boolean;
  codNoShows: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopDoc {
  _id: string;
  ownerId: string;
  name: string;
  address: string;
  location: GeoLocation; // 2dsphere GeoJSON
  phone: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  kycDocs: {
    tradeLicense?: string | null;
    ownerIdProof?: string | null;
    gstNumber?: string | null;
    rejectionReason?: string | null;
  };
  isOnline: boolean;
  isBusy: boolean;
  capabilities: {
    supportedSizes: string[];
    supportedPapers: string[];
    supportedBindings: string[];
    colorPrinting: boolean;
    duplexPrinting: boolean;
    maxDailyCapacity: number;
  };
  maxDailyCapacity: number;
  currentQueueCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDoc {
  _id: string;
  orderNumber: string;
  userId: string;
  shopId?: string;
  deliveryPartnerId?: string;
  fileName: string;
  fileUrl: string;
  fileSizeMb: number;
  pageCount: number;
  specs: {
    paperSize: 'A4' | 'A3' | 'Legal' | 'Letter';
    printType: 'BW' | 'COLOR';
    paperType: 'Normal 75gsm' | 'Bond paper 85gsm' | 'Glossy 180gsm' | 'Cardstock 250gsm';
    copies: number;
    duplex: boolean;
    binding: 'None' | 'Corner Staple' | 'Spiral Ring Binding';
    customInstructions?: string;
  };
  totalPrice: number;
  platformFee: number;
  shopEarnings: number;
  deliveryFee: number;
  paymentMode: 'ONLINE' | 'COD';
  paymentStatus: 'PENDING' | 'ESCROW_HELD' | 'COLLECTED_BY_SHOP' | 'PAID_OUT' | 'REFUNDED';
  orderStatus:
    | 'MATCHING'
    | 'DISPATCHED_TO_SHOP'
    | 'ACCEPTED'
    | 'PRINTING'
    | 'READY'
    | 'OUT_FOR_DELIVERY'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'REASSIGNED';
  deliveryType: 'SELF_PICKUP' | 'HOME_DELIVERY';
  deliveryAddress?: string;
  deliveryLocation?: GeoLocation;
  customNotes?: string;
  autoDeleteAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPartnerDoc {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: 'BIKE' | 'SCOOTER' | 'CYCLE';
  location: GeoLocation;
  isAvailable: boolean;
  currentOrderId?: string | null;
  rating: number;
}

export interface TransactionDoc {
  _id: string;
  orderId: string;
  userId: string;
  shopId?: string;
  amount: number;
  platformCut: number;
  shopCut: number;
  mode: 'ONLINE' | 'COD';
  status: 'PENDING' | 'HELD_IN_ESCROW' | 'SETTLED' | 'REFUNDED';
  settlementStatus: 'UNSETTLED' | 'VERIFIED_BY_ADMIN' | 'DISBURSED';
  settledAt?: string;
  createdAt: string;
}

export interface ReviewDoc {
  _id: string;
  orderId: string;
  shopId: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface StockItemDoc {
  _id: string;
  shopId: string;
  itemName: string;
  category: 'PAPER' | 'TONER' | 'BINDING';
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  updatedAt: string;
}

export interface ChatMessageDoc {
  _id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'SHOP' | 'ADMIN';
  message: string;
  createdAt: string;
}

export interface BroadcastDoc {
  _id: string;
  title: string;
  message: string;
  targetAudience: 'ALL' | 'SHOPS' | 'CUSTOMERS';
  bannerType: 'INFO' | 'OFFER' | 'WARNING';
  isActive: boolean;
  createdAt: string;
}

// Haversine calculation using [longitude, latitude]
export function geoDistanceKm(coord1: [number, number], coord2: [number, number]): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

class MongoDocumentStore {
  public users = new Map<string, UserDoc>();
  public shops = new Map<string, ShopDoc>();
  public orders = new Map<string, OrderDoc>();
  public deliveryPartners = new Map<string, DeliveryPartnerDoc>();
  public transactions = new Map<string, TransactionDoc>();
  public reviews = new Map<string, ReviewDoc>();
  public stockItems = new Map<string, StockItemDoc>();
  public chatMessages = new Map<string, ChatMessageDoc>();
  public broadcasts = new Map<string, BroadcastDoc>();

  constructor() {
    this.seedMongoDBData();
  }

  private seedMongoDBData() {
    // 1. Users
    const customerUser: UserDoc = {
      _id: 'usr_customer_101',
      name: 'Aarav Sharma',
      phone: '9876543210',
      email: 'aarav.sharma@example.com',
      role: 'CUSTOMER',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
      address: 'Flat 402, Sunshine Heights, Koramangala, Bengaluru',
      location: { type: 'Point', coordinates: [77.6245, 12.9352] }, // [lng, lat]
      walletBalance: 320.00,
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shopOwner1: UserDoc = {
      _id: 'usr_owner_201',
      name: 'Ramesh Patel',
      phone: '9811122233',
      email: 'patel.prints@cyberhub.com',
      role: 'SHOP_OWNER',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150',
      address: 'Shop 12, Cyber Hub, 5th Block Koramangala, Bengaluru',
      location: { type: 'Point', coordinates: [77.6200, 12.9340] },
      walletBalance: 5400.00,
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shopOwner2: UserDoc = {
      _id: 'usr_owner_202',
      name: 'Sunil Verma',
      phone: '9822233344',
      email: 'verma.xerox@gmail.com',
      role: 'SHOP_OWNER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
      address: '100ft Road, Near Metro Gate 2, Indiranagar, Bengaluru',
      location: { type: 'Point', coordinates: [77.6412, 12.9719] },
      walletBalance: 2890.00,
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const adminUser: UserDoc = {
      _id: 'usr_admin_301',
      name: 'Vikram Mehta (Super Admin)',
      phone: '9999988888',
      email: 'admin@printporter.com',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150',
      address: 'PrintPorter Headquarters, Outer Ring Road, Bengaluru',
      location: { type: 'Point', coordinates: [77.6240, 12.9350] },
      walletBalance: 0,
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const deliveryUser: UserDoc = {
      _id: 'usr_delivery_401',
      name: 'Rohan Kumar',
      phone: '9844455566',
      email: 'rohan.porter@gmail.com',
      role: 'DELIVERY_PARTNER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
      address: 'Koramangala 4th Block',
      location: { type: 'Point', coordinates: [77.6235, 12.9348] },
      walletBalance: 860.00,
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    [customerUser, shopOwner1, shopOwner2, adminUser, deliveryUser].forEach(u => this.users.set(u._id, u));

    // 2. Shops (MongoDB Documents with 2dsphere GeoJSON location)
    const shop1: ShopDoc = {
      _id: 'shp_koramangala_01',
      ownerId: shopOwner1._id,
      name: 'Patel Cyber Cafe & High-Speed Xerox',
      address: 'Shop 12, Cyber Hub, 5th Block Koramangala, Bengaluru',
      location: { type: 'Point', coordinates: [77.6200, 12.9340] }, // [lng, lat]
      phone: '9811122233',
      kycStatus: 'VERIFIED',
      kycDocs: {
        tradeLicense: 'LIC-BLR-2024-88912',
        ownerIdProof: 'Aadhaar Verified',
        gstNumber: '29ABCDE1234F1Z5',
      },
      isOnline: true,
      isBusy: false,
      capabilities: {
        supportedSizes: ['A4', 'A3', 'Legal', 'Letter'],
        supportedPapers: ['Normal 75gsm', 'Bond paper 85gsm', 'Glossy 180gsm', 'Cardstock 250gsm'],
        supportedBindings: ['None', 'Corner Staple', 'Spiral Ring Binding'],
        colorPrinting: true,
        duplexPrinting: true,
        maxDailyCapacity: 2500,
      },
      maxDailyCapacity: 2500,
      currentQueueCount: 1,
      rating: 4.88,
      reviewCount: 184,
      createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shop2: ShopDoc = {
      _id: 'shp_indiranagar_02',
      ownerId: shopOwner2._id,
      name: 'Verma Digital Prints & Scan Hub',
      address: '100ft Road, Near Metro Gate 2, Indiranagar, Bengaluru',
      location: { type: 'Point', coordinates: [77.6412, 12.9719] },
      phone: '9822233344',
      kycStatus: 'VERIFIED',
      kycDocs: {
        tradeLicense: 'LIC-BLR-2024-44120',
        ownerIdProof: 'PAN Card Verified',
        gstNumber: '29WXYZ8877G2Z1',
      },
      isOnline: true,
      isBusy: false,
      capabilities: {
        supportedSizes: ['A4', 'A3', 'Legal'],
        supportedPapers: ['Normal 75gsm', 'Bond paper 85gsm', 'Glossy 180gsm'],
        supportedBindings: ['None', 'Corner Staple', 'Spiral Ring Binding'],
        colorPrinting: true,
        duplexPrinting: true,
        maxDailyCapacity: 1600,
      },
      maxDailyCapacity: 1600,
      currentQueueCount: 0,
      rating: 4.75,
      reviewCount: 112,
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shop3Pending: ShopDoc = {
      _id: 'shp_madiwala_03',
      ownerId: 'usr_owner_999',
      name: 'QuickPrint Express Cyber',
      address: 'Hosur Main Road, Near St. John’s, Madiwala, Bengaluru',
      location: { type: 'Point', coordinates: [77.6190, 12.9220] },
      phone: '9833344455',
      kycStatus: 'PENDING',
      kycDocs: {
        tradeLicense: 'LIC-BLR-PENDING-99',
        ownerIdProof: 'Voter ID submitted',
        gstNumber: null,
      },
      isOnline: false,
      isBusy: false,
      capabilities: {
        supportedSizes: ['A4', 'Letter'],
        supportedPapers: ['Normal 75gsm'],
        supportedBindings: ['None', 'Corner Staple'],
        colorPrinting: false,
        duplexPrinting: true,
        maxDailyCapacity: 800,
      },
      maxDailyCapacity: 800,
      currentQueueCount: 0,
      rating: 4.5,
      reviewCount: 15,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    [shop1, shop2, shop3Pending].forEach(s => this.shops.set(s._id, s));

    // 3. Delivery Partner
    const partner: DeliveryPartnerDoc = {
      _id: 'dp_partner_01',
      userId: deliveryUser._id,
      name: deliveryUser.name,
      phone: deliveryUser.phone,
      vehicleType: 'BIKE',
      location: { type: 'Point', coordinates: [77.6235, 12.9348] },
      isAvailable: true,
      currentOrderId: null,
      rating: 4.94,
    };
    this.deliveryPartners.set(partner._id, partner);

    // 4. Stock Items
    const stockData: StockItemDoc[] = [
      {
        _id: 'stk_01',
        shopId: shop1._id,
        itemName: 'A4 75gsm JK Paper Ream',
        category: 'PAPER',
        currentStock: 480,
        unit: 'sheets',
        lowStockThreshold: 100,
        isLowStock: false,
        isOutOfStock: false,
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'stk_02',
        shopId: shop1._id,
        itemName: 'Glossy Photo 180gsm Sheets',
        category: 'PAPER',
        currentStock: 75,
        unit: 'sheets',
        lowStockThreshold: 100,
        isLowStock: true,
        isOutOfStock: false,
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'stk_03',
        shopId: shop1._id,
        itemName: 'HP Black Toner Cartridge 12A',
        category: 'TONER',
        currentStock: 4,
        unit: 'cartridges',
        lowStockThreshold: 2,
        isLowStock: false,
        isOutOfStock: false,
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'stk_04',
        shopId: shop1._id,
        itemName: 'Spiral Binding Coils (14mm)',
        category: 'BINDING',
        currentStock: 85,
        unit: 'coils',
        lowStockThreshold: 20,
        isLowStock: false,
        isOutOfStock: false,
        updatedAt: new Date().toISOString(),
      },
    ];
    stockData.forEach(item => this.stockItems.set(item._id, item));

    // 5. Active and Completed Sample Orders
    const sampleOrder1: OrderDoc = {
      _id: 'ord_mongo_101',
      orderNumber: 'PP-BLR-8921',
      userId: customerUser._id,
      shopId: shop1._id,
      deliveryPartnerId: partner._id,
      fileName: 'Final_Architectural_Portfolio.pdf',
      fileUrl: '/uploads/sample_report.pdf',
      fileSizeMb: 4.2,
      pageCount: 16,
      specs: {
        paperSize: 'A4',
        printType: 'BW',
        paperType: 'Normal 75gsm',
        copies: 2,
        duplex: true,
        binding: 'Spiral Ring Binding',
        customInstructions: 'Please add a transparent PVC sheet on front and black card sheet on back.',
      },
      totalPrice: 145.00,
      platformFee: 10.00,
      shopEarnings: 100.00,
      deliveryFee: 35.00,
      paymentMode: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PRINTING',
      deliveryType: 'HOME_DELIVERY',
      deliveryAddress: 'Flat 402, Sunshine Heights, Koramangala, Bengaluru',
      deliveryLocation: { type: 'Point', coordinates: [77.6245, 12.9352] },
      customNotes: 'Ring bell twice please',
      autoDeleteAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sampleOrder2: OrderDoc = {
      _id: 'ord_mongo_102',
      orderNumber: 'PP-BLR-8922',
      userId: customerUser._id,
      shopId: shop1._id,
      fileName: 'Apartment_Lease_Deed.pdf',
      fileUrl: '/uploads/sample_report.pdf',
      fileSizeMb: 1.5,
      pageCount: 8,
      specs: {
        paperSize: 'Legal',
        printType: 'BW',
        paperType: 'Bond paper 85gsm',
        copies: 1,
        duplex: false,
        binding: 'Corner Staple',
        customInstructions: 'Original stamp paper on page 1.',
      },
      totalPrice: 48.00,
      platformFee: 5.00,
      shopEarnings: 43.00,
      deliveryFee: 0.00,
      paymentMode: 'ONLINE',
      paymentStatus: 'ESCROW_HELD',
      orderStatus: 'COMPLETED',
      deliveryType: 'SELF_PICKUP',
      autoDeleteAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    };

    [sampleOrder1, sampleOrder2].forEach(o => this.orders.set(o._id, o));

    // 6. Transactions
    const tx1: TransactionDoc = {
      _id: 'tx_m_01',
      orderId: sampleOrder2._id,
      userId: customerUser._id,
      shopId: shop1._id,
      amount: 48.00,
      platformCut: 5.00,
      shopCut: 43.00,
      mode: 'ONLINE',
      status: 'SETTLED',
      settlementStatus: 'DISBURSED',
      settledAt: new Date().toISOString(),
      createdAt: sampleOrder2.createdAt,
    };
    this.transactions.set(tx1._id, tx1);

    // 7. Reviews
    const rev1: ReviewDoc = {
      _id: 'rev_m_01',
      orderId: sampleOrder2._id,
      shopId: shop1._id,
      userId: customerUser._id,
      userName: customerUser.name,
      rating: 5,
      comment: 'Top notch print resolution! Picked up without waiting in line.',
      createdAt: new Date().toISOString(),
    };
    this.reviews.set(rev1._id, rev1);

    // 8. Broadcast
    const bc1: BroadcastDoc = {
      _id: 'bc_m_01',
      title: 'Monsoon Print Protection Active 🌧️',
      message: 'All partner cyber cafes have enabled waterproof sealed packaging on every delivery order at zero extra charge.',
      targetAudience: 'ALL',
      bannerType: 'INFO',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.broadcasts.set(bc1._id, bc1);
  }

  // --- Users ---
  public getUserById(id: string): UserDoc | undefined {
    return this.users.get(id);
  }

  public getUserByPhone(phone: string): UserDoc | undefined {
    for (const user of this.users.values()) {
      if (user.phone === phone) return user;
    }
    return undefined;
  }

  public saveUser(user: UserDoc): UserDoc {
    this.users.set(user._id, user);
    return user;
  }

  // --- Shops with MongoDB GeoSpatial $nearSphere Simulation ---
  public getShopById(id: string): ShopDoc | undefined {
    return this.shops.get(id);
  }

  public getAllShops(): ShopDoc[] {
    return Array.from(this.shops.values());
  }

  public getOnlineShops(): ShopDoc[] {
    return Array.from(this.shops.values()).filter(s => s.isOnline && s.kycStatus === 'VERIFIED');
  }

  /**
   * MongoDB $nearSphere simulation on 2dsphere location coordinates [lng, lat]
   */
  public findShopsNear(
    userLng: number,
    userLat: number,
    maxDistanceKm: number = 8.0
  ): { shop: ShopDoc; distanceKm: number }[] {
    const online = this.getOnlineShops();
    const results: { shop: ShopDoc; distanceKm: number }[] = [];

    for (const shop of online) {
      const dist = geoDistanceKm([userLng, userLat], shop.location.coordinates);
      if (dist <= maxDistanceKm) {
        results.push({ shop, distanceKm: dist });
      }
    }

    return results.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  public saveShop(shop: ShopDoc): ShopDoc {
    this.shops.set(shop._id, shop);
    return shop;
  }

  // --- Orders ---
  public getOrderById(id: string): OrderDoc | undefined {
    return this.orders.get(id);
  }

  public getOrders(filter?: { userId?: string; shopId?: string; status?: string }): OrderDoc[] {
    let list = Array.from(this.orders.values());
    if (filter?.userId) list = list.filter(o => o.userId === filter.userId);
    if (filter?.shopId) list = list.filter(o => o.shopId === filter.shopId);
    if (filter?.status) list = list.filter(o => o.orderStatus === filter.status);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveOrder(order: OrderDoc): OrderDoc {
    this.orders.set(order._id, order);
    return order;
  }

  // --- Delivery Partners ---
  public getAllDeliveryPartners(): DeliveryPartnerDoc[] {
    return Array.from(this.deliveryPartners.values());
  }

  public getDeliveryPartnerById(id: string): DeliveryPartnerDoc | undefined {
    return this.deliveryPartners.get(id);
  }

  public saveDeliveryPartner(partner: DeliveryPartnerDoc): DeliveryPartnerDoc {
    this.deliveryPartners.set(partner._id, partner);
    return partner;
  }

  // --- Transactions ---
  public getAllTransactions(): TransactionDoc[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public saveTransaction(tx: TransactionDoc): TransactionDoc {
    this.transactions.set(tx._id, tx);
    return tx;
  }

  // --- Reviews ---
  public getReviewsByShopId(shopId: string): ReviewDoc[] {
    return Array.from(this.reviews.values())
      .filter(r => r.shopId === shopId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveReview(review: ReviewDoc): ReviewDoc {
    this.reviews.set(review._id, review);
    // Recalculate shop rating
    const shop = this.shops.get(review.shopId);
    if (shop) {
      const allShopReviews = this.getReviewsByShopId(shop._id);
      const totalScore = allShopReviews.reduce((sum, r) => sum + r.rating, 0);
      shop.rating = parseFloat((totalScore / allShopReviews.length).toFixed(2));
      shop.reviewCount = allShopReviews.length;
      this.saveShop(shop);
    }
    return review;
  }

  // --- Stock Items ---
  public getStockByShopId(shopId: string): StockItemDoc[] {
    return Array.from(this.stockItems.values()).filter(item => item.shopId === shopId);
  }

  public saveStockItem(item: StockItemDoc): StockItemDoc {
    this.stockItems.set(item._id, item);
    return item;
  }

  // --- Chat Messages ---
  public getChatMessagesByOrderId(orderId: string): ChatMessageDoc[] {
    return Array.from(this.chatMessages.values())
      .filter(m => m.orderId === orderId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public saveChatMessage(msg: ChatMessageDoc): ChatMessageDoc {
    this.chatMessages.set(msg._id, msg);
    return msg;
  }

  // --- Broadcasts ---
  public getActiveBroadcasts(): BroadcastDoc[] {
    return Array.from(this.broadcasts.values()).filter(b => b.isActive);
  }

  public saveBroadcast(b: BroadcastDoc): BroadcastDoc {
    this.broadcasts.set(b._id, b);
    return b;
  }
}

export const mongoStore = new MongoDocumentStore();
