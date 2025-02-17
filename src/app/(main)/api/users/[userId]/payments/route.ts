import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자가 아닌 경우 자신의 결제내역만 조회 가능
    if (user.userRole < 15 && user.id !== params.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
        where: { userId: params.userId },
        orderBy: { createdAt: 'desc' }
      });
      return Response.json(payments);
       
  } catch (error) {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}