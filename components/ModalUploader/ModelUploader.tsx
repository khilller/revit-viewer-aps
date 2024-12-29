'use client';

import { useState } from 'react';
import { ModelInfo } from '@/types/app';

interface ModelUploaderProps {
  onModelUploaded: (model: ModelInfo) => void;
  disabled?: boolean;
}

export default function ModelUploader({ onModelUploaded, disabled }: ModelUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('model-file', file);

      if (file.name.endsWith('.zip')) {
        const entrypoint = window.prompt('Please enter the filename of the main design inside the archive.');
        if (entrypoint) {
          formData.append('model-zip-entrypoint', entrypoint);
        }
      }

      const response = await fetch('/api/models', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(await response.text());
      
      const model = await response.json();
      onModelUploaded(model);
    } catch (error) {
      console.error('Error uploading model:', error);
      alert('Failed to upload model. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        id="model-file"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        accept=".rvt,.rfa,.dwg,.nwd,.zip"
        disabled={disabled || isUploading}
      />
      <button
        className={`px-4 py-2 rounded-md bg-blue-500 text-white ${
          (disabled || isUploading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
        }`}
        onClick={() => document.getElementById('model-file')?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload Model'}
      </button>
    </div>
  );
}