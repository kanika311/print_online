export type Role = 'CUSTOMER' | 'SHOP_OWNER' | 'ADMIN' | 'DELIVERY_PARTNER';

export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type OrderStatus =
  | 'MATCHING'
  | 'DISPATCHED_TO_SHOP'
  | 'ACCEPTED'
  | 'PRINTING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REASSIGNED';

export type PaymentMode = 'ONLINE' | 'COD';

export type PaymentStatus =
  | 'PENDING'
  | 'ESCROW_HELD'
  | 'COLLECTED_BY_SHOP'
  | 'PAID_OUT'
  | 'REFUNDED';

export type DeliveryType = 'SELF_PICKUP' | 'HOME_DELIVERY';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  avatarUrl?: string;
  address?: string;
  lat?: number;
  lng?: number;
  walletBalance: number;
  isBlocked: boolean;
  codNoShows: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopCapabilities {
  supportedSizes: string[]; // e.g. ["A4", "A3", "Legal", "Letter"]
  supportedPapers: string[]; // e.g. ["Normal 75gsm", "Bond paper 85gsm", "Glossy 180gsm", "Cardstock 250gsm"]
  supportedBindings: string[]; // e.g. ["None", "Corner Staple", "Spiral Ring Binding"]
  colorPrinting: boolean;
  duplexPrinting: boolean;
  maxDailyCapacity: number;
}

export interface KycDocs {
  tradeLicense?: string | null;
  ownerIdProof?: string | null;
  gstNumber?: string | null;
  rejectionReason?: string | null;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  kycStatus: KycStatus;
  kycDocs: KycDocs;
  isOnline: boolean;
  isBusy: boolean;
  capabilities: ShopCapabilities;
  maxDailyCapacity: number;
  currentQueueCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrintSpecs {
  paperSize: 'A4' | 'A3' | 'Legal' | 'Letter';
  printType: 'BW' | 'COLOR';
  paperType: 'Normal 75gsm' | 'Bond paper 85gsm' | 'Glossy 180gsm' | 'Cardstock 250gsm';
  copies: number;
  duplex: boolean; // double-sided
  binding: 'None' | 'Corner Staple' | 'Spiral Ring Binding';
  customInstructions?: string;
}

export interface Order {
  id: string;
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
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  customNotes?: string;
  autoDeleteAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPartner {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: 'BIKE' | 'SCOOTER' | 'CYCLE';
  lat: number;
  lng: number;
  isAvailable: boolean;
  currentOrderId?: string;
  rating: number;
}

export interface Transaction {
  id: string;
  orderId: string;
  userId: string;
  shopId?: string;
  amount: number;
  platformCut: number;
  shopCut: number;
  mode: PaymentMode;
  status: 'PENDING' | 'HELD_IN_ESCROW' | 'SETTLED' | 'REFUNDED';
  settlementStatus: 'UNSETTLED' | 'VERIFIED_BY_ADMIN' | 'DISBURSED';
  settledAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  shopId: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface PricingRule {
  id: string;
  paperSize: string;
  printType: string;
  paperType: string;
  pricePerPage: number;
  bindingPrices: Record<string, number>;
  deliveryBaseFee: number;
  deliveryPerKm: number;
  surgeMultiplier: number;
}

export interface StockItem {
  id: string;
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
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'SHOP' | 'ADMIN';
  message: string;
  createdAt: string;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  targetAudience: 'ALL' | 'SHOPS' | 'CUSTOMERS';
  bannerType: 'INFO' | 'OFFER' | 'WARNING';
  isActive: boolean;
  createdAt: string;
}
