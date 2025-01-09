import { validateRequest } from '@/auth';
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { user } = await validateRequest();

    console.log("Calling get-token for user: ", user?.id);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60;
    const issuedAt = Math.floor(Date.now() / 1000) - 60;

    // TODO: Implement token creation logic if needed
    const token = "dummy-token";

    return NextResponse.json({ token });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
