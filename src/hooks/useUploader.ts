import { useState } from 'react';
import { Language } from '@prisma/client';

interface UploadVideoResponse {
  id: string;
  url: string;
  filename: string;
}

interface UploadSubtitleResponse {
  success: boolean;
  result: {
    generated: boolean;
    label: string;
    language: string;
    status: "ready" | "inprogress" | "error";
  };
}

export function useUploader() {
  const [progress, setProgress] = useState<Record<string, number>>({});

  const uploadVideo = async (file: File, onProgress?: (progress: number) => void): Promise<UploadVideoResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded * 100) / event.total);
          onProgress?.(percentComplete);
          setProgress(prev => ({
            ...prev,
            [file.name]: percentComplete
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid response'));
          }
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      
      xhr.open('POST', '/api/videos/upload');
      xhr.send(formData);
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const uploadSubtitle = async (
    videoId: string,
    file: File,
    language: string
  ): Promise<UploadSubtitleResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('videoId', videoId);
    formData.append('language', language);

    const response = await fetch('/api/videos/subtitle', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload subtitle');
    }

    return response.json();
  };

  return {
    progress,
    uploadVideo,
    uploadImage,
    uploadSubtitle
  };
}