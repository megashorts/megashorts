# 영상 시청 시스템 흐름도

## 1. 영상 페이지 접근 시
1. URL 접근 (/video-view/[postId])
   ```typescript
   // [postId]/page.tsx
   - postId로 DB에서 영상 정보 조회
     const post = await prisma.post.findUnique({
       where: { id: postId },
       select: {
         id: true,
         ageLimit: true,
         title: true,
         videos: {
           select: { id: true, sequence: true, isPremium: true }
         }
       }
     });
   ```

2. 이어보기 체크 및 처리
   ```typescript
   // VideoViewClient.tsx
   - IndexedDB에서 마지막 시청 정보 조회
     const lastView = await videoDB.getLastView(post.id);
   
   - 이어보기 데이터 있으면 ResumeModal 표시
     if (lastView && lastView.sequence >= initialSequence && lastView.sequence > 1) {
       setResumeData({
         sequence: lastView.sequence,
         timestamp: lastView.timestamp
       });
       setShowResumeModal(true);
     }

   // ResumeModal 선택 처리
   - "이어보기" 선택 시
     onResume={() => {
       setShowResumeModal(false);
       if (resumeData && swiperRef.current) {
         const targetIndex = post.videos.findIndex(v => v.sequence === resumeData.sequence);
         if (targetIndex !== -1) {
           swiperRef.current.slideTo(targetIndex);
           setActiveIndex(targetIndex);
           
           // URL에 시간 정보 추가
           const url = new URL(window.location.href);
           url.searchParams.set('t', resumeData.timestamp.toString());
           window.history.replaceState({}, '', url);
         }
       }
     }}

   - "괜찮아요" 선택 시
     onStartOver={() => {
       setShowResumeModal(false);
       setResumeData(null);  // 이어보기 데이터 초기화
       // URL 파라미터도 제거
       const url = new URL(window.location.href);
       url.searchParams.delete('t');
       window.history.replaceState({}, '', url);
     }}

   // URL 파라미터 처리
   useEffect(() => {
     const timeParam = searchParams.get('t');
     if (timeParam) {
       const time = parseInt(timeParam, 10);
       if (!isNaN(time)) {
         const video = document.querySelector('video');
         if (video) video.currentTime = time;
       }
     }
   }, [searchParams]);
   ```

## 2. 재생 권한 체크 (PlayPermissionCheck)
1. 권한 체크 시작
   ```typescript
   // PlayPermissionCheck.tsx
   - 중복 체크 방지
     if (isChecked.current === videoId || isProcessing.current) return;

   - API 응답 대기
     if (isLoading) return;

   isProcessing.current = true;  // 체크 시작
   ```

2. 성인 컨텐츠 체크
   ```typescript
   if (ageLimit >= 18) {
     // 로그인 체크
     if (!user) {
       setIsActive(false);
       onPermissionCheck(1);  // 로그인 필요
       isChecked.current = videoId;
       return;
     }

     // 성인인증 체크
     if (!userAuth?.adultauth) {
       setIsActive(false);
       onPermissionCheck(2);  // 성인인증 필요
       isChecked.current = videoId;
       return;
     }
   }
   ```

3. 유료 컨텐츠 체크
   ```typescript
   if (isPremium) {
     // 구독 상태 체크
     const isSubscribed = userAuth?.subscriptionEndDate && 
       new Date(userAuth.subscriptionEndDate) >= new Date();
     
     if (isSubscribed) {
       isChecked.current = videoId;
       return;  // 구독 중이면 통과
     }

     // 코인 결제 처리
     console.log('Sending coin payment request:', { videoId });
     const payResponse = await fetch('/api/user/coinpay', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ videoId })
     });

     // coinpay API 처리
     // api/user/coinpay/route.ts
     - 이미 구매한 영상인지 체크
       const existingPurchase = await prisma.videoPurchase.findUnique({
         where: { userId_videoId: { userId: user.id, videoId } }
       });
       if (existingPurchase) return { alreadyPurchased: true };

     - 코인 잔액 확인 및 차감
       await prisma.$transaction(async (tx) => {
         const userCoins = await tx.userCoins.findUnique({...});
         if (userCoins.amount < COIN_PRICE) throw new Error('Not enough coins');
         
         await tx.userCoins.update({
           where: { userId: user.id },
           data: { amount: { decrement: COIN_PRICE } }
         });

         await tx.videoPurchase.create({
           data: { userId: user.id, videoId, price: COIN_PRICE }
         });
       });

     // 결과 처리
     if (result.alreadyPurchased) {
       console.log('Already purchased this video');
       isChecked.current = videoId;
       return;
     }

     if (!result.success) {
       console.log('Payment failed:', result.error);
       setIsActive(false);
       onPermissionCheck(3);  // 구독/코인 필요
       isChecked.current = videoId;
       return;
     }

     console.log('Payment successful:', {
       remainingCoins: result.remainingCoins
     });
     isChecked.current = videoId;
   }
   ```

