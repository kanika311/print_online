import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlan {
  _id?: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxPrinters: number;
  commissionRate: number; // percentage, e.g. 3.0
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  colorScheme: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    _id: { type: String },
    name: { type: String, required: true, unique: true },
    priceMonthly: { type: Number, required: true },
    priceYearly: { type: Number, required: true },
    maxPrinters: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    features: { type: [String], default: [] },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    colorScheme: { type: String, default: 'blue' },
  },
  { timestamps: true }
);

export const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;
