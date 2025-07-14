import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase-admin';
import { Banner } from '@/types';

export async function DELETE(req: NextRequest) {
  let bannerId: string;

  try {
    const body = await req.json();
    bannerId = body.id;

    if (!bannerId) {
      return NextResponse.json({ error: 'Invalid banner id' }, { status: 400 });
    }

    const storefrontConfigRef = getAdminFirestore().collection('config').doc('storefront');
    
    const doc = await storefrontConfigRef.get();
    if (!doc.exists) {
        return NextResponse.json({ error: 'Storefront config not found' }, { status: 404 });
    }

    const banners = doc.data()?.banners as Banner[] || [];
    const bannerToDelete = banners.find(b => b.id === bannerId);

    if (bannerToDelete) {
        // Attempt to delete from storage first
        try {
            const bucket = getAdminStorage().bucket();
            // The ID is assumed to be the full path in storage
            const file = bucket.file(bannerId); 
            await file.delete();
            console.log(`Successfully deleted banner from storage: ${bannerId}`);
        } catch (storageError: any) {
            // If the file doesn't exist, we can ignore the error and proceed to delete from DB.
            if (storageError.code === 404 || storageError.message.includes('No such object')) {
                console.warn(`Banner file not found in storage, but proceeding to delete from database: ${bannerId}`);
            } else {
                // For other storage errors, we might want to stop.
                throw storageError;
            }
        }

        // Always delete from firestore array if the banner record exists
        const updatedBanners = banners.filter(b => b.id !== bannerId);
        await storefrontConfigRef.set({ banners: updatedBanners }, { merge: true });
    } else {
        // If banner record doesn't exist in DB, there's nothing to do.
        return NextResponse.json({ success: true, warning: 'Banner not found in database.' });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner', details: error.message }, { status: 500 });
  }
}