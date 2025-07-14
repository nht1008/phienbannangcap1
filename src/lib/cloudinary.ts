import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper function to upload image to Cloudinary (client-side)
export async function uploadImageToCloudinary(
  imageFile: File,
  folder: string = 'fleur-manager'
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', 'unsigned_preset'); // You'll need to create this in Cloudinary
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
}

// Helper function to delete image from Cloudinary (server-side only)
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
}

// Helper function to extract public_id from Cloudinary URL
export function extractPublicIdFromUrl(url: string): string {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.ext
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return '';
    
    // Get everything after 'upload' and version (if present)
    let pathAfterUpload = urlParts.slice(uploadIndex + 1);
    
    // Remove version if present (starts with 'v' followed by numbers)
    if (pathAfterUpload[0] && /^v\d+$/.test(pathAfterUpload[0])) {
      pathAfterUpload = pathAfterUpload.slice(1);
    }
    
    // Join the path and remove file extension
    const fullPath = pathAfterUpload.join('/');
    const lastDotIndex = fullPath.lastIndexOf('.');
    
    return lastDotIndex > 0 ? fullPath.substring(0, lastDotIndex) : fullPath;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return '';
  }
}
