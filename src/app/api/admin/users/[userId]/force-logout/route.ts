import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function canManageTarget(actorRole: number, targetRole: number) {
  if (actorRole >= USER_ROLE.MASTER_ADMIN) return true;
  return actorRole > targetRole;
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < USER_ROLE.OPERATION3) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { userId } = await context.params;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { userRole: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (!canManageTarget(user.userRole, targetUser.userRole)) {
      return NextResponse.json(
        { success: false, error: "Forbidden target user" },
        { status: 403 },
      );
    }

    const deleted = await prisma.session.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: "Active sessions were invalidated.",
      deletedSessions: deleted.count,
    });
  } catch (error) {
    console.error("Error forcing user logout:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
