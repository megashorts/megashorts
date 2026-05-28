import MainContent from '@/components/MainContent';
import AuthEventLogger from '@/components/AuthEventLogger';
import { Suspense } from 'react'
import { MainPopupModal } from '@/components/MainPopupModal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 페이지 자체는 동적으로 유지
export default async function Home() {
  return (
    <Suspense>
      <AuthEventLogger />
      <MainPopupModal key="main-popup" />
      <MainContent />
    </Suspense>
  )
}