## 3. 비디오 재생 시작
1. HLS 초기화
   ```typescript
   // VideoPlayer.tsx
   const initHls = async () => {
     const hls = new Hls({
       enableWorker: true,
       lowLatencyMode: true,
       backBufferLength: 90,
       // 자막 관련 설정
       enableWebVTT: true,
       enableIMSC1: true,
       enableCEA708Captions: true,
       subtitlePreference: {
         lang: 'ko'
       }
     });
     
     hls.loadSource(videoUrl);
     hls.attachMedia(video);

     // 자막 트랙 설정
     hls.on(Hls.Events.MANIFEST_PARSED, () => {
       const subtitleTracks = hls.subtitleTracks;
       const koreanTrack = subtitleTracks.findIndex(track => track.lang === 'ko');
       if (koreanTrack !== -1) {
         hls.subtitleTrack = koreanTrack;
       }
     });
   }
   ```

2. 재생 제어
   ```typescript
   if (isActive) {
     // 이어보기 시점 설정
     if (initialTime > 0) {
       lastTrackedTimeRef.current = Math.floor(initialTime / 10) * 10;
       video.currentTime = initialTime;
     } else if (video.currentTime === 0) {
       lastTrackedTimeRef.current = 0;
     }
     
     if (hlsRef.current) {
       hlsRef.current.startLoad(-1);
     }

     // 재생 시작
     if (!video.paused) return;  // 이미 재생 중이면 스킵

     const playPromise = video.play();
     if (playPromise !== undefined) {
       playPromise.catch(error => {
         if (error.name !== 'AbortError') {
           setTimeout(() => {
             if (isActive && video.paused) {
               video.play();
             }
           }, 1000);
         }
       });
     }
   } else {
     video.pause();
     if (hlsRef.current) {
       hlsRef.current.stopLoad();
     }
     video.currentTime = 0;
   }
   ```

## 4. 시청 시간 추적
1. 5초 도달 시 최초 기록
   ```typescript
   // VideoPlayer.tsx -> handleTimeUpdate
   if (currentTime >= 5 && lastTrackedTimeRef.current === 0) {
     // 브라우저 + 서버 저장
     videoTracking.trackView({
       videoId,
       postId,
       sequence,
       timestamp: currentTime
     });
     
     // videoTracking.ts
     async trackView(params) {
       const { sequence, videoId, postId, timestamp } = params;
       const flooredTimestamp = Math.floor(timestamp / 10) * 10;

       try {
         // 브라우저 저장
         videoDB.saveWatchedVideo(videoId)  // sequence 1번도 저장
           .catch(error => console.error('IndexedDB saveWatchedVideo error:', error));
         
         videoDB.saveLastView(postId, sequence, flooredTimestamp)
           .catch(error => console.error('IndexedDB saveLastView error:', error));

         // 서버 저장
         const response = await fetch('/api/videos/view', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             ...params,
             timestamp: flooredTimestamp
           })
         });

         if (!response.ok) throw new Error(`Server error: ${response.status}`);
       } catch (error) {
         console.error('Error tracking view:', error);
       }
     }

     // videos/view/route.ts
     export async function POST(req: Request) {
       try {
         const { user } = await validateRequest();
         if (!user) {
           return Response.json({ error: "Unauthorized" }, { status: 401 });
         }

         const { videoId, postId, sequence, timestamp } = await req.json();
         
         // 구독 상태 캐시 체크 (12시간)
         const activeSubscription = await getActiveSubscription(user.id);
         
         // 시청 기록 저장
         await prisma.$transaction(async (tx) => {
           // 기존 시청 기록 확인
           const existingView = await tx.videoView.findFirst({
             where: {
               userId: user.id,
               videoId: video.id,
               accessMethod: currentAccessMethod
             },
             orderBy: { createdAt: 'desc' }
           });

           if (existingView) {
             // 기존 기록이 있으면 viewCount만 업데이트
             await tx.videoView.update({
               where: { id: existingView.id },
               data: { viewCount: { increment: 1 } }
             });
           } else {
             // 새로운 시청이면 새 기록 생성
             await tx.videoView.create({
               data: {
                 userId: user.id,
                 videoId: video.id,
                 accessMethod: currentAccessMethod,
                 viewCount: 1
               }
             });
           }

           // 진행 상태 업데이트
           await tx.userVideoProgress.upsert({
             where: {
               userId_postId: {
                 userId: user.id,
                 postId
               }
             },
             create: {
               userId: user.id,
               postId,
               lastVideoSequence: sequence
             },
             update: {
               lastVideoSequence: sequence
             }
           });
         });

         return Response.json({ success: true });
       } catch (error) {
         console.error('Server error:', error);
         return Response.json(
           { error: error.message },
           { status: 500 }
         );
       }
     }
   }
   ```

