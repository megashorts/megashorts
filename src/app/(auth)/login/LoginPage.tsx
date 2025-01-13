"use client";

import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import GoogleSignInButton from "./google/GoogleSignInButton";
import LoginForm from "./LoginForm";
import NaverSignInButton from "./naver/NaverSignInButton";
import KakaoSignInButton from "./kakao/KakaoSignInButton";

export default function LoginPage() {
  const { toast } = useToast();

  const handleSocialClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      description: "사업자 인증계정 등록시 연결됩니다.",
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6">
      <LoginForm />
      <div className="flex items-center gap-3 text-xs">
        <div className="h-px flex-1 bg-muted" />
        <span>OR</span>
        <div className="h-px flex-1 bg-muted" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <GoogleSignInButton />
        <div onClick={handleSocialClick} className="cursor-pointer">
          <NaverSignInButton />
        </div>
        <div onClick={handleSocialClick} className="cursor-pointer">
          <KakaoSignInButton />
        </div>
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
