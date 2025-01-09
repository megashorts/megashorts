import { Metadata } from "next";
import ResetPasswordRequestForm from "./ResetPasswordRequestForm";


export const metadata: Metadata = {
  title: "비밀번호 재설정",
};

export default function ResetPasswordPage() {
  return (
    <div className="w-full h-screen flex flex-col justify-center justify-center">
      <div className="flex-none h-[12%] md:h-[15%] flex items-center justify-center text-2xl">
        비밀번호 재설정
      </div>
      <div className="mt-2 w-[70%] h-[2px] bg-muted mx-auto md:w-[80%]" />
      <div className="space-y-2 md:space-y-5 flex-1 flex flex-col justify-center">
        <ResetPasswordRequestForm />
      </div>
    </div>
  );
}