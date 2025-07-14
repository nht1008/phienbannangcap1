"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function TestCloudinaryPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'test');

      console.log('Sending request to /api/cloudinary-upload');
      const response = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      testUpload(file);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Cloudinary Upload</h1>
      
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        {isUploading && (
          <div className="text-blue-600">Uploading...</div>
        )}
        
        {result && (
          <div className="space-y-2">
            <div className="text-green-600 font-semibold">Upload Success!</div>
            <div className="text-sm">
              <div><strong>URL:</strong> {result.url}</div>
              <div><strong>Public ID:</strong> {result.publicId}</div>
            </div>
            <img src={result.url} alt="Uploaded" className="w-32 h-32 object-cover rounded" />
          </div>
        )}
      </div>
      
      <div className="mt-8 text-xs">
        <div><strong>Cloud Name:</strong> {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}</div>
      </div>
    </div>
  );
}
