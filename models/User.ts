import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'CUSTOMER' | 'SHOP_OWNER' | 'ADMIN';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  avatarUrl?: string;
  address?: string;
  shopId?: string; // If role is SHOP_OWNER, links to their shop
  isBlocked: boolean;
  walletBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['CUSTOMER', 'SHOP_OWNER', 'ADMIN'],
      default: 'CUSTOMER',
      index: true,
    },
    avatarUrl: { type: String },
    address: { type: String },
    shopId: { type: String },
    isBlocked: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
