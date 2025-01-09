// import { NextRequest, NextResponse } from 'next/server';
// import { validateRequest } from '@/auth';
// import prisma from '@/lib/prisma';
// import { BookmarkInfo } from '@/lib/types';
// import { NotificationType } from '@prisma/client';  // 추가

// export async function POST(request: NextRequest) {
//   try {
//     const postId = request.nextUrl.pathname.split('/')[3];
//     const { user: loggedInUser } = await validateRequest();

//     if (!loggedInUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const post = await prisma.post.findUnique({
//       where: { id: postId },
//       select: {
//         userId: true,
//       },
//     });

//     if (!post) {
//       return NextResponse.json({ error: "Post not found" }, { status: 404 });
//     }

//     await prisma.$transaction([
//       prisma.bookmark.upsert({
//         where: {
//           userId_postId: {
//             userId: loggedInUser.id,
//             postId,
//           },
//         },
//         create: {
//           userId: loggedInUser.id,
//           postId,
//         },
//         update: {},
//       }),
//       ...(loggedInUser.id !== post.userId
//         ? [
//             prisma.notification.create({
//               data: {
//                 issuerId: loggedInUser.id,
//                 recipientId: post.userId,
//                 postId,
//                 type: NotificationType.BOOKMARK,  // enum 사용
//               },
//             }),
//           ]
//         : []),
//     ]);

//     return new NextResponse(null, { status: 200 });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// export async function DELETE(request: NextRequest) {
//   try {
//     const postId = request.nextUrl.pathname.split('/')[3];
//     const { user: loggedInUser } = await validateRequest();

//     if (!loggedInUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const post = await prisma.post.findUnique({
//       where: { id: postId },
//       select: {
//         userId: true,
//       },
//     });

//     if (!post) {
//       return NextResponse.json({ error: "Post not found" }, { status: 404 });
//     }

//     await prisma.$transaction([
//       prisma.bookmark.deleteMany({
//         where: {
//           userId: loggedInUser.id,
//           postId,
//         },
//       }),
//       prisma.notification.deleteMany({
//         where: {
//           issuerId: loggedInUser.id,
//           recipientId: post.userId,
//           postId,
//           type: NotificationType.BOOKMARK,  // enum 사용
//         },
//       }),
//     ]);

//     return new NextResponse(null, { status: 200 });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { BookmarkInfo } from '@/lib/types';

// GET 요청 핸들러 수정
export async function GET(request: NextRequest) {
  try {
    const postId = request.nextUrl.pathname.split('/')[3]; // URL에서 postId 추출
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: loggedInUser.id,
          postId,
        },
      },
    });

    const data: BookmarkInfo = {
      isBookmarkedByUser: !!bookmark,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST 요청 핸들러 수정
export async function POST(request: NextRequest) {
  try {
    const postId = request.nextUrl.pathname.split('/')[3]; // URL에서 postId 추출
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.bookmark.upsert({
      where: {
        userId_postId: {
          userId: loggedInUser.id,
          postId,
        },
      },
      create: {
        userId: loggedInUser.id,
        postId,
      },
      update: {},
    });

    if (loggedInUser.id !== post.userId) {
      await prisma.notification.create({
        data: {
          issuerId: loggedInUser.id,
          recipientId: post.userId,
          postId,
          type: "BOOKMARK",
        },
      });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE 요청 핸들러 수정
export async function DELETE(request: NextRequest) {
  try {
    const postId = request.nextUrl.pathname.split('/')[3]; // URL에서 postId 추출
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.bookmark.deleteMany({
      where: {
        userId: loggedInUser.id,
        postId,
      },
    });
      // 관련 알림 삭제
      await prisma.notification.deleteMany({
        where: {
          issuerId: loggedInUser.id,
          recipientId: post.userId,
          postId,
          type: "BOOKMARK",
        },
      });

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
