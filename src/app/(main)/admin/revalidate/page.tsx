'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";

export default function RevalidatePage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRevalidate = async () => {
    setIsLoading(true);
    try {
      const paths = [
        '/',
        '/categories/recent',
        '/categories/action',
        '/categories/romance',
        '/categories/drama',
        '/categories/comic',
        '/categories/thriller',
        '/categories/period',
        '/categories/fantasy',
        '/categories/highteen',
        '/categories/adult'
      ];

      await Promise.all(
        paths.map(path =>
          fetch('/api/revalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path })
          })
        )
      );

      alert('모든 페이지가 재생성되었습니다.');
    } catch (error) {
      console.error('재생성 중 오류 발생:', error);
      alert('재생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">페이지 재생성</h1>
      <Button
        onClick={handleRevalidate}
        disabled={isLoading}
      >
        {isLoading ? '재생성 중...' : '모든 페이지 재생성'}
      </Button>
    </div>
  );
}