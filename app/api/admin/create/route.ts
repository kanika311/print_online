import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize, hashPassword } from '@/lib/auth';
import { AdminCreateSchema } from '@/lib/validations';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const body = await req.json();

    const parsed = AdminCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    const existing = memoryStore.users.find(
      (u: any) => u.email.toLowerCase() === emailLower
    );

    if (existing) {
      return NextResponse.json(
        { error: 'An administrator with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const newId = `usr_adm_${Date.now()}`;

    const newAdminObj = {
      _id: newId,
      name: name.trim(),
      email: emailLower,
      phone: phone || '+91 99999 00000',
      password: hashedPassword,
      role: 'ADMIN' as const,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      isBlocked: false,
      walletBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.users.push(newAdminObj);

    if (!isFallback) {
      try {
        await User.create(newAdminObj);
      } catch (err) {
        console.warn('DB create admin error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'New Administrator created successfully',
      user: {
        id: newAdminObj._id,
        name: newAdminObj.name,
        email: newAdminObj.email,
        phone: newAdminObj.phone,
        role: newAdminObj.role,
        createdAt: newAdminObj.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create administrator' },
      { status: 500 }
    );
  }
}
