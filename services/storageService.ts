import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { connectDB, memoryStore } from '@/lib/db';
import { StoredFile as StoredFileModel } from '@/models/StoredFile';

export interface StoredFile {
  fileId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  estimatedPages: number;
  checksum: string;
}

export async function saveUploadedFile(
  file: File | Blob,
  originalName: string
): Promise<StoredFile> {
  const { isFallback } = await connectDB();

  const fileExt = path.extname(originalName) || '.pdf';
  const cleanBase = path.basename(originalName, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const uniqueName = `${cleanBase}_${Date.now()}${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString('base64');
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

  // Estimate page count
  let estimatedPages = 1;
  const mimeType = file.type || (fileExt.toLowerCase() === '.pdf' ? 'application/pdf' : 'image/jpeg');

  if (mimeType === 'application/pdf' || fileExt.toLowerCase() === '.pdf') {
    try {
      const pdfText = buffer.toString('binary');
      const matches = pdfText.match(/\/Type\s*\/Page[^s]/g);
      if (matches && matches.length > 0) {
        estimatedPages = matches.length;
      } else {
        estimatedPages = Math.max(1, Math.min(50, Math.ceil(buffer.length / (60 * 1024))));
      }
    } catch {
      estimatedPages = 1;
    }
  }

  const fileRecord = {
    _id: fileId,
    fileName: originalName,
    fileType: mimeType,
    fileSizeBytes: buffer.length,
    data: base64Data,
    checksum,
    estimatedPages,
  };

  // 1. Persist to MongoDB
  if (!isFallback) {
    try {
      await StoredFileModel.create(fileRecord);
    } catch (err) {
      console.warn('MongoDB file storage failed, falling back to memory:', err);
    }
  }

  // 2. Always store in global memoryStore for instant access
  if (!global.memoryStore!.uploadedFiles) {
    global.memoryStore!.uploadedFiles = [];
  }
  global.memoryStore!.uploadedFiles.unshift(fileRecord);

  // 3. Optional local disk cache (fails gracefully in read-only environments like Vercel)
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, uniqueName), buffer);
  } catch {
    // Expected on Vercel read-only serverless filesystem — ignored safely
  }

  return {
    fileId,
    fileUrl: `/api/files/${fileId}`,
    fileName: originalName,
    fileType: mimeType,
    fileSizeBytes: buffer.length,
    estimatedPages,
    checksum,
  };
}
