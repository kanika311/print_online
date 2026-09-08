import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore, defaultCmsConfig } from '@/lib/db';
import { CMS } from '@/models/CMS';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { isFallback } = await connectDB();
    const slug = params.slug.toLowerCase();

    let config: any = null;
    if (!isFallback) {
      try {
        config = await CMS.findOne({ status: 'PUBLISHED' }).sort({ updatedAt: -1 }).lean();
      } catch (err) {
        console.warn('DB query error on CMS slug, fallback:', err);
      }
    }

    if (!config) {
      config = memoryStore.cms || defaultCmsConfig;
    }

    const legal = config.legal || defaultCmsConfig.legal;

    let content = '';
    let title = '';

    if (slug === 'terms' || slug === 'terms-and-conditions') {
      title = 'Terms and Conditions';
      content = legal.termsAndConditions;
    } else if (slug === 'privacy' || slug === 'privacy-policy') {
      title = 'Privacy Policy';
      content = legal.privacyPolicy;
    } else if (slug === 'refund' || slug === 'refund-policy') {
      title = 'Refund & Cancellation Policy';
      content = legal.refundPolicy;
    } else {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      slug,
      title,
      content,
      updatedAt: config.updatedAt || new Date(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
