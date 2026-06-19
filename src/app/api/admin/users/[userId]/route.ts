import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const MANAGEABLE_SUBSCRIPTION_TYPES = ["free", "basic", "premium"] as const;
type ManageableSubscriptionType = (typeof MANAGEABLE_SUBSCRIPTION_TYPES)[number];

function hasManagementAccess(userRole: number) {
  return userRole >= USER_ROLE.OPERATION1;
}

function hasHighLevelAccess(userRole: number) {
  return userRole >= USER_ROLE.OPERATION3;
}

function canManageTarget(actorRole: number, targetRole: number) {
  if (actorRole >= USER_ROLE.MASTER_ADMIN) return true;
  return actorRole > targetRole;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { user } = await validateRequest();
    if (!user || !hasManagementAccess(user.userRole)) {
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
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        userRole: true,
        points: true,
        mscoin: true,
        emailVerified: true,
        adultauth: true,
        loginAttempts: true,
        blockedUntil: true,
        createdAt: true,
        referredBy: true,
        googleId: true,
        kakaoId: true,
        naverId: true,
        passwordHash: true,
        subscription: {
          select: {
            status: true,
            type: true,
            currentPeriodEnd: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        referrer: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const activeSessionCount = await prisma.session.count({
      where: { userId },
    });

    const canManageActions = canManageTarget(user.userRole, targetUser.userRole);

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        username: targetUser.username,
        displayName: targetUser.displayName,
        userRole: targetUser.userRole,
        points: Number(targetUser.points),
        coins: targetUser.mscoin,
        emailVerified: targetUser.emailVerified,
        adultauth: targetUser.adultauth,
        loginAttempts: targetUser.loginAttempts,
        blockedUntil: targetUser.blockedUntil,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.subscription?.updatedAt ?? targetUser.createdAt,
        referredBy: targetUser.referredBy,
        referrer: targetUser.referrer,
        subscription: targetUser.subscription,
        activeSessionCount,
        canManageActions,
        canChangePassword:
          hasHighLevelAccess(user.userRole) &&
          canManageActions,
        hasSocialLogin:
          Boolean(targetUser.googleId) ||
          Boolean(targetUser.kakaoId) ||
          Boolean(targetUser.naverId),
        hasPassword: Boolean(targetUser.passwordHash),
      },
    });
  } catch (error) {
    console.error("Error loading admin user detail:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { user } = await validateRequest();
    if (!user || !hasManagementAccess(user.userRole)) {
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
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : undefined;
    const nextRole =
      typeof body.userRole === "number" ? Math.floor(body.userRole) : undefined;
    const emailVerified =
      typeof body.emailVerified === "boolean" ? body.emailVerified : undefined;
    const subscriptionType =
      typeof body.subscriptionType === "string"
        ? body.subscriptionType.toLowerCase()
        : undefined;

    if (
      displayName === undefined &&
      nextRole === undefined &&
      emailVerified === undefined &&
      subscriptionType === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "No editable fields provided" },
        { status: 400 },
      );
    }

    if (displayName !== undefined && displayName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Display name must be at least 2 characters" },
        { status: 400 },
      );
    }

    if (
      subscriptionType !== undefined &&
      !MANAGEABLE_SUBSCRIPTION_TYPES.includes(
        subscriptionType as ManageableSubscriptionType,
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription type" },
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

    if (nextRole !== undefined) {
      if (!hasHighLevelAccess(user.userRole)) {
        return NextResponse.json(
          { success: false, error: "Role update requires OPERATION3+" },
          { status: 403 },
        );
      }

      if (nextRole < USER_ROLE.USER || nextRole > USER_ROLE.MASTER_ADMIN) {
        return NextResponse.json(
          { success: false, error: "Invalid userRole value" },
          { status: 400 },
        );
      }

      if (user.userRole < USER_ROLE.MASTER_ADMIN && nextRole >= user.userRole) {
        return NextResponse.json(
          { success: false, error: "Cannot assign role equal/higher than your own" },
          { status: 403 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(displayName !== undefined ? { displayName } : {}),
          ...(nextRole !== undefined ? { userRole: nextRole } : {}),
          ...(emailVerified !== undefined ? { emailVerified } : {}),
        },
      });

      if (subscriptionType !== undefined) {
        const now = new Date();
        const nextPeriodEnd = new Date(
          now.getTime() + 1000 * 60 * 60 * 24 * 30,
        );
        const isFree = subscriptionType === "free";

        await tx.subscription.upsert({
          where: { userId },
          create: {
            userId,
            type: subscriptionType,
            status: isFree ? "inactive" : "active",
            currentPeriodStart: now,
            currentPeriodEnd: nextPeriodEnd,
          },
          update: {
            type: subscriptionType,
            status: isFree ? "inactive" : "active",
            ...(isFree
              ? {}
              : {
                  currentPeriodEnd:
                    nextPeriodEnd,
                }),
          },
        });
      }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        userRole: true,
        emailVerified: true,
        points: true,
        mscoin: true,
        subscription: {
          select: {
            status: true,
            type: true,
            currentPeriodEnd: true,
            updatedAt: true,
          },
        },
      },
    });

    revalidateTag(`user-auth-${userId}`);

    return NextResponse.json({
      success: true,
      user: updatedUser
        ? {
            ...updatedUser,
            points: Number(updatedUser.points),
            coins: updatedUser.mscoin,
            updatedAt: updatedUser.subscription?.updatedAt ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error("Error updating admin user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
