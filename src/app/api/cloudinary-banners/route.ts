import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// In-memory storage for banners (temporary solution)
// In production, you would use a database
let banners: Array<{
  id: string;
  url: string;
  order: number;
  title?: string;
  description?: string;
}> = [
  {
    id: 'default-1',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop',
    order: 1,
    title: 'Chào mừng đến với cửa hàng',
    description: 'Khám phá bộ sưu tập sản phẩm chất lượng cao'
  },
  {
    id: 'default-2', 
    url: 'https://images.unsplash.com/photo-1599229021856-aafdd98224c23?q=80&w=2070&auto=format&fit=crop',
    order: 2,
    title: 'Sản phẩm chất lượng',
    description: 'Được tuyển chọn kỹ lưỡng từ các nhà cung cấp uy tín'
  }
];

export async function GET() {
  try {
    // Sort by order
    const sortedBanners = [...banners].sort((a, b) => a.order - b.order);
    return NextResponse.json({ banners: sortedBanners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || '';
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: `File size cannot exceed ${MAX_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Only image files are allowed' 
      }, { status: 400 });
    }

    // Convert file to base64 for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64Data}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'storefront-banners',
      transformation: [
        { width: 1920, height: 800, crop: 'fill', quality: 'auto', format: 'webp' }
      ],
      public_id: `banner-${Date.now()}`,
    });

    // Create new banner object
    const newBanner = {
      id: uploadResult.public_id,
      url: uploadResult.secure_url,
      order: banners.length + 1,
      title,
      description,
    };

    // Add to banners array
    banners.push(newBanner);

    console.log('[CLOUDINARY BANNERS] Successfully uploaded banner:', newBanner);

    return NextResponse.json({ 
      success: true, 
      banner: newBanner,
      message: 'Banner uploaded successfully' 
    });

  } catch (error) {
    console.error('[CLOUDINARY BANNERS] Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload banner',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bannerId = searchParams.get('id');

    if (!bannerId) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }

    // Find and remove banner
    const bannerIndex = banners.findIndex(banner => banner.id === bannerId);
    if (bannerIndex === -1) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const banner = banners[bannerIndex];

    // Delete from Cloudinary if it's not a default banner
    if (!banner.id.startsWith('default-')) {
      try {
        await cloudinary.uploader.destroy(banner.id);
        console.log('[CLOUDINARY BANNERS] Deleted from Cloudinary:', banner.id);
      } catch (cloudinaryError) {
        console.warn('[CLOUDINARY BANNERS] Failed to delete from Cloudinary:', cloudinaryError);
        // Continue anyway - remove from local array
      }
    }

    // Remove from banners array
    banners.splice(bannerIndex, 1);

    console.log('[CLOUDINARY BANNERS] Successfully deleted banner:', bannerId);

    return NextResponse.json({ 
      success: true, 
      message: 'Banner deleted successfully' 
    });

  } catch (error) {
    console.error('[CLOUDINARY BANNERS] Delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete banner',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update banner order
export async function PATCH(req: NextRequest) {
  try {
    const { bannerUpdates } = await req.json();
    
    if (!Array.isArray(bannerUpdates)) {
      return NextResponse.json({ error: 'Invalid banner updates format' }, { status: 400 });
    }

    // Update banner orders
    bannerUpdates.forEach(update => {
      const banner = banners.find(b => b.id === update.id);
      if (banner) {
        banner.order = update.order;
      }
    });

    // Sort by order
    banners.sort((a, b) => a.order - b.order);

    console.log('[CLOUDINARY BANNERS] Successfully updated banner order');

    return NextResponse.json({ 
      success: true, 
      banners: banners,
      message: 'Banner order updated successfully' 
    });

  } catch (error) {
    console.error('[CLOUDINARY BANNERS] Update order error:', error);
    return NextResponse.json({ 
      error: 'Failed to update banner order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
