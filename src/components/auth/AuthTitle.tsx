'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  login: '로그인',
  signup: '회원가입',
  'reset-password': '비밀번호 변경'
};

export function AuthTitle() {
  const pathname = usePathname();
  const title = titles[pathname.split('/').pop() || ''] || '';

  return (
    <>
      <div className="py-6 text-center text-2xl">{title}</div>
      <div className="w-[70%] h-[2px] bg-muted mx-auto md:w-[80%]" />
    </>
  );
}
