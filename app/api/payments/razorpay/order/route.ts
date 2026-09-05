import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, orderId, currency = 'INR' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const keyId = process.env.PAYMENT_GATEWAY_KEY_ID || 'rzp_test_printporter_key';
    const razorpayOrderId = `order_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      success: true,
      order: {
        id: razorpayOrderId,
        entity: 'order',
        amount: Math.round(amount * 100), // in paise
        currency,
        receipt: `rcpt_${orderId || Date.now()}`,
        status: 'created',
      },
      keyId,
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
