export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'CUSTOMER' | 'SHOP_OWNER' | 'ADMIN' | 'DELIVERY_PARTNER';
  avatarUrl?: string;
  address?: string;
  walletBalance: number;
  isBlocked: boolean;
}

export interface ShopCapabilities {
  supportedSizes: string[];
  supportedPapers: string[];
  supportedBindings: string[];
  colorPrinting: boolean;
  duplexPrinting: boolean;
  maxDailyCapacity: number;
}

export interface Shop {
  _id: string;
  ownerId: string;
  name: string;
  address: string;
  location: { type: string; coordinates: [number, number] }; // [lng, lat]
  phone: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  kycDocs?: {
    tradeLicense?: string | null;
    ownerIdProof?: string | null;
    gstNumber?: string | null;
    rejectionReason?: string | null;
  };
  isOnline: boolean;
  isBusy: boolean;
  capabilities: ShopCapabilities;
  maxDailyCapacity: number;
  currentQueueCount: number;
  rating: number;
  reviewCount: number;
}

export interface PrintSpecs {
  paperSize: 'A4' | 'A3' | 'Legal' | 'Letter';
  printType: 'BW' | 'COLOR';
  paperType: 'Normal 75gsm' | 'Bond paper 85gsm' | 'Glossy 180gsm' | 'Cardstock 250gsm';
  copies: number;
  duplex: boolean;
  binding: 'None' | 'Corner Staple' | 'Spiral Ring Binding';
  customInstructions?: string;
}

export interface PriceBreakdown {
  pageCount: number;
  copies: number;
  totalPagesToPrint: number;
  baseRatePerPage: number;
  paperTypeSurcharge: number;
  effectiveRatePerPage: number;
  printCost: number;
  bindingCost: number;
  platformFee: number;
  deliveryFee: number;
  subtotal: number;
  taxGst: number;
  totalPrice: number;
  shopEarnings: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  shopId?: string;
  deliveryPartnerId?: string;
  fileName: string;
  fileUrl: string;
  fileSizeMb: number;
  pageCount: number;
  specs: PrintSpecs;
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
  deliveryLocation?: { type: string; coordinates: [number, number] };
  customNotes?: string;
  autoDeleteAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockItem {
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

export interface ChatMessage {
  _id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'SHOP' | 'ADMIN';
  message: string;
  createdAt: string;
}
