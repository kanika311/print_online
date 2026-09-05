import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { Plan } from '@/models/Plan';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ plans: memoryStore.plans });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

// Admin only: create or update plan
export async function POST(req: NextRequest) {
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

    const planId = body.id || `plan_${Date.now()}`;
    const newPlan = {
      _id: planId,
      name: body.name,
      priceMonthly: Number(body.priceMonthly),
      priceYearly: Number(body.priceYearly || body.priceMonthly * 10),
      maxPrinters: Number(body.maxPrinters || 5),
      commissionRate: Number(body.commissionRate || 3.0),
      features: body.features || [],
      isPopular: Boolean(body.isPopular),
      isActive: true,
      colorScheme: body.colorScheme || 'blue',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingIdx = memoryStore.plans.findIndex((p) => p._id === planId);
    if (existingIdx >= 0) {
      memoryStore.plans[existingIdx] = { ...memoryStore.plans[existingIdx], ...newPlan };
    } else {
      memoryStore.plans.push(newPlan);
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription plan saved successfully',
      plan: newPlan,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save plan' },
      { status: 500 }
    );
  }
}

// Admin only: edit subscription plan
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
    const planId = body.id || body._id;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const idx = memoryStore.plans.findIndex((p) => p._id === planId);
    if (idx === -1) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const plan = memoryStore.plans[idx];
    if (body.name !== undefined) plan.name = body.name;
    if (body.priceMonthly !== undefined) plan.priceMonthly = Number(body.priceMonthly);
    if (body.priceYearly !== undefined) plan.priceYearly = Number(body.priceYearly);
    if (body.maxPrinters !== undefined) plan.maxPrinters = Number(body.maxPrinters);
    if (body.commissionRate !== undefined) plan.commissionRate = Number(body.commissionRate);
    if (body.features !== undefined) plan.features = body.features;
    if (body.isPopular !== undefined) plan.isPopular = Boolean(body.isPopular);
    if (body.isActive !== undefined) plan.isActive = Boolean(body.isActive);
    plan.updatedAt = new Date();

    return NextResponse.json({
      success: true,
      message: 'Plan updated successfully',
      plan,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update plan' },
      { status: 500 }
    );
  }
}

// Admin only: delete subscription plan
export async function DELETE(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('id');

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID query parameter is required' }, { status: 400 });
    }

    const idx = memoryStore.plans.findIndex((p) => p._id === planId);
    if (idx === -1) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    memoryStore.plans.splice(idx, 1);

    return NextResponse.json({
      success: true,
      message: 'Subscription plan deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete plan' },
      { status: 500 }
    );
  }
}

