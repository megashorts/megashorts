import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

export async function PATCH() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 타임아웃 설정 추가
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    );

    // Promise.race로 타임아웃 처리
    await Promise.race([
      prisma.notification.updateMany({
        where: {
          recipientId: user.id,
          read: false,
        },
        data: {
          read: true,
        },
      }),
      timeoutPromise
    ]);

    return new Response(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error: unknown) {  // error 타입을 명시적으로 unknown으로 지정
    console.error(error);
    
    // error가 Error 인스턴스인지 확인
    if (error instanceof Error) {
      // 타임아웃 에러 구분
      if (error.message === 'Database timeout') {
        return Response.json(
          { error: "Request timed out" },
          { status: 504 }  // Gateway Timeout
        );
      }

      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 기타 알 수 없는 에러
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


// import { validateRequest } from '@/auth';
// import prisma from "@/lib/prisma";

// export async function PATCH() {
//   try {
//     const { user } = await validateRequest();

//     if (!user) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     await prisma.notification.updateMany({
//       where: {
//         recipientId: user.id,
//         read: false,
//       },
//       data: {
//         read: true,
//       },
//     });

//     return new Response();
//   } catch (error) {
//     console.error(error);
//     return Response.json({ error: "Internal server error" }, { status: 500 });
//   }
// }






// import { NextRequest } from "next/server";
// import { validateRequest } from '@/auth';
// import prisma from "@/lib/prisma";

// export async function PATCH(req: NextRequest) {
//   const { user } = await validateRequest();
//   if (!user) {
//     return Response.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     // 알림 읽음 처리
//     await prisma.notification.updateMany({
//       where: {
//         recipientId: user.id,
//         read: false,
//       },
//       data: {
//         read: true,
//       },
//     });

//     return Response.json({ success: true });
//   } catch (error) {
//     console.error("Error marking notifications as read:", error);
//     return Response.json(
//       { error: "Failed to mark notifications as read" },
//       { status: 500 }
//     );
//   }
// }