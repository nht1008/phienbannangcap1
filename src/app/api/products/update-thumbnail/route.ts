import { NextRequest, NextResponse } from 'next/server';
import { getAdminRealtimeDB } from '@/lib/firebase-admin';

export async function PATCH(request: NextRequest) {
  try {
    const { productId, thumbnailImage } = await request.json();
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const db = getAdminRealtimeDB();
    
    // Update the product with the new thumbnail in Firebase Realtime Database
    await db.ref(`inventory/${productId}`).update({
      thumbnailImage: thumbnailImage || null
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Product thumbnail updated successfully' 
    });

  } catch (error) {
    console.error('Error updating product thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to update product thumbnail' },
      { status: 500 }
    );
  }
}
