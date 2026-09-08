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

    const { name, email, phone, password, promoteExisting } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    const existing = memoryStore.users.find(
      (u: any) => u.email.toLowerCase() === emailLower
    );

    if (existing) {
      // If promoteExisting is requested, update credentials and ensure role is ADMIN
      if (promoteExisting) {
        const hashedPassword = await hashPassword(password);
        existing.role = 'ADMIN';
        existing.password = hashedPassword;
        if (name && name.trim()) existing.name = name.trim();
        if (phone) existing.phone = phone;
        existing.avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(existing.name)}`;
        existing.updatedAt = new Date();

        if (!isFallback) {
          try {
            await User.findOneAndUpdate(
              { email: emailLower },
              {
                role: 'ADMIN',
                password: hashedPassword,
                name: existing.name,
                phone: existing.phone,
                avatarUrl: existing.avatarUrl,
                updatedAt: new Date(),
              }
            );
          } catch (err) {
            console.warn('DB promote admin error:', err);
          }
        }

        return NextResponse.json({
          success: true,
          promoted: true,
          message: `Account '${emailLower}' successfully updated to Super Admin!`,
          user: {
            id: existing._id,
            name: existing.name,
            email: existing.email,
            phone: existing.phone,
            role: 'ADMIN',
            createdAt: existing.createdAt,
          },
        });
      }

      // If already an ADMIN and not promoting/updating
      if (existing.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'An administrator with this email already exists' },
          { status: 409 }
        );
      }

      const roleLabel =
        existing.role === 'SHOP_OWNER'
          ? 'Printer Hub Partner (Shop Owner)'
          : 'Customer';

      return NextResponse.json(
        {
          error: `This email is already registered as a ${roleLabel} (${existing.name}). You can upgrade this account to Super Admin or use another email.`,
          canPromote: true,
          existingRole: existing.role,
          existingName: existing.name,
          existingEmail: existing.email,
        },
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
