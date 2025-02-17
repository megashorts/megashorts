# 영상 재생 시스템 실행 프로세스

## 시간 순서대로 실행되는 과정

1. 초기 진입 (VideoViewClient.tsx)
- 이어보기 체크:
  ```typescript
  const lastView = await videoDB.getLastView(post.id);
  if (lastView && lastView.sequence >= initialSequence && lastView.sequence > 1) {
    setResumeData({ sequence: lastView.sequence, timestamp: lastView.timestamp });
    setShowResumeModal(true);
  }
  ```
- URL의 시간 파라미터(t) 체크:
  - 있으면 해당 시간부터 재생
  - 없으면 처음부터 재생

2. 권한 체크 (PlayPermissionCheck.tsx)
- 로그인 체크:
  - 미로그인 시 로그인 모달 표시 (code: 1)
- 성인 컨텐츠 체크 (ageLimit >= 18):
  - 미로그인 시 로그인 모달 (code: 1)
  - 성인인증 안된 경우 인증 모달 (code: 2)
- 유료 컨텐츠 체크 (isPremium):
  - 미로그인 시 로그인 모달 (code: 1)
  - 구독 중이면 바로 재생
  - 미구독 시 코인결제 시도:
    ```typescript
    const payResponse = await fetch('/api/user/coinpay', {
      method: 'POST',
      body: JSON.stringify({ videoId })
    });
    ```
    - 이미 구매했으면 재생
    - 코인 부족 시 구독/코인 모달 (code: 3)
    - 결제 실패 시 에러 모달 (code: 4)

3. 영상 재생 시작 (VideoPlayer.tsx)
- HLS 스트림 초기화:
  - 자막 설정
  - 화면 크기별 자막 위치 조정
- 재생 시작:
  - initialTime이 있으면 해당 시점부터
  - 없으면 처음부터

4. 시청 시간 추적 (VideoPlayer.tsx의 handleTimeUpdate)
- 5초 도달 시 첫 저장:
  ```typescript
  if (currentTime >= 5) {
    videoTracking.trackView({
      videoId, postId, sequence, timestamp: currentTime
    });
  }
  ```
- 이후 10초 단위로 저장:
  ```typescript
  const nextCheckpoint = Math.floor(currentTime / 10) * 10;
  if (nextCheckpoint > lastTrackedTimeRef.current) {
    videoDB.saveLastView(postId, sequence, nextCheckpoint);
  }
  ```

5. 시청 기록 저장 (videoTracking.ts)
- 브라우저 저장 (모든 영상):
  ```typescript
  // 시청한 비디오 ID 저장 (1화 포함)
  videoDB.saveWatchedVideo(videoId);
  // 마지막 시청 정보 저장
  videoDB.saveLastView(postId, sequence, timestamp);
  ```
- 서버 저장 (/api/videos/view):
  - 2화 이상만 저장
  - 시청 시간은 10초 단위로 반올림
  - VideoView 모델에 저장:
    ```typescript
    {
      userId: string;
      videoId: string;
      timestamp: number;
      accessMethod: 'FREE' | 'SUBSCRIPTION' | 'COIN';
    }
    ```

6. 동기화 처리
- 로그인 시 서버 데이터 동기화:
  ```typescript
  // /api/videos/sync에서
  const watchedVideos = await prisma.videoView.findMany({
    where: {
      userId: user.id,
      video: { sequence: { gt: 1 } }
    }
  });
  ```
- 브라우저에 없는 데이터만 추가:
  ```typescript
  videoDB.syncWithServer({
    watchedVideos,
    lastViews
  });
  ```

# VideoPlayer와 PlayPermissionCheck의 실제 동작: 영상 로드와 권한 체크가 병렬로 진행되며, 권한 체크 결과에 따라 재생 여부가 제어되는 구조

// 두 컴포넌트가 동시에 렌더링
<VideoPlayer isActive={index === activeIndex && !showResumeModal} />
<PlayPermissionCheck
  setIsActive={(active) => {
    if (!active) setActiveIndex(-1);
  }}
/>

- VideoPlayer는 처음부터 렌더링되지만 isActive가 false라서 실제 재생은 안 됨
- PlayPermissionCheck가 권한 체크 실패 시:
    setIsActive(false) 호출
    setActiveIndex(-1) 호출로 재생 중지
- 권한 체크 성공 시:
    isActive 상태 유지
    영상 재생 계속

중요한 점:
- 영상은 처음부터 로드되지만 재생은 되지 않음 (isActive: false)
- 권한 체크는 영상 로드와 병렬로 진행
- 권한 체크 실패 시 즉시 재생 중지 가능
- 트랜잭션으로 데이터 정합성 보장

