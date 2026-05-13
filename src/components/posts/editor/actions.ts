// src/components/posts/editor/actions.ts DB 쓰기/읽기, 인증, 외부 API 호출 등 권한이 필요한 무거운 로직을 서버에서만 수행

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

  // Cloudflare 메타데이터 업데이트를 트랜잭션 밖으로 분리
  if (input.videos?.length > 0) {
    await Promise.all(
      input.videos.map(video =>
        fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/${video.id}`,
          {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              meta: {
                name: video.filename,
                title: validatedData.title,
                sequence: String(video.sequence),
                isPremium: String(video.isPremium)
              },
              scheduledDeletion: null
            })
          }
        ).catch(error => {
          console.error('Failed to update video metadata:', error);
        })
      )
    );
  }

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
          publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null
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

        // 기존 비디오와 새 비디오 비교
        const existingIds = new Set(existingPost.videos.map(v => v.id));
        const newIds = new Set(input.videos.map(v => v.id));


        // 1. 삭제된 비디오 먼저 처리
        const deletedIds = [...existingIds].filter(id => !newIds.has(id));
        if (deletedIds.length > 0) {
          await tx.video.deleteMany({
            where: {
              id: { in: deletedIds }
            }
          });
        }

        // 2. sequence 또는 isPremium 변경된 비디오 처리
        const existingVideos = existingPost.videos;
        const updatedVideos = input.videos.filter(v => {
          const existingVideo = existingVideos.find(ev => ev.id === v.id);
          return existingVideo && (
            existingVideo.sequence !== v.sequence || 
            existingVideo.isPremium !== v.isPremium
          );
        });

        // 순서대로 처리
        for (const video of updatedVideos) {
          await tx.video.update({
            where: { id: video.id },
            data: { 
              sequence: -video.sequence,  // 임시값
              isPremium: video.isPremium  // isPremium 값 업데이트
            }
          });
        }
        for (const video of updatedVideos) {
          await tx.video.update({
            where: { id: video.id },
            data: { sequence: video.sequence }  // 최종값
          });
        }

        // 3. 새로 추가된 비디오 처리
        const newVideos = input.videos.filter(v => !existingIds.has(v.id));
        for (const video of newVideos) {
          await tx.video.create({
            data: {
              id: video.id,
              postId: post.id,
              filename: video.filename,
              sequence: video.sequence,
              isPremium: video.isPremium,
              subtitle: video.subtitle || [],
            }
          });
        }
      } else {
        // 새 포스트인 경우는 그대로 유지
        for (const video of input.videos) {
          await tx.video.create({
            data: {
              id: video.id,
              postId: post.id,
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
    // if (!existingPost) {
    //   await tx.user.update({
    //     where: { id: user.id },
    //     data: {
    //       postCount: { increment: 1 }
    //     }
    //   });
    // }

    // // 통계 때문에 추가
    // 개별 포스트의 유료 비디오 수 계산
    // const videoCount = input.videos?.length || 0;
    // const videoPaid = input.videos?.filter(v => v.isPremium).length || 0;

    // // post 테이블 업데이트 (videoCount, videoPaid)
    // await tx.post.update({
    //   where: { id: post.id },
    //   data: {
    //     videoCount,
    //     videoPaid
    //   }
    // });

    // // user 테이블 업데이트
    // await tx.user.update({
    //   where: { id: user.id },
    //   data: {
    //     videoCountSum: {
    //       // 이 사용자의 전체 포스트들의 비디오 수 합계를 다시 계산
    //       set: (await tx.post.aggregate({
    //         _sum: { videoCount: true },
    //         where: { userId: user.id }
    //       }))._sum.videoCount || 0
    //     },
    //     videoPaidSum: {
    //       // 이 사용자의 전체 포스트들의 유료 비디오 수 합계를 다시 계산
    //       set: (await tx.post.aggregate({
    //         _sum: { videoPaid: true },
    //         where: { userId: user.id }
    //       }))._sum.videoPaid || 0
    //     }
    //   }
    // });

    // 해당 유저의 전체 포스트를 조회
    const allPosts = await tx.post.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        videoCount: true,
        videoPaid: true,
      }
    });

    // 전체 합계 계산
    const accuratePostCount = allPosts.length;
    const accurateVideoCountSum = allPosts.reduce((acc, p) => acc + (p.videoCount || 0), 0);
    const accurateVideoPaidSum = allPosts.reduce((acc, p) => acc + (p.videoPaid || 0), 0);

    // user 테이블 통계 필드 업데이트
    await tx.user.update({
      where: { id: user.id },
      data: {
        postCount: accuratePostCount,
        videoCountSum: accurateVideoCountSum,
        videoPaidSum: accurateVideoPaidSum,
      },
    });


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