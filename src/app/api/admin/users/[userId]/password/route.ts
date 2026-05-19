import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { hash } from "@node-rs/argon2";
import { NextRequest, NextResponse } from "next/server";

function canManageTarget(actorRole: number, targetRole: number) {
  if (actorRole >= USER_ROLE.MASTER_ADMIN) return true;
  return actorRole > targetRole;
}

export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json(
        { success: false, error: "Password must be 8-128 characters" },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userRole: true,
      },
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

    const passwordHash = await hash(newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      outputLen: 32,
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      prisma.session.deleteMany({
        where: { userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password updated and sessions invalidated",
    });
  } catch (error) {
    console.error("Error changing user password by admin:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
