import MainContent from '@/components/MainContent';
import AuthEventLogger from '@/components/AuthEventLogger';
import { Suspense } from 'react'
import { MainPopupModal } from '@/components/MainPopupModal';

// 무기한 캐시 + 콘텐츠 변경 시 on-demand 무효화
export const revalidate = false;

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
