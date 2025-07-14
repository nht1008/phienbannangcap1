import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    };

    return NextResponse.json({
      success: true,
      config,
      message: 'Cloudinary configuration check',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check config' },
      { status: 500 }
    );
  }
}
