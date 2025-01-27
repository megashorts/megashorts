"use server";

import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";
import { getPostDataInclude } from '@/lib/types';

import { PostFormData, postSchema } from "@/lib/validation";
import { CategoryType, Language, PostStatus } from "@prisma/client";

interface VideoData {
  url: string;
  filename: string;
  sequence: number;
}

export async function submitPost(input: PostFormData) {
  const { user } = await validateRequest();
  if (!user) throw new Error("Unauthorized");

  const validatedData = postSchema.parse(input);

  const newPost = await prisma.$transaction(async (tx) => {
    // 기존 포스트 조회 (수정인 경우)
    const existingPost = input.id ? await tx.post.findUnique({
      where: { id: input.id },
      include: {
        videos: true  // 기존 비디오 정보 포함
      }
    }) : null;

    const lastPost = await tx.post.findFirst({
      orderBy: { postNum: 'desc' }
    });

    const nextPostNum = existingPost?.postNum || (lastPost?.postNum || 0) + 1;

    // 포스트 생성 또는 업데이트
    const post = existingPost ? 
      await tx.post.update({
        where: { id: existingPost.id },
        data: {
          title: validatedData.title,
          titleOriginal: validatedData.titleOriginal,
          content: validatedData.content,
          thumbnailId: validatedData.thumbnailId || null,
          status: validatedData.status,
          categories: validatedData.categories,
          ageLimit: validatedData.ageLimit,
          featured: validatedData.featured,
          priority: validatedData.priority,
          videoCount: input.videos?.length || 0,
          publishedAt: validatedData.status === 'PUBLISHED' 
          ? existingPost.publishedAt || new Date()  // 기존 publishedAt이 없으면 현재 시간
          : null  // DRAFT 상태면 null
        },
        include: getPostDataInclude(user.id),
      }) :
      await tx.post.create({
        data: {
          postNum: nextPostNum,
          title: validatedData.title,
          titleOriginal: validatedData.titleOriginal,
          content: validatedData.content,
          thumbnailId: validatedData.thumbnailId || null,
          userId: user.id,
          status: validatedData.status,
          categories: validatedData.categories,
          ageLimit: validatedData.ageLimit,
          featured: validatedData.featured,
          priority: validatedData.priority,
          videoCount: input.videos?.length || 0,
          publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null  // PUBLISHED면 현재 시간, DRAFT면 null
        },
        include: getPostDataInclude(user.id),
      });

    if (input.videos && input.videos.length > 0) {
      // 수정인 경우 삭제된 자막 처리
      if (existingPost) {
        for (const existingVideo of existingPost.videos) {
          const updatedVideo = input.videos.find(v => v.id === existingVideo.id);
          if (updatedVideo) {
            // 삭제된 자막 찾기
            const removedSubtitles = existingVideo.subtitle.filter(
              lang => !updatedVideo.subtitle.includes(lang)
            );

            // 삭제된 자막이 있으면 Cloudflare에서 삭제
            for (const lang of removedSubtitles) {
              const bcp47Language = toBCP47(lang);
              try {
                await fetch(
                  `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/${existingVideo.id}/captions/${bcp47Language}`,
                  {
                    method: "DELETE",
                    headers: {
                      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
              } catch (error) {
                console.error(`Failed to delete subtitle ${lang} from Cloudflare:`, error);
              }
            }
          }
        }
      }

      if (input.videos && input.videos.length > 0) {
        // 1. 기존 비디오 모두 삭제
        if (existingPost) {
          await tx.video.deleteMany({
            where: { postId: post.id }
          });
        }
      
        // 2. 새로운 순서로 비디오 다시 생성
        for (const video of input.videos) {
          await tx.video.create({
            data: {
              id: video.id,
              postId: post.id,
              url: video.url,
              filename: video.filename,
              sequence: video.sequence,
              isPremium: video.isPremium,
              subtitle: video.subtitle || [],
            }
          });
        }
      }

    }

    // 새 포스트인 경우에만 postCount 증가
    if (!existingPost) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          postCount: { increment: 1 }
        }
      });
    }

    return post;
  });

  return newPost;
}

// BCP47 언어 코드 변환 함수
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
