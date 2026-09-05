import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  orderId: string;
  orderNumber: string;
  shopId: string;
  shopName: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentType: 'CASH' | 'ONLINE';
  paymentStatus: 'PENDING_APPROVAL' | 'SUCCESS' | 'FAILED';
  adminCommission: number; // e.g. 5% cut
  shopEarnings: number; // e.g. 95%
  transactionId: string;
  paymentGatewayRef?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true },
    shopId: { type: String, required: true, index: true },
    shopName: { type: String, required: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentType: {
      type: String,
      enum: ['CASH', 'ONLINE'],
      default: 'CASH',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'SUCCESS', 'FAILED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    adminCommission: { type: Number, default: 0 },
    shopEarnings: { type: Number, default: 0 },
    transactionId: { type: String, required: true, unique: true },
    paymentGatewayRef: { type: String },
    approvedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
