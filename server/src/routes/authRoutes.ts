import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mongoStore, UserDoc } from '../db/mongoStore';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

export const authRouter = Router();

// Send Mobile OTP
authRouter.post('/send-otp', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required.' });
  }

  // Generate test OTP (defaults to 123456 for easy evaluation)
  const otp = '123456';
  NotificationService.send(
    'SMS',
    'CUSTOMER',
    phone,
    'PrintPorter Login OTP',
    `Your verification OTP code is ${otp}. Valid for 10 minutes. Do not share.`
  );

  return res.json({
    success: true,
    message: 'OTP sent successfully via SMS.',
    mockOtp: otp, // Returned for instant demo testing
  });
});

// Verify Mobile OTP & Log In
authRouter.post('/verify-otp', (req: Request, res: Response) => {
  const { phone, otp, name, role } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
  }

  if (otp !== '123456') {
    return res.status(400).json({ success: false, message: 'Invalid OTP code. Use 123456 for testing.' });
  }

  let user = mongoStore.getUserByPhone(phone);
  if (!user) {
    user = {
      _id: `usr_${uuidv4().substring(0, 8)}`,
      name: name || 'Print Customer',
      phone,
      role: (role as any) || 'CUSTOMER',
      walletBalance: 100.0, // Welcome bonus
      isBlocked: false,
      codNoShows: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mongoStore.saveUser(user);
  }

  const token = generateToken({
    id: user._id,
    phone: user.phone,
    role: user.role,
    name: user.name,
  });

  return res.json({
    success: true,
    token,
    user,
  });
});

// One-Click Persona Switcher for Quick Evaluator Testing
authRouter.post('/switch-persona', (req: Request, res: Response) => {
  const { persona } = req.body; // 'customer' | 'partner' | 'admin' | 'delivery'

  let targetUserId = 'usr_customer_101';
  if (persona === 'partner') targetUserId = 'usr_owner_201';
  if (persona === 'admin') targetUserId = 'usr_admin_301';
  if (persona === 'delivery') targetUserId = 'usr_delivery_401';

  const user = mongoStore.getUserById(targetUserId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Persona user not found.' });
  }

  const token = generateToken({
    id: user._id,
    phone: user.phone,
    role: user.role,
    name: user.name,
  });

  // Also include partner's shop ID if partner
  let shopId = null;
  if (user.role === 'SHOP_OWNER') {
    const shops = mongoStore.getAllShops().filter(s => s.ownerId === user._id);
    if (shops.length > 0) shopId = shops[0]._id;
  }

  return res.json({
    success: true,
    token,
    user,
    shopId,
  });
});

// Current User Info
authRouter.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const user = mongoStore.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  let shop = null;
  if (user.role === 'SHOP_OWNER') {
    const shops = mongoStore.getAllShops().filter(s => s.ownerId === user._id);
    if (shops.length > 0) shop = shops[0];
  }

  return res.json({
    success: true,
    user,
    shop,
  });
});
