import MainContent from '@/components/MainContent';
import AuthEventLogger from '@/components/AuthEventLogger';
import { Suspense } from 'react'

// 24시간마다 재생성
export const revalidate = 86400;

// 페이지 자체는 동적으로 유지
export default async function Home() {
  return (
    <Suspense>
      <AuthEventLogger />
      <MainContent />
    </Suspense>
  )
}
