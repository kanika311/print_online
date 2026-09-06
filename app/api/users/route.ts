import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('q')?.toLowerCase() || '';

    let users = memoryStore.users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      shopId: u.shopId,
      avatarUrl: u.avatarUrl,
      isBlocked: Boolean(u.isBlocked),
      walletBalance: u.walletBalance || 0,
      createdAt: u.createdAt,
    }));

    if (role) {
      users = users.filter((u) => u.role === role);
    }

    if (search) {
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.phone.includes(search)
      );
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Admin toggle block status
export async function PATCH(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    await connectDB();
    const body = await req.json();
    const { userId, isBlocked } = body;

    const user = memoryStore.users.find((u) => u._id.toString() === userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.isBlocked = Boolean(isBlocked);

    return NextResponse.json({
      success: true,
      message: `User ${isBlocked ? 'suspended' : 'reactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Admin delete user account
export async function DELETE(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id') || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const index = memoryStore.users.findIndex((u) => u._id.toString() === userId);
    if (index === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting super admin
    if (memoryStore.users[index].role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot delete Super Admin account' }, { status: 403 });
    }

    memoryStore.users.splice(index, 1);

    if (!isFallback) {
      try {
        await User.findByIdAndDelete(userId);
      } catch (err) {
        console.warn('DB delete user error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// POST: Admin create new user or new Admin
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
    const { AdminCreateSchema } = await import('@/lib/validations');
    const parsed = AdminCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password, role } = parsed.data;

    const emailLower = email.toLowerCase().trim();
    const existing = memoryStore.users.find(
      (u: any) => u.email.toLowerCase() === emailLower
    );

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const { hashPassword } = await import('@/lib/auth');
    const hashedPassword = await hashPassword(password);
    const newId = `usr_adm_${Date.now()}`;

    const newUserObj = {
      _id: newId,
      name: name.trim(),
      email: emailLower,
      phone: phone ? phone : '+91 99999 00000',
      password: hashedPassword,
      role: (role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER') as any,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      isBlocked: false,
      walletBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.users.push(newUserObj);

    if (!isFallback) {
      try {
        await User.create(newUserObj);
      } catch (err) {
        console.warn('DB create user error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${role === 'ADMIN' ? 'New Administrator' : 'User'} created successfully`,
      user: {
        id: newUserObj._id,
        name: newUserObj.name,
        email: newUserObj.email,
        phone: newUserObj.phone,
        role: newUserObj.role,
        createdAt: newUserObj.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
