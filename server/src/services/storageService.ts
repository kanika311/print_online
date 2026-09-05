import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { mongoStore } from '../db/mongoStore';

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max PDF size
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported for printing.'));
    }
  },
});

export class StorageService {
  /**
   * Start privacy garbage collection cron (runs every 10 minutes)
   * Deletes files that have passed their autoDeleteAt timestamp
   */
  public static startPrivacyCleaner() {
    console.log('🔒 [StorageService] Document privacy cleaner initialized (Auto-expiry active).');
    setInterval(() => {
      this.purgeExpiredDocuments();
    }, 10 * 60 * 1000); // 10 minutes
  }

  public static purgeExpiredDocuments() {
    const now = new Date().getTime();
    const orders = mongoStore.getOrders();
    let purgedCount = 0;

    for (const order of orders) {
      if (order.autoDeleteAt && new Date(order.autoDeleteAt).getTime() <= now) {
        if (order.fileUrl && !order.fileUrl.startsWith('http')) {
          const filePath = path.join(UPLOAD_DIR, path.basename(order.fileUrl));
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              purgedCount++;
              console.log(`[StorageService] Purged expired sensitive document for order ${order.orderNumber}`);
            } catch (err) {
              console.error(`[StorageService] Failed to unlink file ${filePath}:`, err);
            }
          }
        }
        order.fileUrl = '[EXPIRED_FOR_PRIVACY]';
        mongoStore.saveOrder(order);
      }
    }
    if (purgedCount > 0) {
      console.log(`[StorageService] Privacy cleaner completed. ${purgedCount} expired documents shredded.`);
    }
  }
}
