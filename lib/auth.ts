import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { UserRole } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_printporter_jwt_secret_token_key_2026';

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  shopId?: string;
}

export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, 10);
}

export async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hashed);
}

export function signToken(payload: AuthSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession;
  } catch (error) {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest): AuthSession | null {
  // Check authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = verifyToken(token);
    if (session) return session;
  }

  // Check cookies
  const cookie = request.cookies.get('printporter_token')?.value;
  if (cookie) {
    const session = verifyToken(cookie);
    if (session) return session;
  }

  return null;
}

export function authorize(
  request: NextRequest,
  allowedRoles?: UserRole[]
): { session: AuthSession | null; error?: string; status?: number } {
  const session = getSessionFromRequest(request);

  if (!session) {
    return { session: null, error: 'Unauthorized. Please login.', status: 401 };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      session,
      error: `Forbidden. Only ${allowedRoles.join(' or ')} can access this resource.`,
      status: 403,
    };
  }

  return { session };
}
