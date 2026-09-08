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

    let admins = memoryStore.users
      .filter((u) => u.role === 'ADMIN')
      .map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
      }));

    if (!isFallback) {
      try {
        const dbAdmins = await User.find({ role: 'ADMIN' }).lean();
        if (dbAdmins && dbAdmins.length > 0) {
          admins = dbAdmins.map((u: any) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            avatarUrl: u.avatarUrl,
            createdAt: u.createdAt,
          }));
        }
      } catch (err) {
        console.warn('DB list admins warning:', err);
      }
    }

    return NextResponse.json({ admins });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch administrators' },
      { status: 500 }
    );
  }
}
