import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < USER_ROLE.TEAM_MASTER) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const targetUserId = String(body.targetUserId || "");
    const qualificationLevel = Number(body.qualificationLevel ?? body.userRole);

    if (!targetUserId || !Number.isFinite(qualificationLevel)) {
      return Response.json({ success: false, error: "Invalid agency qualification" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, displayName: true, teamMaster: true, userRole: true },
    });

    if (!target) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 });
    }
    if (target.id === user.id || target.userRole < USER_ROLE.TEAM_MEMBER || target.userRole >= USER_ROLE.OPERATION1) {
      return Response.json({ success: false, error: "Target is not editable" }, { status: 403 });
    }

    const canEdit = user.userRole >= USER_ROLE.OPERATION1 || target.teamMaster === user.id;
    if (!canEdit) {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const masterId = target.teamMaster || user.id;
    const settings = await prisma.systemSetting.findUnique({
      where: { key: `agencySettings_${masterId}` },
      select: { value: true },
    });
    const levels = agencyLevels(settings?.value);
    if (!levels.some((level: any) => Number(level.level) === qualificationLevel)) {
      return Response.json({ success: false, error: "Qualification is not defined for this team" }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: `agencyQualification_${masterId}_${targetUserId}` },
      update: {
        value: { masterId, userId: targetUserId, level: qualificationLevel },
        valueType: "json",
        description: "Agency team payout qualification override",
        updatedBy: user.id,
      },
      create: {
        key: `agencyQualification_${masterId}_${targetUserId}`,
        value: { masterId, userId: targetUserId, level: qualificationLevel },
        valueType: "json",
        description: "Agency team payout qualification override",
        updatedBy: user.id,
      },
    });

    await writeQualificationLog(request, user, target, qualificationLevel);

    return Response.json({
      success: true,
      user: target,
      qualification: { masterId, userId: targetUserId, level: qualificationLevel },
    });
  } catch (error) {
    console.error("Error updating agency qualification:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function writeQualificationLog(
  request: NextRequest,
  actor: { id: string; username?: string | null },
  target: { id: string; username: string; userRole: number },
  nextLevel: number,
) {
  try {
    const payload = [{
      type: "system",
      event: "agency_qualification_update",
      eventI18n: {
        en: "Agency qualification changed",
        ko: "영업팀 자격 변경",
        zh: "销售团队资格已变更",
      },
      username: actor.username || actor.id,
      details: {
        action: "agency_qualification_update",
        result: "success",
        userId: actor.id,
        target: target.id,
        platformRole: target.userRole,
        nextQualificationLevel: nextLevel,
      },
      timestamp: new Date().toISOString(),
    }];

    await fetch(new URL("/api/logs", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    // Logging must not block the qualification update path.
  }
}

function agencyLevels(value: unknown) {
  const settings = parseAgencySettings(value);
  return settings?.settings?.headquarters?.levels || settings?.settings?.network?.levels || [];
}

function parseAgencySettings(value: unknown) {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value as any;
}
