import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\+]/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
}

export function isValidIndianPhone(phone: string): boolean {
  const cleaned = sanitizePhoneNumber(phone);
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function isValidUpiId(upi: string): boolean {
  if (!upi || !upi.trim()) return true;
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi.trim());
}

export const AdminCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters and spaces'),
  email: z.string().trim().toLowerCase().email('Valid email address is required'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || isValidIndianPhone(val), {
      message: 'Phone must be a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)',
    })
    .transform((val) => (val ? sanitizePhoneNumber(val) : '')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'CUSTOMER']).optional().default('ADMIN'),
  promoteExisting: z.boolean().optional(),
});


export const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters and spaces'),
  email: z.string().trim().toLowerCase().email('Valid email address is required'),
  phone: z
    .string()
    .trim()
    .refine((val) => isValidIndianPhone(val), {
      message: 'Phone must be a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)',
    })
    .transform((val) => sanitizePhoneNumber(val)),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const ShopRegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Shop name must be at least 3 characters')
      .max(80, 'Shop name cannot exceed 80 characters'),
    ownerName: z
      .string()
      .trim()
      .min(2, 'Owner name must be at least 2 characters')
      .max(50, 'Owner name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s.]+$/, 'Owner name can only contain letters and spaces'),
    ownerEmail: z.string().trim().toLowerCase().email('Valid owner email address is required'),
    ownerPhone: z
      .string()
      .trim()
      .refine((val) => isValidIndianPhone(val), {
        message: 'Owner phone must be a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)',
      })
      .transform((val) => sanitizePhoneNumber(val)),
    ownerPassword: z.string().min(6, 'Owner password must be at least 6 characters').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    planId: z.string().optional(),
    address: z
      .string()
      .trim()
      .min(5, 'Physical address must be at least 5 characters')
      .max(200, 'Address cannot exceed 200 characters'),
    lat: z.number().optional().default(28.5704),
    lng: z.number().optional().default(77.3245),
    activePlan: z.string().optional().default('Free Launch Plan'),
    capabilities: z
      .object({
        supportedSizes: z.array(z.string()).default(['A4', 'A3', 'Legal']),
        colorPrinting: z.boolean().default(true),
        duplexPrinting: z.boolean().default(true),
        supportedBindings: z.array(z.string()).default(['None', 'Corner Staple', 'Spiral Binding']),
      })
      .optional(),
  })
  .refine((data) => data.ownerPassword || data.password, {
    message: 'Owner password must be at least 6 characters',
    path: ['ownerPassword'],
  });

export const PrinterCreateSchema = z.object({
  shopId: z.string().min(1, 'Shop ID is required'),
  name: z.string().min(2, 'Printer display name is required'),
  model: z.string().min(2, 'Printer model is required'),
  type: z.enum(['COLOR', 'MONOCHROME']),
  paperSizes: z.array(z.string()).min(1, 'At least one paper size required'),
  ppmSpeed: z.number().min(5).max(120).default(30),
  supportsDuplex: z.boolean().default(true),
  connectionType: z.enum(['NETWORK_IP', 'USB_PORT', 'CLOUD_AGENT']).optional().default('NETWORK_IP'),
  ipAddress: z.string().optional(),
  portNumber: z.number().optional().default(9100),
  usbPort: z.string().optional(),
  pairingCode: z.string().optional(),
  isLinked: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

export const PrinterStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']),
  currentJobId: z.string().nullable().optional(),
  currentDocumentName: z.string().nullable().optional(),
});

export const OrderCreateSchema = z.object({
  shopId: z.string().min(1, 'Shop ID is required'),
  printerId: z.string().min(1, 'Printer ID is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSizeBytes: z.number().optional().default(0),
  files: z
    .array(
      z.object({
        url: z.string(),
        name: z.string(),
        type: z.string(),
        size: z.number().default(0),
        pages: z.number().default(1),
      })
    )
    .optional(),
  pageCount: z.number().min(1, 'Document must have at least 1 page'),
  pageRange: z.string().optional().default('All'),
  copies: z.number().min(1, 'Must order at least 1 copy'),
  isColor: z.boolean().default(false),
  isDuplex: z.boolean().default(false),
  paperSize: z.string().default('A4'),
  orientation: z.enum(['PORTRAIT', 'LANDSCAPE']).default('PORTRAIT'),
  binding: z.string().default('None'),
  notes: z.string().optional(),
  paymentType: z.enum(['CASH', 'ONLINE', 'UPI']),
  upiRefNumber: z.string().optional(),
  fulfillmentType: z.enum(['PICKUP', 'DELIVERY']).default('PICKUP'),
  deliveryAddress: z.string().optional(),
  deliveryFee: z.number().optional().default(0),
});

export const OrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'APPROVED',
    'QUEUED',
    'PRINTING',
    'READY',
    'PORTER_ASSIGNED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ]),
});
