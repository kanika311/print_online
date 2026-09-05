import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentType = 'CASH' | 'ONLINE' | 'UPI';
export type PaymentStatus = 'PENDING_APPROVAL' | 'PAID' | 'FAILED';
export type FulfillmentType = 'PICKUP' | 'DELIVERY';
export type OrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'QUEUED'
  | 'PRINTING'
  | 'READY'
  | 'PORTER_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderFileItem {
  url: string;
  name: string;
  type: string;
  size: number;
  pages: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  shopId: string;
  shopName: string;
  printerId: string;
  printerName: string;

  // Single or Multi-file support
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  files: OrderFileItem[];

  pageCount: number;
  pageRange: string;
  copies: number;
  isColor: boolean;
  isDuplex: boolean;
  paperSize: string;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  binding: string;
  notes?: string;

  // Pricing & Breakdown
  totalPrice: number;
  breakdown: {
    pagesTotal: number;
    ratePerPage: number;
    printingSubtotal: number;
    bindingFee: number;
    deliveryFee: number;
    gstAmount: number;
  };

  // Payment
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  upiRefNumber?: string;
  upiId?: string;

  // Fulfillment (Self Pickup vs Porter Delivery)
  fulfillmentType: FulfillmentType;
  deliveryAddress?: string;
  deliveryFee: number;
  deliveryEstimatedMinutes?: number;

  status: OrderStatus;
  queuePosition: number;
  estimatedWaitMinutes: number;
  approvedAt?: Date;
  startedPrintingAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    shopId: { type: String, required: true, index: true },
    shopName: { type: String, required: true },
    printerId: { type: String, required: true, index: true },
    printerName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSizeBytes: { type: Number, default: 0 },
    files: [
      {
        url: { type: String },
        name: { type: String },
        type: { type: String },
        size: { type: Number },
        pages: { type: Number, default: 1 },
      },
    ],
    pageCount: { type: Number, required: true, default: 1 },
    pageRange: { type: String, default: 'All' },
    copies: { type: Number, required: true, default: 1 },
    isColor: { type: Boolean, default: false },
    isDuplex: { type: Boolean, default: false },
    paperSize: { type: String, default: 'A4' },
    orientation: {
      type: String,
      enum: ['PORTRAIT', 'LANDSCAPE'],
      default: 'PORTRAIT',
    },
    binding: { type: String, default: 'None' },
    notes: { type: String },
    totalPrice: { type: Number, required: true },
    breakdown: {
      pagesTotal: { type: Number, default: 1 },
      ratePerPage: { type: Number, default: 2.0 },
      printingSubtotal: { type: Number, default: 2.0 },
      bindingFee: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      gstAmount: { type: Number, default: 0 },
    },
    paymentType: {
      type: String,
      enum: ['CASH', 'ONLINE', 'UPI'],
      default: 'UPI',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'PAID', 'FAILED'],
      default: 'PENDING_APPROVAL',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    upiRefNumber: { type: String },
    upiId: { type: String },

    fulfillmentType: {
      type: String,
      enum: ['PICKUP', 'DELIVERY'],
      default: 'PICKUP',
    },
    deliveryAddress: { type: String },
    deliveryFee: { type: Number, default: 0 },
    deliveryEstimatedMinutes: { type: Number, default: 25 },

    status: {
      type: String,
      enum: [
        'PENDING',
        'APPROVED',
        'QUEUED',
        'PRINTING',
        'READY',
        'PORTER_ASSIGNED',
        'OUT_FOR_DELIVERY',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'PENDING',
      index: true,
    },
    queuePosition: { type: Number, default: 1 },
    estimatedWaitMinutes: { type: Number, default: 3 },
    approvedAt: { type: Date },
    startedPrintingAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
