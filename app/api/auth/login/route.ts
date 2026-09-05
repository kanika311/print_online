import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { LoginSchema } from '@/lib/validations';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { isFallback } = await connectDB();
    const body = await req.json();

    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    let user: any = null;

    if (!isFallback) {
      try {
        user = await User.findOne({ email: email.toLowerCase() });
      } catch (err) {
        console.warn('DB query failed, checking memory store:', err);
      }
    }

    if (!user) {
      user = memoryStore.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact administrator.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    });

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shopId: user.shopId,
        avatarUrl: user.avatarUrl,
        walletBalance: user.walletBalance,
      },
      token,
    });

    // Set cookie
    response.cookies.set('printporter_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error during login' },
      { status: 500 }
    );
  }
}
