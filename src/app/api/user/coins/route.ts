// // 재생권한 확인시 코인수량 확인 전용 코인페이 라우터로 병합

// import { validateRequest } from '@/auth';
// import prisma from "@/lib/prisma";

// export async function GET() {
//   const { user } = await validateRequest();
//   if (!user) {
//     return Response.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const userData = await prisma.user.findUnique({
//     where: { id: user.id },
//     select: { mscoin: true },
//   });

//   return Response.json({
//     coins: userData?.mscoin ?? 0,
//     canPurchase: (userData?.mscoin ?? 0) >= 2,
//   });
// }