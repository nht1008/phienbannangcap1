import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

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
    const fileName = `storefront-banners/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
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

    // Save the URL to Firestore
    const storefrontConfigRef = getAdminFirestore().collection('config').doc('storefront');
    
    const doc = await storefrontConfigRef.get();
    const banners = doc.exists && doc.data()?.banners ? doc.data()?.banners : [];

    const newBanner = {
      id: fileName, // Use filename as a unique ID
      url,
      order: banners.length, // Add to the end
    };

    banners.push(newBanner);

    await storefrontConfigRef.set({ banners }, { merge: true });

    return NextResponse.json(newBanner);
  } catch (error: any) {
    console.error('[API /upload-banners] UPLOAD ERROR:', JSON.stringify(error, null, 2));
    const code = error.code || 'UNKNOWN';
    const message = error.message || 'An unknown error occurred.';
    const fullErrorMessage = `Firebase Storage Error (Code: ${code}): ${message}`;
    console.error(`[API /upload-banners] Parsed Error: ${fullErrorMessage}`);
    return NextResponse.json({ error: fullErrorMessage }, { status: 500 });
  }
}