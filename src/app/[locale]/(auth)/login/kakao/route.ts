import { kakao } from '@/auth';
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  // const url = await kakao.createAuthorizationURL(state, {
  //   scopes: ["profile_nickname", "account_email"]
  // });
  
  const url = await kakao.createAuthorizationURL(state, ["profile_nickname", "account_email"]);


  (await cookies()).set("state", state, {
  // cookies().set("state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  (await cookies()).set("code_verifier", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return Response.redirect(url);
}
