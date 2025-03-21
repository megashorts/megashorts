import { validateRequest } from '@/auth';
import { notFound } from "next/navigation";
import { Metadata } from "next";
import EarningsTabsClient from './EarningsTabsClient';


export const metadata: Metadata = {
  title: '포인트 수익 현황',
  description: '업로더 포인트 수익 현황 및 통계를 확인하세요.',
};

export default async function EarningsPage() {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  // 업로더 권한 확인 (userRole이 40 이상인 경우 업로더로 간주)
  if (loggedInUser.userRole < 20) {
    notFound();
  }

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <h2 className="text-center text-base text-zinc-400 font-bold">
            {loggedInUser.displayName}님의 수익 현황
          </h2>
        </div>
        <EarningsTabsClient userId={loggedInUser.id} userRole={loggedInUser.userRole} />
      </div>
    </main>
  );
}
