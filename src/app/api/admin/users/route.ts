import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < USER_ROLE.OPERATION1) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const rolesParam = searchParams.get("roles")?.trim() ?? "";
    const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
    const limit = Math.min(
      parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
      MAX_LIMIT,
    );

    const roleFilters = rolesParam
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value));

    const where: Prisma.UserWhereInput = {};

    if (query.length > 0) {
      where.OR = [
        { email: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ];
    }

    if (roleFilters.length > 0) {
      where.userRole = { in: roleFilters };
    }

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          userRole: true,
          points: true,
          mscoin: true,
          emailVerified: true,
          createdAt: true,
          subscription: {
            select: {
              status: true,
              type: true,
              currentPeriodEnd: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      users: users.map((targetUser) => ({
        id: targetUser.id,
        email: targetUser.email,
        username: targetUser.username,
        displayName: targetUser.displayName,
        userRole: targetUser.userRole,
        points: Number(targetUser.points),
        coins: targetUser.mscoin,
        emailVerified: targetUser.emailVerified,
        createdAt: targetUser.createdAt,
        subscription: targetUser.subscription,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Error loading admin users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