2. 10초마다 진행 상태 저장
   ```typescript
   // VideoPlayer.tsx -> handleTimeUpdate
   if (lastTrackedTimeRef.current > 0) {
     const nextCheckpoint = Math.floor(currentTime / 10) * 10;
     
     if (nextCheckpoint > lastTrackedTimeRef.current) {
       console.log('Tracking at 10s checkpoint:', {
         videoId,
         sequence,
         currentTime,
         nextCheckpoint
       });
       
       // 브라우저 저장
       videoDB.saveLastView(postId, sequence, nextCheckpoint)
         .catch(error => console.error('IndexedDB saveLastView error:', error));

       // videos/progress/route.ts
       export async function POST(req: Request) {
         const { user } = await validateRequest();
         if (!user) {
           return new NextResponse(null, { status: 401 });
         }

         const body = await req.json();
         const { videoId, timestamp, postId } = body;

         // 비동기로 저장 처리
         queueMicrotask(async () => {
           try {
             await prisma.videoView.upsert({
               where: {
                 userId_videoId: {
                   userId: user.id,
                   videoId,
                 }
               },
               update: { 
                 lastTimestamp: timestamp,
               },
               create: {
                 userId: user.id,
                 videoId,
                 lastTimestamp: timestamp,
                 accessMethod: 'FREE',
               }
             });
           } catch (error) {
             console.error('Failed to save progress:', error);
           }
         });

         return NextResponse.json({ success: true });
       }

       lastTrackedTimeRef.current = nextCheckpoint;
     }
   }
   ```

## 5. 슬라이드 변경 시
1. 슬라이드 변경 감지
   ```typescript
   // VideoViewClient.tsx
   const handleSlideChange = useCallback((swiper: SwiperType) => {
     console.log('Slide changed:', {
       newIndex: swiper.activeIndex,
       video: post.videos[swiper.activeIndex],
       sequence: post.videos[swiper.activeIndex].sequence,
       streamId: post.videos[swiper.activeIndex].id
     });
     setActiveIndex(swiper.activeIndex);
   }, [post.videos]);
   ```

2. 이전 비디오 정지
   ```typescript
   // VideoPlayer.tsx
   if (!isActive) {
     video.pause();
     if (hlsRef.current) {
       hlsRef.current.stopLoad();
     }
     video.currentTime = 0;
   }
   ```

3. 새 비디오 시작
   ```typescript
   // PlayPermissionCheck 다시 실행
   {index === activeIndex && (
     <PlayPermissionCheck
       postId={post.id}
       videoId={video.id}
       playOrder={video.sequence}
       ageLimit={post.ageLimit}
       isPremium={video.isPremium}
       setIsActive={(active) => {
         if (!active) setActiveIndex(-1);
       }}
       onPermissionCheck={(code) => {...}}
     />
   )}

   // VideoPlayer 재시작
   - HLS 초기화
   - 재생 시작
   - 5초/10초 추적 다시 시작
   ```

