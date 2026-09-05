import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { RegisterSchema } from '@/lib/validations';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { isFallback } = await connectDB();
    const body = await req.json();

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;

    // Check existing email
    let existingUser: any = null;
    if (!isFallback) {
      try {
        existingUser = await User.findOne({
          $or: [{ email: email.toLowerCase() }, { phone }],
        });
      } catch (err) {
        console.warn('DB query failed, fallback check:', err);
      }
    }

    if (!existingUser) {
      existingUser = memoryStore.users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() || u.phone === phone
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or phone already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const userId = `usr_${Date.now()}`;

    const newUserObj = {
      _id: userId,
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: 'CUSTOMER' as const,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      isBlocked: false,
      walletBalance: 100, // Sign up bonus ₹100
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isFallback) {
      try {
        await User.create(newUserObj);
      } catch (err) {
        console.warn('Could not save to MongoDB, saving to memory store:', err);
        memoryStore.users.push(newUserObj);
      }
    } else {
      memoryStore.users.push(newUserObj);
    }

    const token = signToken({
      userId,
      name,
      email: email.toLowerCase(),
      role: 'CUSTOMER',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully! Welcome to PrintPorter.',
      user: {
        id: userId,
        name,
        email,
        phone,
        role: 'CUSTOMER',
        avatarUrl: newUserObj.avatarUrl,
        walletBalance: 100,
      },
      token,
    });

    response.cookies.set('printporter_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error during registration' },
      { status: 500 }
    );
  }
}
