import { Metadata } from "next";
import Link from "next/link";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function Page() {
  return (
    // <div className="mt-24 rounded bg-black/80 py-10 px-6 md:mt-0 md:max-w-sm md:px-14">
    <div className="w-full h-screen flex flex-col justify-center justify-center ">
        <div className="flex-none h-[12%] md:h-[15%] flex items-center justify-center text-2xl">회원가입</div>
        <div 
          className="mt-2 w-[70%] h-[2px] bg-muted mx-auto md:w-[80%]"
        ></div>
        <div className="space-y-3 md:space-y-5 flex-1 flex flex-col justify-center"> 
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
    </div>
  );
}
