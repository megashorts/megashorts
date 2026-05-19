"use client";

import { Link } from "@/i18n/routing";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import GoogleSignInButton from "./google/GoogleSignInButton";
import LoginForm from "./LoginForm";
import NaverSignInButton from "./naver/NaverSignInButton";
import KakaoSignInButton from "./kakao/KakaoSignInButton";

export default function LoginPage() {
  const { toast } = useToast();
  const tAuth = useTranslations("Auth");

  const handleSocialClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      description: "사업자 인증계정 등록시 연결됩니다.",
      duration: 1000,
    });
  };

  return (
    <div className="space-y-6">
      <LoginForm />
      <div className="flex items-center gap-3 text-xs">
        <div className="h-px flex-1 bg-muted" />
        <span>{tAuth("or")}</span>
        <div className="h-px flex-1 bg-muted" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <GoogleSignInButton />
        <NaverSignInButton />
        {/* <div onClick={handleSocialClick} className="cursor-pointer">
          <NaverSignInButton />
        </div> */}
        <KakaoSignInButton />
        {/* <div onClick={handleSocialClick} className="cursor-pointer">
          <KakaoSignInButton />
        </div> */}
      </div>
      <div className="text-center">
        <div className="text-gray-500 text-xs mb-2">
          {tAuth("noAccount")} {" "}
          <Link className="text-white hover:underline" href="/signup">
            {tAuth("signup")}
          </Link>
        </div>
        <div className="text-gray-500 text-xs">
          {tAuth("forgotPassword")} {" "}
          <Link className="text-white hover:underline" href="/reset-password">
            {tAuth("resetPassword")}
          </Link>
        </div>
      </div>
    </div>
  );
}
