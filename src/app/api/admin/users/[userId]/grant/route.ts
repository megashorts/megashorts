import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

type GrantType = "POINTS" | "COINS";

function canManageTarget(actorRole: number, targetRole: number) {
  if (actorRole >= USER_ROLE.MASTER_ADMIN) return true;
  return actorRole > targetRole;
}

function parseGrantType(value: unknown): GrantType | null {
  if (value === "POINTS" || value === "COINS") return value;
  return null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < USER_ROLE.OPERATION1) {
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
    const grantType = parseGrantType(body.type);
    const rawAmount = Number(body.amount);
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!grantType) {
      return NextResponse.json(
        { success: false, error: "Invalid grant type" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
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

    const amount = grantType === "COINS" ? Math.floor(rawAmount) : rawAmount;
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be at least 1" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data:
        grantType === "COINS"
          ? {
              mscoin: {
                increment: amount,
              },
            }
          : {
              points: {
                increment: amount,
              },
            },
      select: {
        id: true,
        points: true,
        mscoin: true,
      },
    });

    revalidateTag(`user-auth-${userId}`);

    return NextResponse.json({
      success: true,
      message:
        grantType === "COINS"
          ? `${amount} coins granted`
          : `${amount} points granted`,
      reason,
      balances: {
        points: Number(updatedUser.points),
        coins: updatedUser.mscoin,
      },
    });
  } catch (error) {
    console.error("Error granting user balance:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
