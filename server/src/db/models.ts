import mongoose, { Schema, Document } from 'mongoose';

// --- GeoJSON Point Subschema ---
const GeoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    // [longitude, latitude] in GeoJSON format
    coordinates: {
      type: [Number],
      required: true,
      default: [77.6245, 12.9352],
    },
  },
  { _id: false }
);

// --- 1. USER SCHEMA ---
export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  role: 'CUSTOMER' | 'SHOP_OWNER' | 'ADMIN' | 'DELIVERY_PARTNER';
  avatarUrl?: string;
  address?: string;
  location?: { type: string; coordinates: [number, number] };
  walletBalance: number;
  isBlocked: boolean;
  codNoShows: number;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, sparse: true },
    role: {
      type: String,
      enum: ['CUSTOMER', 'SHOP_OWNER', 'ADMIN', 'DELIVERY_PARTNER'],
      default: 'CUSTOMER',
      index: true,
    },
    avatarUrl: { type: String },
    address: { type: String },
    location: { type: GeoPointSchema },
    walletBalance: { type: Number, default: 0.0 },
    isBlocked: { type: Boolean, default: false },
    codNoShows: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// --- 2. SHOP SCHEMA ---
export interface IShop extends Document {
  ownerId: string;
  name: string;
  address: string;
  location: { type: string; coordinates: [number, number] };
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
  createdAt: Date;
  updatedAt: Date;
}

export const ShopSchema = new Schema<IShop>(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: GeoPointSchema, required: true },
    phone: { type: String, required: true },
    kycStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    kycDocs: {
      tradeLicense: { type: String, default: null },
      ownerIdProof: { type: String, default: null },
      gstNumber: { type: String, default: null },
      rejectionReason: { type: String, default: null },
    },
    isOnline: { type: Boolean, default: false, index: true },
    isBusy: { type: Boolean, default: false },
    capabilities: {
      supportedSizes: {
        type: [String],
        default: ['A4', 'A3', 'Legal', 'Letter'],
      },
      supportedPapers: {
        type: [String],
        default: ['Normal 75gsm', 'Bond paper 85gsm', 'Glossy 180gsm', 'Cardstock 250gsm'],
      },
      supportedBindings: {
        type: [String],
        default: ['None', 'Corner Staple', 'Spiral Ring Binding'],
      },
      colorPrinting: { type: Boolean, default: true },
      duplexPrinting: { type: Boolean, default: true },
      maxDailyCapacity: { type: Number, default: 2000 },
    },
    maxDailyCapacity: { type: Number, default: 2000 },
    currentQueueCount: { type: Number, default: 0 },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 2dsphere index for MongoDB geospatial queries
ShopSchema.index({ location: '2dsphere' });

// --- 3. DELIVERY PARTNER SCHEMA ---
export interface IDeliveryPartner extends Document {
  userId: string;
  name: string;
  phone: string;
  vehicleType: 'BIKE' | 'SCOOTER' | 'CYCLE';
  location: { type: string; coordinates: [number, number] };
  isAvailable: boolean;
  currentOrderId?: string;
  rating: number;
}

export const DeliveryPartnerSchema = new Schema<IDeliveryPartner>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    vehicleType: { type: String, enum: ['BIKE', 'SCOOTER', 'CYCLE'], default: 'BIKE' },
    location: { type: GeoPointSchema, required: true },
    isAvailable: { type: Boolean, default: true },
    currentOrderId: { type: String, default: null },
    rating: { type: Number, default: 4.9 },
  },
  { timestamps: true }
);
DeliveryPartnerSchema.index({ location: '2dsphere' });

// --- 4. ORDER SCHEMA ---
export interface IOrder extends Document {
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
  deliveryLocation?: { type: string; coordinates: [number, number] };
  customNotes?: string;
  autoDeleteAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    shopId: { type: String, index: true },
    deliveryPartnerId: { type: String },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSizeMb: { type: Number, default: 1.0 },
    pageCount: { type: Number, default: 1 },
    specs: {
      paperSize: { type: String, default: 'A4' },
      printType: { type: String, default: 'BW' },
      paperType: { type: String, default: 'Normal 75gsm' },
      copies: { type: Number, default: 1 },
      duplex: { type: Boolean, default: false },
      binding: { type: String, default: 'None' },
      customInstructions: { type: String, default: '' },
    },
    totalPrice: { type: Number, required: true },
    platformFee: { type: Number, default: 5.0 },
    shopEarnings: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0.0 },
    paymentMode: { type: String, enum: ['ONLINE', 'COD'], required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'ESCROW_HELD', 'COLLECTED_BY_SHOP', 'PAID_OUT', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'MATCHING',
        'DISPATCHED_TO_SHOP',
        'ACCEPTED',
        'PRINTING',
        'READY',
        'OUT_FOR_DELIVERY',
        'COMPLETED',
        'CANCELLED',
        'REASSIGNED',
      ],
      default: 'MATCHING',
      index: true,
    },
    deliveryType: { type: String, enum: ['SELF_PICKUP', 'HOME_DELIVERY'], default: 'SELF_PICKUP' },
    deliveryAddress: { type: String },
    deliveryLocation: { type: GeoPointSchema },
    customNotes: { type: String },
    autoDeleteAt: { type: Date }, // Privacy auto-cleanup
  },
  { timestamps: true }
);

