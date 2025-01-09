import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userRole: true }
    });

    return NextResponse.json({ userRole: user?.userRole });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 });
  }
}