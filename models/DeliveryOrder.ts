import mongoose, { Schema, Document, Model } from 'mongoose';

export type PorterStatus =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface IDeliveryOrder extends Document {
  orderId: string;
  orderNumber: string;
  shopId: string;
  shopName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryFee: number;
  porterStatus: PorterStatus;
  porterName?: string;
  porterPhone?: string;
  porterVehicleNumber?: string;
  estimatedDeliveryMinutes: number;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  trackingUpdates: Array<{
    status: string;
    timestamp: Date;
    description: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryOrderSchema = new Schema<IDeliveryOrder>(
  {
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true },
    shopId: { type: String, required: true },
    shopName: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    deliveryFee: { type: Number, default: 40.0 },
    porterStatus: {
      type: String,
      enum: [
        'UNASSIGNED',
        'ASSIGNED',
        'PICKED_UP',
        'IN_TRANSIT',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'UNASSIGNED',
    },
    porterName: { type: String, default: 'Porter Courier Partner' },
    porterPhone: { type: String, default: '+91 98980 12345' },
    porterVehicleNumber: { type: String, default: 'DL-8S-4421' },
    estimatedDeliveryMinutes: { type: Number, default: 25 },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    trackingUpdates: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        description: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const DeliveryOrder: Model<IDeliveryOrder> =
  mongoose.models.DeliveryOrder ||
  mongoose.model<IDeliveryOrder>('DeliveryOrder', DeliveryOrderSchema);

export default DeliveryOrder;