// --- 5. TRANSACTION SCHEMA ---
export interface ITransaction extends Document {
  orderId: string;
  userId: string;
  shopId?: string;
  amount: number;
  platformCut: number;
  shopCut: number;
  mode: 'ONLINE' | 'COD';
  status: 'PENDING' | 'HELD_IN_ESCROW' | 'SETTLED' | 'REFUNDED';
  settlementStatus: 'UNSETTLED' | 'VERIFIED_BY_ADMIN' | 'DISBURSED';
  settledAt?: Date;
  createdAt: Date;
}

export const TransactionSchema = new Schema<ITransaction>(
  {
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    shopId: { type: String, index: true },
    amount: { type: Number, required: true },
    platformCut: { type: Number, required: true },
    shopCut: { type: Number, required: true },
    mode: { type: String, enum: ['ONLINE', 'COD'], required: true },
    status: {
      type: String,
      enum: ['PENDING', 'HELD_IN_ESCROW', 'SETTLED', 'REFUNDED'],
      default: 'PENDING',
    },
    settlementStatus: {
      type: String,
      enum: ['UNSETTLED', 'VERIFIED_BY_ADMIN', 'DISBURSED'],
      default: 'UNSETTLED',
      index: true,
    },
    settledAt: { type: Date },
  },
  { timestamps: true }
);

// --- 6. REVIEW SCHEMA ---
export interface IReview extends Document {
  orderId: string;
  shopId: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export const ReviewSchema = new Schema<IReview>(
  {
    orderId: { type: String, required: true },
    shopId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

// --- 7. STOCK ITEM SCHEMA ---
export interface IStockItem extends Document {
  shopId: string;
  itemName: string;
  category: 'PAPER' | 'TONER' | 'BINDING';
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  updatedAt: Date;
}

export const StockItemSchema = new Schema<IStockItem>(
  {
    shopId: { type: String, required: true, index: true },
    itemName: { type: String, required: true },
    category: { type: String, enum: ['PAPER', 'TONER', 'BINDING'], required: true },
    currentStock: { type: Number, default: 500 },
    unit: { type: String, default: 'sheets' },
    lowStockThreshold: { type: Number, default: 100 },
    isLowStock: { type: Boolean, default: false },
    isOutOfStock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// --- 8. CHAT MESSAGE SCHEMA ---
export interface IChatMessage extends Document {
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'SHOP' | 'ADMIN';
  message: string;
  createdAt: Date;
}

export const ChatMessageSchema = new Schema<IChatMessage>(
  {
    orderId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ['CUSTOMER', 'SHOP', 'ADMIN'], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

// --- 9. BROADCAST SCHEMA ---
export interface IBroadcast extends Document {
  title: string;
  message: string;
  targetAudience: 'ALL' | 'SHOPS' | 'CUSTOMERS';
  bannerType: 'INFO' | 'OFFER' | 'WARNING';
  isActive: boolean;
  createdAt: Date;
}

export const BroadcastSchema = new Schema<IBroadcast>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetAudience: { type: String, enum: ['ALL', 'SHOPS', 'CUSTOMERS'], default: 'ALL' },
    bannerType: { type: String, enum: ['INFO', 'OFFER', 'WARNING'], default: 'INFO' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Export Mongoose Models (reusing if already compiled in hot-reloading)
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const ShopModel = mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);
export const DeliveryPartnerModel =
  mongoose.models.DeliveryPartner || mongoose.model<IDeliveryPartner>('DeliveryPartner', DeliveryPartnerSchema);
export const OrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export const TransactionModel =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export const StockItemModel =
  mongoose.models.StockItem || mongoose.model<IStockItem>('StockItem', StockItemSchema);
export const ChatMessageModel =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export const BroadcastModel =
  mongoose.models.Broadcast || mongoose.model<IBroadcast>('Broadcast', BroadcastSchema);
