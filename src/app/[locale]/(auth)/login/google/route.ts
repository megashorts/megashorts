import { google } from '@/auth';
import { shouldUseSecureAuthCookies } from "@/lib/auth-cookie";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  // const url = await google.createAuthorizationURL(state, codeVerifier, {
  //   scopes: ["profile", "email"],
  // });

  const url = await google.createAuthorizationURL(state, codeVerifier, ["profile", "email"]);

  
  (await cookies()).set("state", state, {
  // cookies().set("state", state, {
    path: "/",
    secure: shouldUseSecureAuthCookies(),
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  (await cookies()).set("code_verifier", codeVerifier, {
    path: "/",
    secure: shouldUseSecureAuthCookies(),
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return Response.redirect(url);
}
