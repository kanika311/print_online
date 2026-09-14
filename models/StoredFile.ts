import mongoose, { Schema, Model } from 'mongoose';

export interface IStoredFile {
  _id?: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  data: string; // Base64 encoded binary data
  checksum: string; // SHA-256 checksum for integrity verification
  estimatedPages: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const StoredFileSchema = new Schema<IStoredFile>(
  {
    _id: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true, default: 'application/pdf' },
    fileSizeBytes: { type: Number, required: true, default: 0 },
    data: { type: String, required: true },
    checksum: { type: String, required: true },
    estimatedPages: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const StoredFile: Model<IStoredFile> =
  mongoose.models.StoredFile ||
  mongoose.model<IStoredFile>('StoredFile', StoredFileSchema);

export default StoredFile;