## 6. 브라우저-서버 동기화
1. 로그인 시 동기화
   ```typescript
   // useVideoSync.ts
   useEffect(() => {
     if (user) {
       fetch('/api/videos/sync')
         .then(res => res.json())
         .then(data => {
           if (data.watchedVideos && data.lastViews) {
             videoDB.syncWithServer({
               watchedVideos: data.watchedVideos,
               lastViews: data.lastViews
             });
           }
         });
     }
   }, [user?.id]);

   // videos/sync/route.ts
   export async function GET(req: Request) {
     const { user } = await validateRequest();
     if (!user) {
       return Response.json({ error: "Unauthorized" }, { status: 401 });
     }

     // 시청한 유료 동영상 목록 조회
     const watchedVideos = await prisma.videoView.findMany({
       where: {
         userId: user.id,
         video: {
           sequence: { gt: 1 }  // 첫 번째 영상 제외
         }
       },
       select: {
         videoId: true
       }
     });

     // 포스트별 마지막 시청 정보 조회
     const lastViews = await prisma.userVideoProgress.findMany({
       where: {
         userId: user.id
       },
       select: {
         postId: true,
         lastVideoSequence: true
       }
     });

     return Response.json({
       watchedVideos,
       lastViews: lastViews.map(view => ({
         postId: view.postId,
         sequence: view.lastVideoSequence,
         timestamp: 0  // 브라우저에서만 관리
       }))
     });
   }
   ```

2. IndexedDB 저장
   ```typescript
   // indexedDB.ts
   class VideoDBManager {
     async syncWithServer(serverData: VideoViewStore) {
       await this.init();
       if (!this.db) throw new Error('Database not initialized');

       // 현재 브라우저의 시청 기록 가져오기
       const transaction = this.db.transaction(['watchedVideos'], 'readwrite');
       const store = transaction.objectStore('watchedVideos');
       
       const request = store.getAll();
       
       request.onsuccess = async () => {
         const currentRecords = request.result || [];
         const currentVideoIds = new Set(currentRecords.map(record => record.videoId));
         
         // 브라우저에 없는 동영상 ID만 추가
         const newWatchedPromises = serverData.watchedVideos
           .filter(video => !currentVideoIds.has(video.videoId))
           .map(video => this.saveWatchedVideo(video.videoId));
         
         await Promise.all(newWatchedPromises);
       };
     }
   }
   ```

## 7. 에러 상황 처리
1. HLS 초기화 실패
   ```typescript
   hls.on(Hls.Events.ERROR, (event, data) => {
     if (data.fatal) {
       switch (data.type) {
         case Hls.ErrorTypes.NETWORK_ERROR:
           hls.startLoad();
           break;
         case Hls.ErrorTypes.MEDIA_ERROR:
           hls.recoverMediaError();
           break;
         default:
           hls.destroy();
           initHls();
           break;
       }
     }
   });
   ```

2. 재생 실패
   ```typescript
   playPromise.catch(error => {
     if (error.name !== 'AbortError') {
       setTimeout(() => {
         if (isActive && video.paused) {
           video.play().catch(e => {
             if (e.name !== 'AbortError') {
               console.error('Retry failed:', e);
             }
           });
         }
       }, 1000);
     }
   });
   ```

3. 권한 체크 실패
   ```typescript
   catch (error) {
     console.error('Permission check error:', error);
     setIsActive(false);
     onPermissionCheck(4);  // 에러 발생
     isChecked.current = videoId;
   } finally {
     isProcessing.current = false;
   }
   ```

4. API 오류
   ```typescript
   // videos/view/route.ts
   try {
     await prisma.$transaction(async (tx) => {
       // DB 작업
     });
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     console.error('Database error:', errorMessage);
     return Response.json(
       { error: errorMessage },
       { status: 500 }
     );
   }
   ```

5. 동기화 실패
   ```typescript
   // useVideoSync.ts
   fetch('/api/videos/sync')
     .then(res => res.json())
     .then(data => {
       if (data.watchedVideos && data.lastViews) {
         videoDB.syncWithServer({...})
           .catch(error => {
             console.error('Failed to sync with server:', error);
             // 동기화 실패해도 기존 브라우저 데이터로 계속 동작
           });
       }
     })
     .catch(error => {
       console.error('Failed to fetch sync data:', error);
       // API 호출 실패해도 기존 브라우저 데이터로 계속 동작
     });
