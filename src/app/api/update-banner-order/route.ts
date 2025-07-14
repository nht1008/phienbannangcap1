import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Banner } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { banners } = (await req.json()) as { banners: Banner[] };

    if (!banners || !Array.isArray(banners)) {
      return NextResponse.json({ error: 'Invalid banners data' }, { status: 400 });
    }

    const storefrontConfigRef = getAdminFirestore().collection('config').doc('storefront');

    await storefrontConfigRef.set({ banners }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating banner order:', error);
    return NextResponse.json({ error: 'Failed to update banner order' }, { status: 500 });
  }
}