import { validateRequest } from '@/auth';
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await validateRequest();
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ user: null, session: null });
  }
}