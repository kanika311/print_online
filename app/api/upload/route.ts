import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/services/storageService';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    const fileName = file.name || 'uploaded_document';
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileName);

    if (!allowedMimes.includes(file.type) && !isPdf && !isImage) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload PDF, JPG, JPEG, or PNG.' },
        { status: 400 }
      );
    }

    // Limit to 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    const stored = await saveUploadedFile(file, fileName);

    return NextResponse.json({
      success: true,
      message: 'File uploaded and analyzed successfully',
      file: stored,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
