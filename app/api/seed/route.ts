import { NextResponse } from 'next/server';
import { ensureSeedData, memoryStore } from '@/lib/db';

export async function POST() {
  try {
    memoryStore.users = [];
    memoryStore.shops = [];
    memoryStore.printers = [];
    memoryStore.orders = [];
    memoryStore.plans = [];
    memoryStore.payments = [];

    await ensureSeedData();

    return NextResponse.json({
      success: true,
      message: 'Demo database seeded successfully with Admin, Shops, Printers, and Plans!',
      usersCount: memoryStore.users.length,
      shopsCount: memoryStore.shops.length,
      printersCount: memoryStore.printers.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to seed data' },
      { status: 500 }
    );
  }
}
