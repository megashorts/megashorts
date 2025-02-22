# 추천 동영상 로딩 시스템 상세 설명

## 1. 초기 로드 (20개)
### 언제?
- 추천 페이지에 처음 접속할 때
- 모든 영상을 다 보고 처음부터 다시 시작할 때
[RecommendedVideosClient.tsx: useEffect(() => loadViewHistory(), [])]

### 무엇을?
- 20개 포스트의 기본 정보
  * 제목
  * 썸네일
  * 영상 ID
  * 시퀀스 번호
[RecommendedVideosClient.tsx: posts: initialPosts]
- 첫 번째 영상의 매니페스트 파일
- 첫 번째 영상의 첫 3초 세그먼트
[VideoPlayer.tsx: initHls() -> hls.loadSource(videoUrl)]

### 사용자 경험
- 즉시 첫 화면 표시 (썸네일로)
[VideoPlayer.tsx: style={{ backgroundImage: `url(${thumbnailUrl})` }}]
- 0.5초 이내 첫 영상 재생 시작
[VideoPlayer.tsx: video.play()]
- 다음 영상들은 백그라운드에서 준비
[VideoPlayer.tsx: hlsRef.current.startLoad(-1)]

## 2. 초기 세그먼트 (3초)
### 언제?
- 각 영상이 활성화되기 직전
- 사용자가 영상에 도달하기 전
[VideoPlayer.tsx: isActive && isLoaded]

### 무엇을?
- 해당 영상의 첫 3초 분량
[VideoPlayer.tsx: backBufferLength: 90]
- 영상 매니페스트 파일
[VideoPlayer.tsx: hls.loadSource(videoUrl)]
- 영상 메타데이터
[VideoPlayer.tsx: video.addEventListener('loadedmetadata')]

## 3. 프리로드 영상 (2개)
### 언제?
- 현재 보고 있는 영상 이후
[RecommendedVideosClient.tsx: index < loadedPosts.length - 1]
- 사용자의 스크롤 방향 예측
[RecommendedVideosClient.tsx: handleSlideChange]

### 무엇을?
- 다음 2개 영상의 매니페스트
[VideoPlayer.tsx: hls.loadSource(videoUrl)]
- 다음 영상의 첫 3초 세그먼트
[VideoPlayer.tsx: backBufferLength: 90]
- 메타데이터와 썸네일
[VideoPlayer.tsx: poster={thumbnailUrl}]

## 4. 추가 로드 (20개)
### 언제?
- 현재 목록의 끝에서 5개 전에 도달했을 때
[RecommendedVideosClient.tsx: loadedPosts.length - activeIndex <= 5]
- 남은 영상이 적어질 때 미리 준비
[RecommendedVideosClient.tsx: loadMorePosts]

### 무엇을?
- 다음 20개 포스트 정보
[RecommendedVideosClient.tsx: take=15 in loadMorePosts]
- 기본 메타데이터
[RecommendedVideosClient.tsx: posts.map((post, index))]
- 썸네일 이미지
[VideoPlayer.tsx: thumbnailUrl]

## 5. 최적화 포인트
### 네트워크 사용
- 필요한 데이터만 미리 로드
[VideoPlayer.tsx: hlsRef.current.startLoad(-1)]
- 사용자 방향 예측으로 효율적 로드
[RecommendedVideosClient.tsx: handleSlideChange]
- 불필요한 데이터 로드 방지
[VideoPlayer.tsx: hlsRef.current.stopLoad()]

### 메모리 관리
- 지난 영상 데이터 해제
[VideoPlayer.tsx: hlsRef.current.destroy()]
- 필요한 만큼만 메모리 유지
[VideoPlayer.tsx: useEffect cleanup]
- 자동 메모리 최적화
[VideoPlayer.tsx: hls.destroy()]

### 사용자 패턴
- 빠른 스크롤 대응
[RecommendedVideosClient.tsx: mousewheel={{ sensitivity: 1 }}]
- 방향 전환 대응
[RecommendedVideosClient.tsx: onSlideChange]
- 일시정지/재생 패턴 학습
[VideoPlayer.tsx: video.paused]

[이하 생략된 섹션들도 동일한 방식으로 코드 참조 추가]
