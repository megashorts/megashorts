import { validateRequest } from '@/auth';
import { notFound } from "next/navigation";
import { Metadata } from "next";
import AgencyEarningsTabsClient from './AgencyEarningsTabsClient';


export const metadata: Metadata = {
  title: '영업 포인트 현황',
  description: '영업 활동에 따른 포인트 현황 및 통계를 확인하세요.',
};

export default async function AgencyEarningsPage() {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  // 영업 멤버 권한 확인 (userRole이 20 이상이고 40 미만인 경우 영업 멤버로 간주)
  // if (loggedInUser.userRole < 40 || loggedInUser.userRole >= 100) {
  if (loggedInUser.userRole < 40) {
    notFound();
  }

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <h2 className="text-center text-base text-zinc-400 font-bold">
            {loggedInUser.displayName}님의 영업 현황
          </h2>
        </div>
        <AgencyEarningsTabsClient userId={loggedInUser.id} userRole={loggedInUser.userRole} />
      </div>
    </main>
  );
}
