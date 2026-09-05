import mongoose, { Schema, Model } from 'mongoose';

export type PrinterStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type PrinterType = 'COLOR' | 'MONOCHROME';
export type PrinterConnectionType = 'NETWORK_IP' | 'USB_PORT' | 'CLOUD_AGENT';

export interface IPrinter {
  _id?: string;
  shopId: string;
  name: string;
  model: string;
  type: PrinterType;
  paperSizes: string[];
  status: PrinterStatus;
  ppmSpeed: number; // Pages Per Minute
  currentJobId?: string | null;
  currentDocumentName?: string | null;
  queueCount: number;
  totalPrintsCompleted: number;
  supportsDuplex: boolean;
  notes?: string;

  // Hardware Linking Fields
  connectionType?: PrinterConnectionType;
  ipAddress?: string;
  portNumber?: number;
  usbPort?: string;
  pairingCode?: string;
  isLinked?: boolean;
  lastPingAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

const PrinterSchema = new Schema<IPrinter>(
  {
    shopId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    model: { type: String, required: true },
    type: {
      type: String,
      enum: ['COLOR', 'MONOCHROME'],
      default: 'MONOCHROME',
    },
    paperSizes: {
      type: [String],
      default: ['A4', 'A3', 'Legal'],
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
      default: 'AVAILABLE',
      index: true,
    },
    ppmSpeed: { type: Number, default: 30 },
    currentJobId: { type: String, default: null },
    currentDocumentName: { type: String, default: null },
    queueCount: { type: Number, default: 0 },
    totalPrintsCompleted: { type: Number, default: 0 },
    supportsDuplex: { type: Boolean, default: true },
    notes: { type: String },
    connectionType: {
      type: String,
      enum: ['NETWORK_IP', 'USB_PORT', 'CLOUD_AGENT'],
      default: 'NETWORK_IP',
    },
    ipAddress: { type: String },
    portNumber: { type: Number, default: 9100 },
    usbPort: { type: String },
    pairingCode: { type: String },
    isLinked: { type: Boolean, default: true },
    lastPingAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Printer: Model<IPrinter> =
  mongoose.models.Printer || mongoose.model<IPrinter>('Printer', PrinterSchema);

export default Printer;
