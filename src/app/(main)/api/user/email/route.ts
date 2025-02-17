import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    return Response.json({ email: userData?.email || "" });
  } catch (error) {
    console.error("Failed to fetch user email:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}