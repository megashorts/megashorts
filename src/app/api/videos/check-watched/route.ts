// // 코인으로 시청한 기록 확인

// import { validateRequest } from '@/auth';
// import prisma from '@/lib/prisma';


// export async function GET(req: Request) {
//   try {
//     const { user } = await validateRequest();
//     if (!user) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const videoId = searchParams.get('videoId');
    
//     if (!videoId) {
//       return Response.json({ error: "Video ID required" }, { status: 400 });
//     }

//     // 코인으로 시청한 기록 확인 (findFirst 사용)
//     const view = await prisma.videoView.findFirst({
//       where: {
//         userId: user.id,
//         videoId: videoId,
//         accessMethod: 'POINT_PAYMENT'
//       }
//     });

//     return Response.json({ hasWatched: !!view });
//   } catch (error) {
//     console.error('Check watched error:', error);
//     return Response.json({ error: "Internal error" }, { status: 500 });
//   }
// }