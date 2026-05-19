import { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";


export const metadata: Metadata = {
  title: "새 비밀번호 설정",
};

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ResetPasswordTokenPage({ params }: PageProps) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
