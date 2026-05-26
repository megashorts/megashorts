import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { formatStoredAgencyDetails, formatStoredCreatorDetails } from "@/lib/stored-stats-formatters";
import { assertStatsAccess } from "@/lib/stats-queries";
import { fetchCommissionSummaryFromWorker } from "@/lib/worker-stats";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const period = searchParams.get("period") || "current";
    const type = searchParams.get("type") || "uploader";

    await assertStatsAccess(user, userId);

    if (type === "agency") {
      if (user.userRole < USER_ROLE.TEAM_MEMBER && user.userRole < USER_ROLE.OPERATION1) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      const workerSummary = await fetchCommissionSummaryFromWorker({
        scope: "agency",
        userId: userId!,
        period,
      });
      const detail = formatStoredAgencyDetails(workerSummary, period);
      const postIds = Array.isArray(detail.items) ? detail.items.map((item: any) => item.postId).filter(Boolean) : [];
      const posts = postIds.length > 0
        ? await prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, title: true, postNum: true } })
        : [];
      const postMap = new Map(posts.map((post) => [post.id, post.title || `Post #${post.postNum}`]));

      return NextResponse.json({
        success: true,
        data: {
          ...detail,
          items: Array.isArray(detail.items)
            ? detail.items.map((item: any) => ({
                ...item,
                postTitle: postMap.get(item.postId) || item.postId,
              }))
            : [],
        },
      });
    }

    const workerSummary = await fetchCommissionSummaryFromWorker({
      scope: "creator",
      userId: userId!,
      period,
    });

    const detail = formatStoredCreatorDetails(workerSummary, period);
    const postIds = Array.isArray(detail.items) ? detail.items.map((item: any) => item.postId).filter(Boolean) : [];
    const posts = postIds.length > 0
      ? await prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, title: true, postNum: true } })
      : [];
    const postMap = new Map(posts.map((post) => [post.id, post.title || `Post #${post.postNum}`]));

    return NextResponse.json({
      success: true,
      data: {
        ...detail,
        items: Array.isArray(detail.items)
          ? detail.items.map((item: any) => ({
              ...item,
              postTitle: postMap.get(item.postId) || item.postTitle,
            }))
          : [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Forbidden" ? 403 : message === "Missing userId" ? 400 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
