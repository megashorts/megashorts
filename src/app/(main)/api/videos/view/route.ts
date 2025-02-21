import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { AccessMethod } from '@prisma/client';

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

      // AccessMethod 타입 명시적 지정
      let accessMethod: AccessMethod = AccessMethod.FREE;
      let viewMessage = "FREE view save";

      if (video.isPremium) {
        const origin = new URL(req.url).origin;
        const response = await fetch(`${origin}/api/users/${user.id}/auth`, {
          headers: {
            cookie: req.headers.get('cookie') || ''
          }
        });

        if (!response.ok) {
          console.error('Auth check failed:', response.status);
          return Response.json({ error: "Auth check failed" }, { status: response.status });
        }

        const userData = await response.json();
        
        if (!userData.subscriptionEndDate || new Date(userData.subscriptionEndDate) < new Date()) {
          accessMethod = AccessMethod.COIN;
          viewMessage = "COIN view save";
        } else {
          accessMethod = AccessMethod.SUBSCRIPTION;
          viewMessage = "SUBSCRIPTION view save";
        }
      }

      await prisma.$transaction(async (tx) => {
        // 기존 시청 기록 확인
        const existingView = await tx.videoView.findFirst({
          where: {
            userId: user.id,
            videoId: video.id,
            accessMethod
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // 기록이 없을 때만 새로 생성
        if (!existingView) {
          await tx.videoView.create({
            data: {
              userId: user.id,
              videoId: video.id,
              accessMethod
            }
          });
        }

        console.log('Updating progress:', {
          userId: user.id,
          postId,
          sequence
        });

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

      return Response.json({ message: viewMessage });

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

// export async function POST(req: Request) {
//   try {
//     const { user } = await validateRequest();
//     if (!user) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { videoId, postId, sequence, timestamp } = await req.json();
//     console.log('Request body:', { videoId, postId, sequence, timestamp });

//     if (timestamp < 5) {
//       return Response.json({ message: "Duration too short" });
//     }

//     try {
//       const post = await prisma.post.findUnique({
//         where: { id: postId },
//         include: {
//           videos: {
//             select: {
//               id: true,
//               isPremium: true
//             }
//           }
//         }
//       });

//       if (!post) {
//         console.error('Post not found:', postId);
//         return Response.json({ error: "Post not found" }, { status: 404 });
//       }

//       const video = post.videos.find(v => v.id === videoId);
//       if (!video) {
//         console.error('Video not found:', videoId);
//         return Response.json({ error: "Video not found" }, { status: 404 });
//       }

//       // accessMethod 결정
//       let currentAccessMethod: AccessMethod = AccessMethod.FREE;
//       if (video.isPremium) {
//         // process.env.NEXT_PUBLIC_API_URL 또는 req.url의 origin을 사용해 절대 URL 구성
//         const origin = new URL(req.url).origin;
//         const response = await fetch(`${origin}/api/users/${user.id}/auth`, {
//           headers: {
//             // 현재 요청의 쿠키를 전달
//             cookie: req.headers.get('cookie') || ''
//           }
//         });

//         if (!response.ok) {
//           console.error('Auth check failed:', response.status);
//           return Response.json({ error: "Auth check failed" }, { status: response.status });
//         }

//         const userData = await response.json();
        
//         if (!userData.subscriptionEndDate || new Date(userData.subscriptionEndDate) < new Date()) {
//           return Response.json({ message: "COIN view save" });
//         }
//         currentAccessMethod = AccessMethod.SUBSCRIPTION;
//         return Response.json({ message: "SUBSCRIPTION view save" });
//       }

//       await prisma.$transaction(async (tx) => {
//         // 기존 시청 기록 확인
//         const existingView = await tx.videoView.findFirst({
//           where: {
//             userId: user.id,
//             videoId: video.id,
//             accessMethod: currentAccessMethod
//           },
//           orderBy: {
//             createdAt: 'desc'
//           }
//         });
      
//         // 기록이 없을 때만 새로 생성 (viewCount 제거)
//         if (!existingView) {
//           await tx.videoView.create({
//             data: {
//               userId: user.id,
//               videoId: video.id,
//               accessMethod: currentAccessMethod
//             }
//           });
//         }

//         // sequence 디버그 로그 추가
//         console.log('Updating progress with sequence:', {
//           userId: user.id,
//           postId,
//           sequence,
//           type: typeof sequence
//         });

//         const videoSequence = parseInt(sequence.toString(), 10);

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
//             lastVideoSequence: videoSequence
//           },
//           update: {
//             lastVideoSequence: videoSequence
//           }
//         });

//         // 업데이트 후 확인 로그
//         const updatedProgress = await tx.userVideoProgress.findUnique({
//           where: {
//             userId_postId: {
//               userId: user.id,
//               postId
//             }
//           }
//         });
//         console.log('Updated progress:', updatedProgress);

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
