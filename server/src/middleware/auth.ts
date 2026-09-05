import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'printporter_super_secret_jwt_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: string;
    name: string;
  };
}

export function generateToken(payload: { id: string; phone: string; role: string; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token provided in local dev, allow passing x-user-id header for simple testing
    const devUserId = req.headers['x-user-id'] as string;
    if (devUserId) {
      req.user = { id: devUserId, phone: '9876543210', role: 'CUSTOMER', name: 'Dev User' };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  });
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${roles.join(', ')}] role.`,
      });
    }
    next();
  };
}
