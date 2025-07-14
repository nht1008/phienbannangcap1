import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Optional: Add file size and type checks here
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `File size cannot exceed ${MAX_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const bucket = getAdminStorage().bucket();
    // Replace spaces in filename with underscores for cleaner URLs
    const fileName = `images/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Generate a long-lived signed URL for the uploaded file
    const [url] = await fileUpload.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // A date far in the future
    });

    return NextResponse.json({ message: 'Image uploaded successfully!', url: url });
  } catch (error: any) {
    console.error('[API /upload-image] UPLOAD ERROR:', JSON.stringify(error, null, 2));
    const code = error.code || 'UNKNOWN';
    const message = error.message || 'An unknown error occurred.';
    const fullErrorMessage = `Firebase Storage Error (Code: ${code}): ${message}`;
    console.error(`[API /upload-image] Parsed Error: ${fullErrorMessage}`);
    return NextResponse.json({ error: fullErrorMessage }, { status: 500 });
  }
}