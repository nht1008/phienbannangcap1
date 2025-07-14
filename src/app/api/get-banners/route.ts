import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const adminDb = getAdminFirestore();
    const storefrontConfigRef = adminDb.collection('config').doc('storefront');
    const doc = await storefrontConfigRef.get();

    if (!doc.exists) {
      return NextResponse.json({ banners: [] });
    }

    const data = doc.data();
    const banners = data?.banners || [];
    
    // Sort by order
    banners.sort((a: { order: number }, b: { order: number }) => a.order - b.order);

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}