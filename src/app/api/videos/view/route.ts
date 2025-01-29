import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { AccessMethod } from '@prisma/client';
import { unstable_cache } from 'next/cache';

// 구독 상태 체크를 위한 캐시 함수
const getActiveSubscription = unstable_cache(
  async (userId: string) => {
    return await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: 'active'
      }
    });
  },
  ['active-subscription'],
  {
    revalidate: 60 * 60 * 12,
    tags: ['subscription']
  }
);

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId, postId, sequence, timestamp } = await req.json();
    console.log('Request body:', { videoId, postId, sequence, timestamp });

    if (timestamp < 5) {
      return Response.json({ message: "Duration too short" });
    }

    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          videos: {
            select: {
              id: true,
              isPremium: true
            }
          }
        }
      });

      if (!post) {
        console.error('Post not found:', postId);
        return Response.json({ error: "Post not found" }, { status: 404 });
      }

      const video = post.videos.find(v => v.id === videoId);
      if (!video) {
        console.error('Video not found:', videoId);
        return Response.json({ error: "Video not found" }, { status: 404 });
      }

      // accessMethod 결정 (POINT_PAYMENT 제외)
      let currentAccessMethod: AccessMethod = AccessMethod.FREE;
      if (video.isPremium) {
        const activeSubscription = await getActiveSubscription(user.id);
        if (!activeSubscription) {
          // 구독이 없고 프리미엄 영상이면 처리하지 않음 (coinpay에서 처리)
          return Response.json({ message: "Premium content" });
        }
        currentAccessMethod = AccessMethod.SUBSCRIPTION;
      }

      await prisma.$transaction(async (tx) => {
        // 기존 시청 기록 확인 (FREE 또는 SUBSCRIPTION만)
        const existingView = await tx.videoView.findFirst({
          where: {
            userId: user.id,
            videoId: video.id,
            accessMethod: currentAccessMethod
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (existingView) {
          // 기존 기록이 있으면 viewCount만 업데이트
          await tx.videoView.update({
            where: { id: existingView.id },
            data: {
              viewCount: { increment: 1 }
            }
          });
        } else {
          // 새로운 시청이면 새 기록 생성
          await tx.videoView.create({
            data: {
              userId: user.id,
              videoId: video.id,
              accessMethod: currentAccessMethod,
              viewCount: 1
            }
          });
        }

        // UserVideoProgress 업데이트
        await tx.userVideoProgress.upsert({
          where: {
            userId_postId: {
              userId: user.id,
              postId
            }
          },
          create: {
            userId: user.id,
            postId,
            lastVideoSequence: sequence
          },
          update: {
            lastVideoSequence: sequence
          }
        });
      });

      console.log('Successfully processed view');
      return Response.json({ success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      console.error('Database error:', errorMessage);
      return Response.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Server error:', errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

// import { validateRequest } from '@/auth';
// import prisma from '@/lib/prisma';
// import { AccessMethod } from '@prisma/client';
// import { unstable_cache } from 'next/cache';

// // 구독 상태 체크를 위한 캐시 함수
// const getActiveSubscription = unstable_cache(
//   async (userId: string) => {
//     return await prisma.subscription.findFirst({
//       where: {
//         userId: userId,
//         status: 'active'
//       }
//     });
//   },
//   ['active-subscription'],  // 캐시 키
//   {
//     revalidate: 60 * 60 * 12,  // 12시간
//     tags: ['subscription']  // 무효화를 위한 태그
//   }
// );

// export async function POST(req: Request) {
//   try {
//     const { user } = await validateRequest();
//     if (!user) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { videoId, postId, sequence, timestamp } = await req.json();
//     console.log('Request body:', { videoId, postId, sequence, timestamp });

//     if (timestamp < 3) {
//       return Response.json({ message: "Duration too short" });
//     }

//     try {
//       const post = await prisma.post.findUnique({
//         where: { id: postId },
//         include: {
//           videos: {
//             select: {
//               id: true,
//               url: true,
//               isPremium: true
//             }
//           }
//         }
//       });

//       if (!post) {
//         console.error('Post not found:', postId);
//         return Response.json({ error: "Post not found" }, { status: 404 });
//       }

//       const video = post.videos.find(v => v.url.includes(videoId));
//       if (!video) {
//         console.error('Video not found:', videoId);
//         return Response.json({ error: "Video not found" }, { status: 404 });
//       }

//       // accessMethod 결정
//       let currentAccessMethod: AccessMethod = AccessMethod.FREE;
//       if (video.isPremium) {

//         // const activeSubscription = await prisma.subscription.findFirst({
//         //   where: {
//         //     userId: user.id,
//         //     status: 'active'
//         //   }
//         // });

//         // 캐시된 구독 상태 사용
//         const activeSubscription = await getActiveSubscription(user.id);

//         currentAccessMethod = activeSubscription 
//           ? AccessMethod.SUBSCRIPTION 
//           : AccessMethod.POINT_PAYMENT;
//       }

//       await prisma.$transaction(async (tx) => {
//         if (currentAccessMethod === AccessMethod.FREE) {
//           // 무료 시청의 경우 이전 무료 시청 기록이 있는지 확인
//           const existingFreeView = await tx.videoView.findFirst({
//             where: {
//               userId: user.id,
//               videoId: video.id,
//               accessMethod: AccessMethod.FREE
//             }
//           });

//           if (existingFreeView) {
//             // 기존 기록이 있으면 viewCount increment
//             await tx.videoView.update({
//               where: { id: existingFreeView.id },
//               data: {
//                 viewCount: { increment: 1 }
//               }
//             });
//           } else {
//             // 무료 시청 기록이 없을 때는 새로 생성
//             await tx.videoView.create({
//               data: {
//                 userId: user.id,
//                 videoId: video.id,
//                 accessMethod: AccessMethod.FREE,
//                 viewCount: 1
//               }
//             });
//           }
//         } else {
//           // 구독/코인 시청은 매 세션마다 새로운 기록 생성
//           await tx.videoView.create({
//             data: {
//               userId: user.id,
//               videoId: video.id,
//               accessMethod: currentAccessMethod
//             }
//           });
//         }

//         // UserVideoProgress 업데이트
//         await tx.userVideoProgress.upsert({
//           where: {
//             userId_postId: {
//               userId: user.id,
//               postId
//             }
//           },
//           create: {
//             userId: user.id,
//             postId,
//             lastVideoSequence: sequence
//           },
//           update: {
//             lastVideoSequence: sequence
//           }
//         });
//       });

//       console.log('Successfully processed view');
//       return Response.json({ success: true });
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
//       console.error('Database error:', errorMessage);
//       return Response.json({ error: errorMessage }, { status: 500 });
//     }
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
//     console.error('Server error:', errorMessage);
//     return Response.json({ error: errorMessage }, { status: 500 });
//   }
// }

