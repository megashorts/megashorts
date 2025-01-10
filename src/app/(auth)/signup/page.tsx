import { Metadata } from "next";
import Link from "next/link";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function Page() {
  return (
    <div className="space-y-6">
          <SignUpForm />
          <div className="text-gray-500 text-xs mt-3 text-center">
            <p className="text-muted-foreground ml-4 pb-1">
           🎁 추천친구 입력시 추가 보너스 지급! 🎁 
            </p>
            이미 가입회이신가요 ? {" "}
            <Link className="text-white hover:underline" href="/login">
              로그인
            </Link>
          </div>
    </div>
  );
}
