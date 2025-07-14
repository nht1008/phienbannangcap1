import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Product } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { productId, description } = await req.json();

    if (!productId || typeof description !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const productRef = getAdminFirestore().collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await productRef.update({ description });

    const updatedProductDoc = await productRef.get();
    const updatedProduct = { id: updatedProductDoc.id, ...updatedProductDoc.data() } as Product;

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product description:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}