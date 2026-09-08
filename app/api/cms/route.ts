import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore, defaultCmsConfig } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { CMS } from '@/models/CMS';

export async function GET(req: NextRequest) {
  try {
    const { isFallback } = await connectDB();
    const { searchParams } = new URL(req.url);
    const wantDraft = searchParams.get('draft') === 'true';

    let config: any = null;

    if (!isFallback) {
      try {
        const query = wantDraft ? {} : { status: 'PUBLISHED' };
        config = await CMS.findOne(query).sort({ updatedAt: -1 }).lean();
      } catch (err) {
        console.warn('DB query error on CMS, using fallback store:', err);
      }
    }

    if (!config) {
      config = memoryStore.cms || defaultCmsConfig;
    }

    return NextResponse.json({
      success: true,
      cms: config,
    });
  } catch (error: any) {
    console.error('Error fetching CMS config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch CMS configuration' },
      { status: 500 }
    );
  }
}

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

    const isPublish = body.action === 'PUBLISH';
    const updatedData = {
      ...body.cms,
      status: isPublish ? 'PUBLISHED' : 'DRAFT',
      publishedAt: isPublish ? new Date() : body.cms?.publishedAt || new Date(),
      updatedAt: new Date(),
    };

    let savedDoc: any = null;

    if (!isFallback) {
      try {
        let existing = await CMS.findOne({});
        if (existing) {
          Object.assign(existing, updatedData);
          savedDoc = await existing.save();
        } else {
          savedDoc = await CMS.create(updatedData);
        }
      } catch (err) {
        console.warn('Could not save CMS to MongoDB, saving to memoryStore:', err);
      }
    }

    memoryStore.cms = updatedData;

    return NextResponse.json({
      success: true,
      message: isPublish
        ? 'Website content published live successfully!'
        : 'Draft saved successfully.',
      cms: memoryStore.cms,
    });
  } catch (error: any) {
    console.error('Error saving CMS config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save CMS configuration' },
      { status: 500 }
    );
  }
}
