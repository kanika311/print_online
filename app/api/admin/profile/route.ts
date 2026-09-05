import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize, comparePassword, hashPassword } from '@/lib/auth';
import { User } from '@/models/User';

// GET: Returns current admin profile and list of all platform administrators
export async function GET(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN']);
    if (authResult.error || !authResult.session) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.status || 401 }
      );
    }

    await connectDB();
    const currentAdminId = authResult.session.userId;
    const currentAdmin = memoryStore.users.find(
      (u: any) => u._id.toString() === currentAdminId || u.email === authResult.session?.email
    );

    const allAdmins = memoryStore.users
      .filter((u: any) => u.role === 'ADMIN')
      .map((u: any) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        isRoot: u.email === 'admin@printporter.com' || u._id === 'usr_admin_001',
      }));

    return NextResponse.json({
      success: true,
      currentAdmin: currentAdmin
        ? {
            id: currentAdmin._id,
            name: currentAdmin.name,
            email: currentAdmin.email,
            phone: currentAdmin.phone,
            role: currentAdmin.role,
            avatarUrl: currentAdmin.avatarUrl,
            isRoot: currentAdmin.email === 'admin@printporter.com' || currentAdmin._id === 'usr_admin_001',
          }
        : null,
      admins: allAdmins,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin profile' },
      { status: 500 }
    );
  }
}

// PATCH: Update admin profile (name, email, phone) and/or change password
export async function PATCH(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN']);
    if (authResult.error || !authResult.session) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.status || 401 }
      );
    }

    const { isFallback } = await connectDB();
    const body = await req.json();
    const currentAdminId = authResult.session.userId;

    const user = memoryStore.users.find(
      (u: any) => u._id.toString() === currentAdminId || u.email === authResult.session?.email
    );

    if (!user) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // 1. Password change validation
    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const isMatch = await comparePassword(body.currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      user.password = await hashPassword(body.newPassword);
    }

    // 2. Profile updates
    if (body.name) user.name = String(body.name).trim();
    if (body.phone) user.phone = String(body.phone).trim();
    if (body.email && body.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailLower = String(body.email).toLowerCase().trim();
      const duplicate = memoryStore.users.find(
        (u: any) => u.email.toLowerCase() === emailLower && u._id.toString() !== user._id.toString()
      );
      if (duplicate) {
        return NextResponse.json(
          { error: 'Another account is already using this email address' },
          { status: 409 }
        );
      }
      user.email = emailLower;
    }

    user.updatedAt = new Date();

    if (!isFallback) {
      try {
        await User.findByIdAndUpdate(user._id, {
          name: user.name,
          email: user.email,
          phone: user.phone,
          password: user.password,
        });
      } catch (err) {
        console.warn('DB update error in admin profile PATCH:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin profile updated successfully',
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update admin profile' },
      { status: 500 }
    );
  }
}
