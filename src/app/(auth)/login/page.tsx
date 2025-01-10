import { Metadata } from "next";
import Link from "next/link";
import GoogleSignInButton from "./google/GoogleSignInButton";
import LoginForm from "./LoginForm";
import NaverSignInButton from "./naver/NaverSignInButton";
import KakaoSignInButton from "./kakao/KakaoSignInButton";

export const metadata: Metadata = {
  title: "Login",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <LoginForm />
      <div className="flex items-center gap-3 text-xs">
        <div className="h-px flex-1 bg-muted" />
        <span>OR</span>
        <div className="h-px flex-1 bg-muted" />
      </div>
      <div className="flex items-center justify-center gap-4">
        <GoogleSignInButton />
        <NaverSignInButton />
        <KakaoSignInButton />
      </div>
      <div className="text-center">
        <div className="text-gray-500 text-xs mb-2">
          Don&apos;t have an account? {" "}
          <Link className="text-white hover:underline" href="/signup">
            Sign up
          </Link>
        </div>
        <div className="text-gray-500 text-xs">
          Forgot your password? {" "}
          <Link className="text-white hover:underline" href="/reset-password">
            Reset password
          </Link>
        </div>
      </div>
    </div>
  );
}
