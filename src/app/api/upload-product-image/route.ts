import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const urls: string[] = [];
    const bucket = getAdminStorage().bucket();

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        // Skip this file or return an error for the whole batch
        console.warn(`Skipping file ${file.name} due to size > 5MB`);
        continue; // Or return a specific error response
      }

      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file ${file.name}`);
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileName = `product-images/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const fileUpload = bucket.file(fileName);

      await fileUpload.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      const [url] = await fileUpload.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // Far future expiration
      });
      urls.push(url);
    }

    if (urls.length === 0) {
        return NextResponse.json({ error: 'No valid images were uploaded.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Images uploaded successfully!', urls: urls });
  } catch (error: any) {
    console.error('[API /upload-product-image] UPLOAD ERROR:', JSON.stringify(error, null, 2));
    const code = error.code || 'UNKNOWN';
    const message = error.message || 'An unknown error occurred.';
    const fullErrorMessage = `Firebase Storage Error (Code: ${code}): ${message}`;
    console.error(`[API /upload-product-image] Parsed Error: ${fullErrorMessage}`);
    return NextResponse.json({ error: fullErrorMessage }, { status: 500 });
  }
}