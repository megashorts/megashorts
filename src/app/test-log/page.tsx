'use client';

import { useState } from 'react';
import ky from '@/lib/ky';
import { logActivity } from '@/lib/activity-logger/client';
import { login } from '@/app/(auth)/login/actions';
import { signUp } from '@/app/(auth)/signup/actions';
import { resetPassword } from '@/app/(auth)/reset-password/actions';
import { submitPost } from '@/components/posts/editor/actions';
import { deletePost } from '@/components/posts/actions';
import { Language } from '@prisma/client';

interface Video {
  id: string;
  postId: string;
  sequence: number;
  isPremium: boolean;
}

interface ViewResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

interface RecommendedPost {
  id: string;
  title: string | null;
  videos: {
    id: string;
    sequence: number;
    isPremium: boolean;
  }[];
}

interface TestPost {
  id: string;
  title: string;
  content: string;
  videos?: {
    id: string;
    filename: string;
    sequence: number;
    isPremium: boolean;
    subtitle?: string[];
  }[];
}

interface SubscriptionStatus {
  subscription: string | null;
  subscriptionEndDate: string | null;
  isActive: boolean;
}

interface User {
  id: string;
  mscoin: number;
}

interface CoinPayResult {
  type: 'EXISTING_VIEW' | 'NEW_VIEW' | 'INSUFFICIENT_COINS';
  success: boolean;
  alreadyPurchased?: boolean;
  remainingCoins?: number;
  error?: string;
}

