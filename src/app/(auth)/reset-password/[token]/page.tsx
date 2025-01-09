import { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";


export const metadata: Metadata = {
  title: "새 비밀번호 설정",
};

interface PageProps {
  params: {
    token: string;
  };
}

export default function ResetPasswordTokenPage({ params }: PageProps) {
  return <ResetPasswordForm token={params.token} />;
}