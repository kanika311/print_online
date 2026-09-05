import fs from 'fs';
import path from 'path';

export interface StoredFile {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  estimatedPages: number;
}

export async function saveUploadedFile(
  file: File | Blob,
  originalName: string
): Promise<StoredFile> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileExt = path.extname(originalName) || '.pdf';
  const cleanBase = path.basename(originalName, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `${cleanBase}_${Date.now()}${fileExt}`;
  const filePath = path.join(uploadsDir, uniqueName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  fs.writeFileSync(filePath, buffer);

  // Estimate page count:
  // For images, 1 page.
  // For PDFs, scan for '/Type /Page' or default to 1.
  let estimatedPages = 1;
  const mimeType = file.type || 'application/pdf';

  if (mimeType === 'application/pdf' || fileExt.toLowerCase() === '.pdf') {
    try {
      const pdfText = buffer.toString('binary');
      const matches = pdfText.match(/\/Type\s*\/Page[^s]/g);
      if (matches && matches.length > 0) {
        estimatedPages = matches.length;
      } else {
        // Approximate based on size (rough average ~50KB per page for text/slides)
        estimatedPages = Math.max(1, Math.min(50, Math.ceil(buffer.length / (60 * 1024))));
      }
    } catch {
      estimatedPages = 1;
    }
  }

  return {
    fileUrl: `/uploads/${uniqueName}`,
    fileName: originalName,
    fileType: mimeType,
    fileSizeBytes: buffer.length,
    estimatedPages,
  };
}