export default function TestLogPage() {
  const [result, setResult] = useState<string>('');

  // 1. 인증 관련 테스트
  const testAuth = async () => {
    try {
      // 1.1 회원가입 시도 로그
      logActivity({
        type: 'login',
        category: 'login',
        event: 'attempt',
        method: 'email',
        ip: '127.0.0.1',
        userAgent: navigator.userAgent
      });

      // 회원가입 테스트
      const signupResult = await signUp({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        confirmPassword: 'password123'
      });

      // 회원가입 성공 로그
      logActivity({
        type: 'login',
        category: 'login',
        event: 'success',
        method: 'email',
        ip: '127.0.0.1',
        userAgent: navigator.userAgent
      });

      // 1.2 이메일 검증 로그
      logActivity({
        type: 'api',
        category: 'login',
        request: {
          method: 'POST',
          path: '/api/auth/verify-email',
          body: { email: 'test@example.com' }
        },
        response: { status: 200 }
      });

      await ky.post('/api/auth/verify-email', {
        json: { email: 'test@example.com' }
      });

      // 1.3 이메일 로그인 시도 로그
      logActivity({
        type: 'login',
        category: 'login',
        event: 'attempt',
        method: 'email',
        ip: '127.0.0.1',
        userAgent: navigator.userAgent
      });

      // 이메일 로그인 테스트
      const loginResult = await login({
        username: 'test@example.com',
        password: 'password123'
      });

      if (loginResult.error) {
        // 로그인 실패 로그
        logActivity({
          type: 'login',
          category: 'login',
          event: 'failure',
          method: 'email',
          ip: '127.0.0.1',
          userAgent: navigator.userAgent,
          failureReason: loginResult.error
        });
        throw new Error(loginResult.error);
      }

      // 로그인 성공 로그
      logActivity({
        type: 'login',
        category: 'login',
        event: 'success',
        method: 'email',
        ip: '127.0.0.1',
        userAgent: navigator.userAgent
      });

      // 1.4 비밀번호 리셋 요청 로그
      logActivity({
        type: 'api',
        category: 'login',
        request: {
          method: 'POST',
          path: '/api/auth/reset-password',
          body: { token: 'reset_token_123' }
        },
        response: { status: 200 }
      });

      // 비밀번호 리셋
      const resetResult = await resetPassword(
        'reset_token_123',
        {
          password: 'newpassword123',
          confirmPassword: 'newpassword123'
        }
      );

      // 1.5 구글 로그인 시도 로그
      logActivity({
        type: 'login',
        category: 'login',
        event: 'attempt',
        method: 'google',
        ip: '127.0.0.1',
        userAgent: navigator.userAgent
      });

      // 구글 로그인 테스트
      window.location.href = '/login/google';
      return;

    } catch (error) {
      setResult('인증 테스트 실패: ' + (error as Error).message);
    }
  };

  // 2. 포스트 관련 테스트
  const testPosts = async () => {
    try {
      // 2.1 비디오 업로드 로그
      logActivity({
        type: 'api',
        category: 'post',
        request: {
          method: 'POST',
          path: '/api/videos/upload'
        },
        response: { status: 200 }
      });

      // 비디오 업로드
      const formData = new FormData();
      formData.append('file', new File([''], 'test.mp4', { type: 'video/mp4' }));
      const uploadResponse = await ky.post('/api/videos/upload', {
        body: formData
      });
      const { videoId } = await uploadResponse.json() as { videoId: string };

      // 2.2 자막 업로드 로그
      logActivity({
        type: 'api',
        category: 'post',
        request: {
          method: 'POST',
          path: '/api/videos/subtitle'
        },
        response: { status: 200 }
      });

      // 자막 업로드
      const subtitleFormData = new FormData();
      subtitleFormData.append('file', new File([''], 'test.vtt', { type: 'text/vtt' }));
      subtitleFormData.append('language', 'KOREAN');
      subtitleFormData.append('videoId', videoId);
      await ky.post('/api/videos/subtitle', {
        body: subtitleFormData
      });

      // 2.3 포스트 생성 로그
      logActivity({
        type: 'post',
        category: 'post',
        event: 'create',
        postId: 'temp_id',
        title: 'Test Post'
      });

      // 포스트 생성
      const newPost = await submitPost({
        title: 'Test Post',
        titleOriginal: 'Test Post Original',
        content: 'Test Content',
        status: 'PUBLISHED',
        categories: ['ACTION'] as const,
        ageLimit: 15,
        postLanguage: Language.KOREAN,
        featured: false,
        priority: 0,
        videos: [{
          id: videoId,
          filename: 'test.mp4',
          sequence: 1,
          isPremium: false,
          subtitle: ['KOREAN']
        }]
      });

      // 2.4 비디오 순서 변경
      await ky.put(`/api/videos/${newPost.id}`, {
        json: {
          videos: [{
            id: videoId,
            sequence: 2
          }]
        }
      });

      // 2.5 메타데이터 업데이트
      await ky.post('/api/videos/sync', {
        json: {
          videoId,
          metadata: {
            title: 'Updated Title'
          }
        }
      });

      // 2.6 포스트 조회/상호작용
      const { posts } = await ky.get('/api/posts/blog').json<{ posts: any[] }>();
      if (posts.length > 0) {
        const post = posts[0];
        
        await ky.post(`/api/posts/${post.id}/like`);
        await ky.post(`/api/posts/${post.id}/bookmark`);
      }

      // 2.7 자막 삭제
      await ky.delete(`/api/videos/subtitle/${videoId}/KOREAN`);

      // 2.8 비디오 삭제
      await ky.delete(`/api/videos/delete/${videoId}`);

      // 2.9 포스트 삭제 로그
      logActivity({
        type: 'post',
        category: 'post',
        event: 'delete',
        postId: newPost.id,
        title: newPost.title || undefined
      });

      // 포스트 삭제
      await deletePost(newPost.id);

      setResult('포스트 테스트 완료 - localStorage 확인');
    } catch (error) {
      setResult('포스트 테스트 실패: ' + (error as Error).message);
    }
  };

  // 3. 비디오 관련 테스트
  const testVideos = async () => {
    try {
      // 3.1 추천 비디오 테스트
      const recommendedResponse = await ky.get('/api/posts/recommended', {
        searchParams: { skip: 0, take: 5 }
      });
      const recommendedPosts = await recommendedResponse.json() as RecommendedPost[];

      if (recommendedPosts.length > 0) {
        const post = recommendedPosts[0];
        const video = post.videos[0];

        // 3.2 권한 체크 실패 케이스 테스트
        const viewResponse = await ky.post('/api/videos/view', {
          json: {
            videoId: video.id,
            postId: post.id,
            sequence: 1,
            timestamp: 10
          }
        });

        const viewResult = await viewResponse.json() as ViewResponse;

        if (viewResult.success) {
          // 3.3 시청 시작 로그
          logActivity({
            type: 'video',
            category: 'video',
            event: 'start',
            videoId: video.id,
            postId: post.id,
            sequence: 1,
            accessMethod: 'FREE'
          });

          // 3.4 시청 진행 업데이트
          await ky.post('/api/videos/progress', {
            json: {
              videoId: video.id,
              postId: post.id,
              timestamp: 30
            }
          });

          // 3.5 시청 진행 로그
          logActivity({
            type: 'video',
            category: 'video',
            event: 'progress',
            videoId: video.id,
            postId: post.id,
            sequence: 1,
            progress: 0.5,
            accessMethod: 'FREE'
          });
        }
      }

      // 3.6 전체 에피소드 테스트
      const postResponse = await ky.get('/api/posts/blog').json<{ posts: any[] }>();
      if (postResponse.posts.length > 0) {
        const post = postResponse.posts[0];
        const video = post.videos[0];

        // 3.7 프리미엄 콘텐츠인 경우 코인으로 구매
        if (video.isPremium) {
          const coinPayResponse = await ky.post('/api/user/coinpay', {
            json: {
              videoId: video.id
            }
          });
          const coinPayResult = await coinPayResponse.json() as CoinPayResult;

          if (!coinPayResult.success) {
            logActivity({
              type: 'video_access',
              category: 'video',
              videoId: video.id,
              postId: post.id,
              result: 'denied',
              reason: coinPayResult.type === 'INSUFFICIENT_COINS' ? 'premium_no_access' : 'coin_payment',
              subscriptionStatus: 'none'
            });
            throw new Error(coinPayResult.error || 'Failed to purchase video');
          }
        }

        // 3.8 비디오 시청 시작
        const viewResponse = await ky.post('/api/videos/view', {
          json: {
            videoId: video.id,
            postId: post.id,
            sequence: 1,
            timestamp: 10
          }
        });

        const viewResult = await viewResponse.json() as ViewResponse;

        if (viewResult.success) {
          // 3.9 시청 시작 로그
          logActivity({
            type: 'video',
            category: 'video',
            event: 'start',
            videoId: video.id,
            postId: post.id,
            sequence: 1,
            accessMethod: video.isPremium ? 'SUBSCRIPTION' : 'FREE'
          });

          // 3.10 시청 진행 업데이트
          await ky.post('/api/videos/progress', {
            json: {
              videoId: video.id,
              postId: post.id,
              timestamp: 30
            }
          });

          // 3.11 시청 진행 로그
          logActivity({
            type: 'video',
            category: 'video',
            event: 'progress',
            videoId: video.id,
            postId: post.id,
            sequence: 1,
            progress: 0.5,
            accessMethod: video.isPremium ? 'SUBSCRIPTION' : 'FREE'
          });
        }
      }

      setResult('비디오 테스트 완료 - localStorage 확인');
    } catch (error) {
      setResult('비디오 테스트 실패: ' + (error as Error).message);
    }
  };

  // 4. 결제 관련 테스트
  const testPayments = async () => {
    try {
      // 4.1 구독 결제 시도 로그
      logActivity({
        type: 'payment',
        category: 'payment',
        event: 'attempt',
        amount: 9900,
        currency: 'KRW',
        productType: 'subscription'
      });

      // 구독 결제 테스트
      const subscriptionResponse = await ky.get('/api/payments/billing/success', {
        searchParams: {
          type: 'weekly',
          amount: '9900',
          customerKey: 'test_user_123',
          authKey: 'test_auth_key'
        }
      });

      // 구독 결제 성공 로그
      logActivity({
        type: 'payment',
        category: 'payment',
        event: 'success',
        amount: 9900,
        currency: 'KRW',
        productType: 'subscription',
        orderId: 'test_user_123'
      });

      // 4.2 코인 구매 시도 로그
      logActivity({
        type: 'payment',
        category: 'payment',
        event: 'attempt',
        amount: 10000,
        currency: 'KRW',
        productType: 'coin'
      });

      // 코인 구매 테스트
      const coinResponse = await ky.get('/api/payments/success', {
        searchParams: {
          orderId: 'order_test_100coins',
          paymentKey: 'test_payment_key',
          amount: '10000'
        }
      });

      // 코인 구매 성공 로그
      logActivity({
        type: 'payment',
        category: 'payment',
        event: 'success',
        amount: 10000,
        currency: 'KRW',
        productType: 'coin',
        orderId: 'order_test_100coins'
      });

      // 4.3 코인 소진 테스트
      const coinPayResponse = await ky.post('/api/user/coinpay', {
        json: {
          videoId: 'test-video-id'
        }
      });
      const coinPayResult = await coinPayResponse.json() as CoinPayResult;

      // 4.4 구독/코인 상태 확인
      const subscriptionStatus = await ky.get('/api/subscription/status').json() as SubscriptionStatus;
      const user = await ky.get('/api/user').json() as User;

      setResult(
        '결제 테스트 완료\n' +
        '구독 상태: ' + JSON.stringify(subscriptionStatus, null, 2) + '\n' +
        '코인 잔액: ' + user.mscoin + '\n' +
        '코인 소진 결과: ' + JSON.stringify(coinPayResult, null, 2)
      );
    } catch (error) {
      setResult('결제 테스트 실패: ' + (error as Error).message);
    }
  };

  // 저장된 로그 확인
  const checkLogs = () => {
    const logs = localStorage.getItem('activity_logger_pending_logs') || '[]';
    const parsedLogs = JSON.parse(logs);
    const size = new Blob([logs]).size;
    setResult(
      `저장된 로그 (크기: ${(size / 1024).toFixed(2)}KB):\n` +
      JSON.stringify(parsedLogs, null, 2)
    );
  };

  // 로그 삭제
  const clearLogs = () => {
    localStorage.removeItem('activity_logger_pending_logs');
    setResult('로그 삭제됨');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">로그 테스트</h1>
      <div className="space-y-4">
        <div className="space-x-4">
          <button
            onClick={testAuth}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            인증 테스트
          </button>
          <button
            onClick={testPosts}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            포스트 테스트
          </button>
          <button
            onClick={testVideos}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            비디오 테스트
          </button>
          <button
            onClick={testPayments}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            결제 테스트
          </button>
        </div>
        <div className="space-x-4">
          <button
            onClick={checkLogs}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            저장된 로그 확인
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            로그 삭제
          </button>
        </div>
      </div>
      <pre className="bg-black border p-4 rounded mt-4 whitespace-pre-wrap max-h-[600px] overflow-auto">
        {result}
      </pre>
    </div>
  );
}
