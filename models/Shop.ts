import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShop {
  _id?: string;
  name: string;
  ownerId: string;
  address: string;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  phone: string;
  email?: string;
  qrCodeUrl: string;
  upiId?: string; // Shopkeeper UPI ID for direct customer payment
  upiQrUrl?: string; // Uploaded shop QR image (GPay/PhonePe/Paytm/standee)
  isActive: boolean; // Admin activation/deactivation control
  isOnline: boolean; // Daily operational toggle
  isBusy: boolean;
  rating: number;
  reviewCount: number;
  currentQueueCount: number;
  estimatedWaitMinutes: number;
  capabilities: {
    supportedSizes: string[];
    colorPrinting: boolean;
    duplexPrinting: boolean;
    supportedBindings: string[];
  };
  pricingRates: {
    bwSingle: number;
    bwDuplex: number;
    colorSingle: number;
    colorDuplex: number;
    a3Surcharge: number;
    spiralBinding: number;
    stapleBinding: number;
  };
  activePlan: string;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  totalRevenue: number;
  cashCollected: number;
  onlineCollected: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true },
    ownerId: { type: String, required: true, index: true },
    address: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [77.6245, 12.9352],
      },
    },
    phone: { type: String, required: true },
    email: { type: String },
    qrCodeUrl: { type: String, default: '' },
    upiId: { type: String, default: 'apexprint@upi' },
    upiQrUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: true },
    isBusy: { type: Boolean, default: false },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 36 },
    currentQueueCount: { type: Number, default: 0 },
    estimatedWaitMinutes: { type: Number, default: 5 },
    capabilities: {
      supportedSizes: {
        type: [String],
        default: ['A4', 'A3', 'Legal', 'Letter'],
      },
      colorPrinting: { type: Boolean, default: true },
      duplexPrinting: { type: Boolean, default: true },
      supportedBindings: {
        type: [String],
        default: ['None', 'Corner Staple', 'Spiral Binding'],
      },
    },
    pricingRates: {
      bwSingle: { type: Number, default: 2.0 },
      bwDuplex: { type: Number, default: 3.5 },
      colorSingle: { type: Number, default: 10.0 },
      colorDuplex: { type: Number, default: 18.0 },
      a3Surcharge: { type: Number, default: 5.0 },
      spiralBinding: { type: Number, default: 35.0 },
      stapleBinding: { type: Number, default: 5.0 },
    },
    activePlan: { type: String, default: 'Free Launch Plan' },
    subscriptionStatus: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'TRIAL'],
      default: 'ACTIVE',
    },
    totalRevenue: { type: Number, default: 0 },
    cashCollected: { type: Number, default: 0 },
    onlineCollected: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Shop: Model<IShop> =
  mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);

export default Shop;
