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
    <div className="w-full h-screen flex flex-col justify-center justify-center ">
        <div className="flex-none h-[12%] md:h-[15%] flex items-center justify-center text-2xl">로그인</div>
        <div 
          className="mt-2 w-[70%] h-[2px] bg-muted mx-auto md:w-[80%]"
        />
        <div className="space-y-3 md:space-y-5 flex-1 flex flex-col justify-center"> 
          <LoginForm />
          <div className="flex items-center gap-3 text-xs">
            <div className="h-px flex-1 bg-muted" />
            <span>OR</span>
            <div className="h-px flex-1 bg-muted" />
          </div>
          <div className="flex items-center justify-center gap-4"> {/* Centered social login buttons */}
            <GoogleSignInButton />
            <NaverSignInButton />
            <KakaoSignInButton />
          </div>
          <div className="text-center"> {/* Centered text links */}
            <div className="text-gray-500 text-xs mb-2 mt-3">
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
    </div>
  );
}
