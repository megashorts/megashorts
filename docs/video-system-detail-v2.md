# 영상 시청 시스템 흐름도

## 1. 영상 페이지 접근 시
1. URL 접근 (/video-view/[postId])
   - 처리 위치: src/app/(main)/(static)/blog/[postId]/page.tsx
   - 조회 데이터: post 테이블에서 id, ageLimit, title, videos 정보
   - videos 정보: id, sequence, isPremium 포함

2. 이어보기 체크 및 처리
   - 처리 위치: src/lib/indexedDB.ts의 videoDB.getLastView()
   - 저장 위치: 브라우저 IndexedDB의 lastViews 스토어
   - 저장 정보: postId, sequence(마지막 본 영상 번호), timestamp(시청 시점)
   - 이어보기 모달: VideoViewClient.tsx의 ResumeModal 컴포넌트
   - URL 파라미터: t(timestamp)로 시청 시점 전달

## 2. 재생 권한 체크
1. 권한 체크 시작
   - 처리 위치: src/components/videos/PlayPermissionCheck.tsx
   - 체크 항목: 성인인증, 구독상태, 코인결제 여부
   - 상태 관리: isChecked, isProcessing으로 중복/동시 체크 방지

2. 성인 컨텐츠 체크 (ageLimit >= 18)
   - 체크 순서: 로그인 → 성인인증
   - 처리 코드: 미로그인(1), 미인증(2)
   - 데이터 위치: User 모델의 adultauth 필드

3. 유료 컨텐츠 체크 (isPremium = true)
   - 구독 확인: User 모델의 subscriptionEndDate
   - 코인 결제: /api/user/coinpay API 호출
   - 처리 코드: 구독/코인 필요(3)

## 3. 시청 기록 처리
1. 시청 데이터 전송
   - 처리 위치: src/lib/videoTracking.ts의 trackView 함수
   - 전송 데이터: videoId, postId, sequence, timestamp
   - 최소 기준: 5초 이상 시청
   - 시간 처리: 10초 단위로 반올림 (예: 23초 → 20초)

2. 브라우저 저장
   - 저장 위치: IndexedDB의 watchedVideos, lastViews 스토어
   - watchedVideos: 시청한 비디오 ID 목록
   - lastViews: 포스트별 마지막 시청 정보
   - 처리 함수: saveWatchedVideo(), saveLastView()

3. 서버 저장
   - API: /api/videos/view (POST)
   - 처리 위치: src/app/(main)/api/videos/view/route.ts
   - 저장 모델: VideoView, UserVideoProgress
   - 구독 캐시: getActiveSubscription으로 12시간 캐싱

4. 시청 기록 구분
   무료 시청:
   - 조건: video.isPremium = false
   - 처리: 같은 비디오는 viewCount만 증가
   - 모델: VideoView의 accessMethod = FREE

   구독 시청:
   - 조건: video.isPremium = true + 유효한 구독
   - 처리: 매 시청마다 새로운 기록
   - 모델: VideoView의 accessMethod = SUBSCRIPTION
   - 정산: VideoSettlement의 totalSubscriptionViews 증가

   코인 시청:
   - 조건: video.isPremium = true + 구독 없음
   - 처리: 매 시청마다 새로운 기록
   - 모델: VideoView의 accessMethod = COIN
   - 정산: VideoSettlement의 totalCoinViews 증가

## 4. 정산 데이터 관리
1. 정산 데이터 구조
   - 모델: VideoSettlement
   - 필드:
     * totalSubscriptionViews: 총 구독 시청 수
     * postSettlementSubViews: 정산 완료된 구독 시청 수
     * totalCoinViews: 총 코인 시청 수
     * postSettlementCoinViews: 정산 완료된 코인 시청 수
     * lastSettledAt: 마지막 정산 시점

2. 정산 이력 관리
   - 모델: SettlementHistory
   - 관계: VideoSettlement와 1:N
   - 저장 정보: 정산 시점, 구독/코인 시청 수
   - 인덱스: [videoSettlementId, settledAt]

3. 정산 계산 방식
   구독 정산:
   - 신규 정산 수 = totalSubscriptionViews - postSettlementSubViews
   - 정산 후 postSettlementSubViews = totalSubscriptionViews

   코인 정산:
   - 신규 정산 수 = totalCoinViews - postSettlementCoinViews
   - 정산 후 postSettlementCoinViews = totalCoinViews

## 5. 브라우저-서버 동기화
1. 동기화 시점
   - 로그인 시
   - 새로고침 시
   - 사용자 전환 시

2. 동기화 처리
   - API: /api/videos/sync (GET)
   - 처리 함수: videoDB.syncWithServer()
   - 동기화 데이터:
     * 시청한 비디오 ID 목록
     * 포스트별 마지막 시청동영상의 재생순서 정보

3. 데이터 초기화
   - 함수: clearForNewUser()
   - 시점: 다른 사용자 로그인 시
   - 대상: watchedVideos, lastViews 스토어
