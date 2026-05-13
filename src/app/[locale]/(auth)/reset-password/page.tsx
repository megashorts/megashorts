import { Metadata } from "next";
import ResetPasswordRequestForm from "./ResetPasswordRequestForm";


export const metadata: Metadata = {
  title: "비밀번호 재설정",
};

export default function ResetPasswordPage() {
  return (
      <div className="space-y-6">
        <ResetPasswordRequestForm />
      </div>
  );
}