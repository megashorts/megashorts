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
    try {
      // 1. 업로드 URL 받아오기 (그대로 유지)
      const response = await fetch('/api/videos/upload', {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Failed to get upload URL');
      }

      const data = await response.json();
      const { uploadUrl, id, url } = data;
      if (!uploadUrl || !id || !url) {
        throw new Error('Invalid upload URL response');
      }

      // 2. XMLHttpRequest로 업로드 (진행률 지원)
      return new Promise<UploadVideoResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 진행률 처리
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded * 100) / event.total);
            onProgress?.(percentComplete);
            setProgress((prev: Record<string, number>) => ({
              ...prev,
              [file.name]: percentComplete
            }));
          }
        };

        // 완료 처리
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // 기존 응답 형식 유지
            resolve({
              id,  // cloudflareId
              url,
              filename: file.name
            });
            // 진행률 초기화 (타입 안전하게)
            setProgress((prev: Record<string, number>) => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        // 에러 처리
        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
        xhr.onabort = () => reject(new Error('Upload aborted'));

        // 업로드 실행
        const formData = new FormData();
        formData.append('file', file);
        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
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
    videoId: string,  // DB ID
    file: File,
    language: string
  ): Promise<UploadSubtitleResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('videoId', videoId);  // DB ID 그대로 전달
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

  const deleteSubtitle = async (
    videoId: string,
    language: string
  ): Promise<boolean> => {
    const response = await fetch('/api/videos/subtitle/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ videoId, language })
    });
  
    if (!response.ok) {
      throw new Error('Failed to delete subtitle');
    }
  
    const data = await response.json();
    return data.success;
  };

  return {
    progress,
    uploadVideo,
    uploadImage,
    uploadSubtitle,
    deleteSubtitle
  };
}


// import { useState } from 'react';
// import { Language } from '@prisma/client';

// interface UploadVideoResponse {
//   id: string;
//   url: string;
//   filename: string;
// }

// interface UploadSubtitleResponse {
//   success: boolean;
//   result: {
//     generated: boolean;
//     label: string;
//     language: string;
//     status: "ready" | "inprogress" | "error";
//   };
// }

// export function useUploader() {
//   const [progress, setProgress] = useState<Record<string, number>>({});

//   const uploadVideo = async (file: File, onProgress?: (progress: number) => void): Promise<UploadVideoResponse> => {
//     try {
//       // 1. 업로드 URL 받아오기
//       const response = await fetch('/api/videos/upload', {
//         method: 'POST'
//       });

//       if (!response.ok) {
//         const error = await response.json().catch(() => null);
//         throw new Error(error?.message || 'Failed to get upload URL');
//       }

//       const data = await response.json();
//       console.log('Upload URL response:', data);

//       const { uploadUrl, id, url } = data;
//       if (!uploadUrl || !id || !url) {
//         throw new Error('Invalid upload URL response');
//       }
  
//       // 2. Cloudflare로 직접 업로드
//       return new Promise((resolve, reject) => {
//         const xhr = new XMLHttpRequest();
        
//         xhr.upload.onprogress = (event) => {
//           if (event.lengthComputable) {
//             const percentComplete = Math.round((event.loaded * 100) / event.total);
//             onProgress?.(percentComplete);
//             setProgress(prev => ({
//               ...prev,
//               [file.name]: percentComplete
//             }));
//           }
//         };
    
//         xhr.onload = () => {
//           console.log('Upload response:', xhr.status, xhr.responseText);
//           if (xhr.status >= 200 && xhr.status < 300) {
//             resolve({
//               id,
//               url,
//               filename: file.name
//             });
//           } else {
//             reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
//           }
//         };
    
//         xhr.onerror = () => {
//           console.error('Upload network error:', xhr.status, xhr.responseText);
//           reject(new Error('Network error during upload'));
//         };
//         xhr.onabort = () => reject(new Error('Upload aborted'));
        
//         // FormData로 파일 전송
//         const formData = new FormData();
//         formData.append('file', file);
        
//         console.log('Uploading to URL:', uploadUrl);
//         xhr.open('POST', uploadUrl);
//         xhr.send(formData);
//       });
//     } catch (error) {
//       console.error('Upload error:', error);
//       throw error;
//     }
//   };

//   const uploadImage = async (file: File): Promise<string> => {
//     const formData = new FormData();
//     formData.append('file', file);

//     const response = await fetch('/api/images/upload', {
//       method: 'POST',
//       body: formData
//     });

//     if (!response.ok) {
//       throw new Error('Failed to upload image');
//     }

//     const data = await response.json();
//     return data.url;
//   };

//   const uploadSubtitle = async (
//     videoId: string,
//     file: File,
//     language: string
//   ): Promise<UploadSubtitleResponse> => {
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('videoId', videoId);
//     formData.append('language', language);

//     const response = await fetch('/api/videos/subtitle', {
//       method: 'POST',
//       body: formData
//     });

//     if (!response.ok) {
//       throw new Error('Failed to upload subtitle');
//     }

//     return response.json();
//   };

//   return {
//     progress,
//     uploadVideo,
//     uploadImage,
//     uploadSubtitle
//   };
// }
