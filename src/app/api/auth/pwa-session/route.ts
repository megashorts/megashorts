import { lucia, validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  PWA_STANDALONE_COOKIE,
  getPwaSessionExpiresAt,
  withPwaSessionCookieAttributes,
} from "@/lib/pwa-session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const isPwaRequest =
    request.headers.get("X-Megashorts-PWA") === "1" ||
    request.cookies.get(PWA_STANDALONE_COOKIE)?.value === "1";

  if (!isPwaRequest) {
    return NextResponse.json({ error: "PWA standalone context required" }, { status: 400 });
  }

  const { session } = await validateRequest();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiresAt = getPwaSessionExpiresAt();

  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt },
  });

  const sessionCookie = lucia.createSessionCookie(session.id);
  const response = NextResponse.json({ expiresAt: expiresAt.toISOString() });
  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    withPwaSessionCookieAttributes(sessionCookie.attributes, expiresAt),
  );

  return response;
}
