# 정리가 필요한 파일들

## 1. 사용하지 않는 API 라우트
- `/api/user/coins/route.ts`: 전체가 주석 처리됨
- `/api/reset-password/route.ts`: 전체가 주석 처리됨
- `/api/reset-password/[token]/route.ts`: 전체가 주석 처리됨

## 2. 사용하지 않는 컴포넌트
- `src/components/MovieVideo.tsx`: 전체가 주석 처리됨
- `src/components/SearchField.tsx`: 전체가 주석 처리됨

## 3. 중복 구현된 컴포넌트
### 3.1 비디오 플레이어 관련
- `src/components/videos/VideoPlayer.tsx`
- `src/components/videos/WatchVideoPlayer.tsx`
중복된 구현이므로 하나로 통합 필요

### 3.2 권한 체크 관련
- `src/components/videos/VideoPermissionCheck.tsx`
- `src/components/videos/PlayPermissionCheck.tsx`
유사한 기능을 하므로 통합 필요

## 4. 주석 처리된 코드가 많은 파일
- `src/components/InfiniteScrollContainer.tsx`: 대체 구현이 주석 처리됨
- `src/components/videos/VideoItem.tsx`: 중복된 import문들
- `src/components/SessionProvider.tsx`: 중복 코드

## 5. 레거시 코드
- `/app/(main)/watch/`: 레거시 비디오 시청 페이지
- 새로운 구현(`video-view/`)으로 완전히 마이그레이션 후 제거 필요

## 권장 작업
1. 사용하지 않는 파일 삭제
   - 완전히 주석 처리된 파일들
   - 더 이상 사용되지 않는 레거시 코드

2. 중복 코드 통합
   - 비디오 플레이어 컴포넌트 통합
   - 권한 체크 컴포넌트 통합

3. 코드 정리
   - 주석 처리된 미사용 코드 제거
   - 중복된 import문 정리
   - 레거시 코드 마이그레이션

4. 문서화
   - 통합된 컴포넌트들의 새로운 구조 문서화
   - API 변경사항 문서화
