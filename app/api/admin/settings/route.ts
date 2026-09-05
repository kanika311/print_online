import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    if (!memoryStore.settings) {
      memoryStore.settings = {
        platformFeeEnabled: false,
        platformFeeType: 'FLAT',
        platformFeeAmount: 0,
        platformFeeLabel: 'Platform Convenience Fee',
      };
    }

    return NextResponse.json({
      success: true,
      settings: memoryStore.settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

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

    if (!memoryStore.settings) {
      memoryStore.settings = {
        platformFeeEnabled: false,
        platformFeeType: 'FLAT',
        platformFeeAmount: 0,
        platformFeeLabel: 'Platform Convenience Fee',
      };
    }

    if (body.platformFeeEnabled !== undefined) {
      memoryStore.settings.platformFeeEnabled = Boolean(body.platformFeeEnabled);
    }
    if (body.platformFeeType !== undefined) {
      memoryStore.settings.platformFeeType = body.platformFeeType === 'PERCENT' ? 'PERCENT' : 'FLAT';
    }
    if (body.platformFeeAmount !== undefined) {
      memoryStore.settings.platformFeeAmount = Math.max(0, Number(body.platformFeeAmount) || 0);
    }
    if (body.platformFeeLabel !== undefined) {
      memoryStore.settings.platformFeeLabel = String(body.platformFeeLabel);
    }

    return NextResponse.json({
      success: true,
      message: 'Platform monetization settings updated successfully',
      settings: memoryStore.settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
