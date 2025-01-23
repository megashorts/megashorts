"use server";

import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";

export async function deletePost(id: string) {
  const { user } = await validateRequest();
  if (!user) throw new Error("Unauthorized");

  console.log('Cloudflare config:', {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    hasToken: !!process.env.CLOUDFLARE_API_TOKEN
  });

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      videos: true
    }
  });

  if (!post) throw new Error("Post not found");
  if (post.userId !== user.id) throw new Error("Unauthorized");

  // 1. 썸네일 이미지 삭제
  if (post.thumbnailUrl) {
    try {
      // imagedelivery.net URL에서 이미지 ID 추출
      // URL 형식: https://imagedelivery.net/[account-hash]/[image-id]/[variant]
      const matches = post.thumbnailUrl.match(/imagedelivery\.net\/[^/]+\/([^/]+)/);
      const imageId = matches?.[1];
      
      console.log('Attempting to delete image:', { 
        imageId, 
        url: post.thumbnailUrl,
        matches: matches
      });
      
      if (imageId) {
        const imageResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
          {
            method: "DELETE",
            headers: {
              'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const imageData = await imageResponse.json().catch(() => null);
        console.log('Image deletion response:', {
          status: imageResponse.status,
          ok: imageResponse.ok,
          data: imageData
        });
      }
    } catch (error) {
      console.error('Image deletion error:', error);
    }
  }

// 2. 비디오와 자막 삭제
for (const video of post.videos) {
  try {
    // videodelivery.net URL에서 비디오 ID 추출
    // URL 형식: https://videodelivery.net/[video-id]/manifest/video.m3u8
    const matches = video.url.match(/videodelivery\.net\/([^/]+)/);
    const videoId = matches?.[1];
    
    console.log('Attempting to delete video:', { 
      videoId, 
      url: video.url,
      matches: matches
    });
    
    if (videoId) {
      const videoResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`,
        {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const videoData = await videoResponse.json().catch(() => null);
      console.log('Video deletion response:', {
        status: videoResponse.status,
        ok: videoResponse.ok,
        data: videoData
      });
    } else {
      console.error('Failed to extract video ID from URL:', video.url);
    }
  } catch (error) {
    console.error('Video deletion error:', error);
  }
}

  // 3. DB에서 포스트 삭제
  try {
    const deletedPost = await prisma.$transaction(async (tx) => {
      const deleted = await tx.post.delete({
        where: { id },
        include: getPostDataInclude(user.id),
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          postCount: {
            decrement: 1
          }
        }
      });

      return deleted;
    });

    return deletedPost;
  } catch (error) {
    console.error('Database deletion error:', error);
    throw error;
  }
}

function toBCP47(language: string): string {
  const languageMap: Record<string, string> = {
    'KOREAN': 'ko',
    'ENGLISH': 'en',
    'CHINESE': 'zh',
    'JAPANESE': 'ja',
    'THAI': 'th',
    'SPANISH': 'es',
    'INDONESIAN': 'id',
    'VIETNAMESE': 'vi'
  };
  return languageMap[language] || language.toLowerCase();
}