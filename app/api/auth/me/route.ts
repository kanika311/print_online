import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { connectDB, memoryStore } from '@/lib/db';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { isFallback } = await connectDB();
    let user: any = null;

    if (!isFallback) {
      try {
        user = await User.findById(session.userId);
      } catch (err) {
        console.warn('DB query error in /me:', err);
      }
    }

    if (!user) {
      user = memoryStore.users.find(
        (u) => u._id.toString() === session.userId || u.email === session.email
      );
    }

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 404 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shopId: user.shopId,
        avatarUrl: user.avatarUrl,
        walletBalance: user.walletBalance || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
