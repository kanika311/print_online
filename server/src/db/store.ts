import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Shop,
  Order,
  DeliveryPartner,
  Transaction,
  Review,
  PricingRule,
  StockItem,
  ChatMessage,
  Broadcast,
  PrintSpecs,
} from './types';

// Geospatial Haversine calculation in km
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

class RelationalDataStore {
  public users: Map<string, User> = new Map();
  public shops: Map<string, Shop> = new Map();
  public orders: Map<string, Order> = new Map();
  public deliveryPartners: Map<string, DeliveryPartner> = new Map();
  public transactions: Map<string, Transaction> = new Map();
  public reviews: Map<string, Review> = new Map();
  public pricingRules: Map<string, PricingRule> = new Map();
  public stockItems: Map<string, StockItem> = new Map();
  public chatMessages: Map<string, ChatMessage> = new Map();
  public broadcasts: Map<string, Broadcast> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // --- Seed Data initialization ---
  private seedInitialData() {
    // 1. Users
    const customerUser: User = {
      id: 'usr-customer-1',
      name: 'Aarav Sharma',
      phone: '9876543210',
      email: 'aarav@example.com',
      role: 'CUSTOMER',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
      address: 'Flat 402, Sunshine Heights, Koramangala, Bengaluru',
      lat: 12.9352,
      lng: 77.6245,
      walletBalance: 250.00,
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shopOwnerUser1: User = {
      id: 'usr-owner-1',
      name: 'Ramesh Patel',
      phone: '9811122233',
      email: 'patel.prints@cybercafe.com',
      role: 'SHOP_OWNER',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150',
      address: 'Shop 12, Cyber Hub, 5th Block Koramangala',
      lat: 12.9340,
      lng: 77.6200,
      walletBalance: 4200.00,
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shopOwnerUser2: User = {
      id: 'usr-owner-2',
      name: 'Sunil Verma',
      phone: '9822233344',
      email: 'verma.xerox@gmail.com',
      role: 'SHOP_OWNER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
      address: 'Next to Metro Gate 2, Indiranagar, Bengaluru',
      lat: 12.9719,
      lng: 77.6412,
      walletBalance: 1850.00,
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const adminUser: User = {
      id: 'usr-admin-1',
      name: 'Vikram Mehta (Super Admin)',
      phone: '9999988888',
      email: 'admin@printporter.com',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150',
      address: 'HQ, Tech Park, Outer Ring Road, Bengaluru',
      lat: 12.9350,
      lng: 77.6240,
      walletBalance: 0,
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const deliveryUser: User = {
      id: 'usr-delivery-1',
      name: 'Rohan Kumar',
      phone: '9844455566',
      email: 'rohan.porter@gmail.com',
      role: 'DELIVERY_PARTNER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
      address: 'Koramangala 4th Block',
      lat: 12.9348,
      lng: 77.6235,
      walletBalance: 780.00,
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    [customerUser, shopOwnerUser1, shopOwnerUser2, adminUser, deliveryUser].forEach(u => this.users.set(u.id, u));

    // 2. Shops
    const shop1: Shop = {
      id: 'shop-koramangala-1',
      ownerId: shopOwnerUser1.id,
      name: 'Patel Cyber Cafe & High-Speed Xerox',
      address: 'Shop 12, Cyber Hub, 5th Block Koramangala, Bengaluru',
      lat: 12.9340,
      lng: 77.6200,
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
      rating: 4.85,
      reviewCount: 142,
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shop2: Shop = {
      id: 'shop-indiranagar-2',
      ownerId: shopOwnerUser2.id,
      name: 'Verma Digital Prints & Scan Hub',
      address: '100ft Road, Near Metro Gate 2, Indiranagar, Bengaluru',
      lat: 12.9719,
      lng: 77.6412,
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
        maxDailyCapacity: 1500,
      },
      maxDailyCapacity: 1500,
      currentQueueCount: 0,
      rating: 4.70,
      reviewCount: 98,
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pendingShop: Shop = {
      id: 'shop-hsur-3',
      ownerId: 'usr-owner-3',
      name: 'QuickPrint Express Cyber',
      address: 'Hosur Main Road, Madiwala, Bengaluru',
      lat: 12.9220,
      lng: 77.6190,
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
      reviewCount: 12,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    [shop1, shop2, pendingShop].forEach(s => this.shops.set(s.id, s));

    // 3. Delivery Partner
    const partner: DeliveryPartner = {
      id: 'del-partner-1',
      userId: deliveryUser.id,
      name: deliveryUser.name,
      phone: deliveryUser.phone,
      vehicleType: 'BIKE',
      lat: 12.9348,
      lng: 77.6235,
      isAvailable: true,
      rating: 4.92,
    };
    this.deliveryPartners.set(partner.id, partner);

    // 4. Pricing Rules Matrix
    const defaultPricing: PricingRule = {
      id: 'rule-default-1',
      paperSize: 'A4',
      printType: 'BW',
      paperType: 'Normal 75gsm',
      pricePerPage: 2.00, // 2 INR per B&W page
      bindingPrices: {
        'None': 0,
        'Corner Staple': 5.00,
        'Spiral Ring Binding': 35.00,
      },
      deliveryBaseFee: 25.00, // within 2km
      deliveryPerKm: 8.00,
      surgeMultiplier: 1.00,
    };
    this.pricingRules.set(defaultPricing.id, defaultPricing);

    // 5. Stock Items for Shop 1
    const stockItemsData: StockItem[] = [
      {
        id: 'stk-1',
        shopId: shop1.id,
        itemName: 'A4 75gsm JK Paper Ream',
        category: 'PAPER',
        currentStock: 420,
        unit: 'sheets',
        lowStockThreshold: 100,
        isLowStock: false,
        isOutOfStock: false,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'stk-2',
        shopId: shop1.id,
        itemName: 'Glossy Photo 180gsm Sheets',
        category: 'PAPER',
        currentStock: 85,
        unit: 'sheets',
        lowStockThreshold: 100,
        isLowStock: true,
        isOutOfStock: false,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'stk-3',
        shopId: shop1.id,
        itemName: 'HP Black Toner Cartridge 12A',
        category: 'TONER',
        currentStock: 3,
        unit: 'cartridges',
        lowStockThreshold: 2,
        isLowStock: false,
        isOutOfStock: false,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'stk-4',
        shopId: shop1.id,
        itemName: 'Spiral Binding Coils (14mm)',
        category: 'BINDING',
        currentStock: 60,
        unit: 'coils',
        lowStockThreshold: 20,
        isLowStock: false,
        isOutOfStock: false,
        updatedAt: new Date().toISOString(),
      },
    ];
    stockItemsData.forEach(item => this.stockItems.set(item.id, item));

    // 6. Sample Active Orders
    const sampleOrder1: Order = {
      id: 'ord-1001',
      orderNumber: 'PP-2026-8819',
      userId: customerUser.id,
      shopId: shop1.id,
      deliveryPartnerId: partner.id,
      fileName: 'Project_Final_Report_v2.pdf',
      fileUrl: '/uploads/sample_report.pdf',
      fileSizeMb: 3.4,
      pageCount: 15,
      specs: {
        paperSize: 'A4',
        printType: 'BW',
        paperType: 'Normal 75gsm',
        copies: 2,
        duplex: true,
        binding: 'Spiral Ring Binding',
        customInstructions: 'Please put a transparent plastic cover on top and hard card on back.',
      },
      totalPrice: 135.00, // (15 pages * 2 copies * 2.00) + 35 binding + 5 fee + 35 delivery = 135
      platformFee: 10.00,
      shopEarnings: 90.00,
      deliveryFee: 35.00,
      paymentMode: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PRINTING',
      deliveryType: 'HOME_DELIVERY',
      deliveryAddress: 'Flat 402, Sunshine Heights, Koramangala, Bengaluru',
      deliveryLat: 12.9352,
      deliveryLng: 77.6245,
      customNotes: 'Ring the doorbell twice please',
      autoDeleteAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sampleOrder2: Order = {
      id: 'ord-1002',
      orderNumber: 'PP-2026-8820',
      userId: customerUser.id,
      shopId: shop1.id,
      fileName: 'Rental_Agreement_Signed.pdf',
      fileUrl: '/uploads/rental_agreement.pdf',
      fileSizeMb: 1.2,
      pageCount: 6,
      specs: {
        paperSize: 'Legal',
        printType: 'BW',
        paperType: 'Bond paper 85gsm',
        copies: 1,
        duplex: false,
        binding: 'Corner Staple',
        customInstructions: 'Print on green bond paper if available.',
      },
      totalPrice: 42.00,
      platformFee: 5.00,
      shopEarnings: 37.00,
      deliveryFee: 0.00,
      paymentMode: 'ONLINE',
      paymentStatus: 'ESCROW_HELD',
      orderStatus: 'COMPLETED',
      deliveryType: 'SELF_PICKUP',
      autoDeleteAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    };

    [sampleOrder1, sampleOrder2].forEach(o => this.orders.set(o.id, o));

    // 7. Sample Transaction
    const tx1: Transaction = {
      id: 'tx-2001',
      orderId: sampleOrder2.id,
      userId: customerUser.id,
      shopId: shop1.id,
      amount: 42.00,
      platformCut: 5.00,
      shopCut: 37.00,
      mode: 'ONLINE',
      status: 'SETTLED',
      settlementStatus: 'DISBURSED',
      settledAt: new Date().toISOString(),
      createdAt: sampleOrder2.createdAt,
    };
    this.transactions.set(tx1.id, tx1);

    // 8. Sample Review
    const rev1: Review = {
      id: 'rev-3001',
      orderId: sampleOrder2.id,
      shopId: shop1.id,
      userId: customerUser.id,
      userName: customerUser.name,
      rating: 5,
      comment: 'Super fast print! Paper quality was crisp and ready in 10 minutes.',
      createdAt: new Date().toISOString(),
    };
    this.reviews.set(rev1.id, rev1);

    // 9. Sample Broadcast
    const broadcast1: Broadcast = {
      id: 'bc-4001',
      title: 'Monsoon Delivery Advisory 🌧️',
      message: 'Expect slight delivery delays due to heavy rains in Koramangala and Indiranagar. All prints are packaged in waterproof sleeves!',
      targetAudience: 'ALL',
      bannerType: 'INFO',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.broadcasts.set(broadcast1.id, broadcast1);
  }

  // --- Users ---
  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByPhone(phone: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.phone === phone) return user;
    }
    return undefined;
  }

  public saveUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  // --- Shops ---
  public getShopById(id: string): Shop | undefined {
    return this.shops.get(id);
  }

  public getAllShops(): Shop[] {
    return Array.from(this.shops.values());
  }

  public getOnlineShops(): Shop[] {
    return Array.from(this.shops.values()).filter(s => s.isOnline && s.kycStatus === 'VERIFIED');
  }

  public saveShop(shop: Shop): Shop {
    this.shops.set(shop.id, shop);
    return shop;
  }

  // --- Orders ---
  public getOrderById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  public getOrders(filter?: { userId?: string; shopId?: string; status?: string }): Order[] {
    let list = Array.from(this.orders.values());
    if (filter?.userId) list = list.filter(o => o.userId === filter.userId);
    if (filter?.shopId) list = list.filter(o => o.shopId === filter.shopId);
    if (filter?.status) list = list.filter(o => o.orderStatus === filter.status);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveOrder(order: Order): Order {
    this.orders.set(order.id, order);
    return order;
  }

  // --- Delivery Partners ---
  public getAllDeliveryPartners(): DeliveryPartner[] {
    return Array.from(this.deliveryPartners.values());
  }

  public getDeliveryPartnerById(id: string): DeliveryPartner | undefined {
    return this.deliveryPartners.get(id);
  }

  public saveDeliveryPartner(partner: DeliveryPartner): DeliveryPartner {
    this.deliveryPartners.set(partner.id, partner);
    return partner;
  }

  // --- Transactions ---
  public getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public saveTransaction(tx: Transaction): Transaction {
    this.transactions.set(tx.id, tx);
    return tx;
  }

  // --- Reviews ---
  public getReviewsByShopId(shopId: string): Review[] {
    return Array.from(this.reviews.values())
      .filter(r => r.shopId === shopId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveReview(review: Review): Review {
    this.reviews.set(review.id, review);
    // Recalculate shop rating
    const shop = this.shops.get(review.shopId);
    if (shop) {
      const allShopReviews = this.getReviewsByShopId(shop.id);
      const totalScore = allShopReviews.reduce((sum, r) => sum + r.rating, 0);
      shop.rating = parseFloat((totalScore / allShopReviews.length).toFixed(2));
      shop.reviewCount = allShopReviews.length;
      this.saveShop(shop);
    }
    return review;
  }

  // --- Stock Items ---
  public getStockByShopId(shopId: string): StockItem[] {
    return Array.from(this.stockItems.values()).filter(item => item.shopId === shopId);
  }

  public saveStockItem(item: StockItem): StockItem {
    this.stockItems.set(item.id, item);
    return item;
  }

  // --- Chat Messages ---
  public getChatMessagesByOrderId(orderId: string): ChatMessage[] {
    return Array.from(this.chatMessages.values())
      .filter(m => m.orderId === orderId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public saveChatMessage(msg: ChatMessage): ChatMessage {
    this.chatMessages.set(msg.id, msg);
    return msg;
  }

  // --- Broadcasts ---
  public getActiveBroadcasts(): Broadcast[] {
    return Array.from(this.broadcasts.values()).filter(b => b.isActive);
  }

  public saveBroadcast(b: Broadcast): Broadcast {
    this.broadcasts.set(b.id, b);
    return b;
  }
}

export const dbStore = new RelationalDataStore();
