# MegaShorts 개발 메모리 (에러/해결/구조변경 기록)

> 최종 업데이트: 2026-05-13

## 2026-05-13 — 플랫폼 고도화 (다국어, PWA, 권한 최적화, 성인인증)

### 1. 다국어(next-intl) 및 라우팅 구조 변경
- **URL 구조**: 영어(기본, prefix 없음), 한국어(`/ko`), 중국어(`/zh`)
- **API 경로 주의**: `src/app/[locale]/(main)/api` 폴더가 있으면 `/en/api/...` 처럼 접두사가 붙어 프론트엔드 fetch 호출이 깨짐. 따라서 모든 API를 `src/app/api`로 이동 완료.
- **Middleware**: `next-intl` 미들웨어를 기존 CORS 설정과 통합.

### 2. 시청 권한 최적화 (Two-track Caching)
- **Problem**: 스와이프 시마다 `/api/user/coinpay`를 동기적으로 기다려 1~2초 딜레이 발생.
- **Solution**: 
    1. `useUserAuth`에서 `mscoin`과 `purchasedVideoIds`(소장목록)를 함께 로드.
    2. `PlayPermissionCheck`에서 소장목록 확인 시 0초 즉시 재생.
    3. 미구매 영상이나 코인 보유 시, **Optimistic UI**로 로컬 캐시(QueryData)를 먼저 차감하고 서버 통신은 비동기로 처리하여 딜레이 제거.

### 3. 글로벌 성인인증 (Self-Declaration)
- **UI**: Framer Motion을 사용한 모바일 친화적 바텀시트 모달(`AgeVerificationModal.tsx`) 구현.
- **Logic**: 생년월일 입력 및 만 18세 이상 확인 체크. 성공 시 `/api/user/verify-age` 호출 및 `userAuth` 캐시 갱신.

### 4. TypeScript 에러 및 MCP 경고 해결 (2026-05-14)
- **MCP 에러**: `~/.gemini/antigravity/mcp_config.json`의 잘못된 MCP 서버 설정(Vercel, Cloudflare CLI 등)으로 인한 에디터 경고를 설정 초기화하여 해결.
- **TypeScript 에러 해결 (약 97개)**:
    - **Next.js 15 Route Handlers**: API 라우트의 `params` 타입이 Promise로 변경됨에 따라, `await context.params` 방식으로 15여 개 라우트 파일 일괄 업데이트.
    - **Prisma Schema 동기화**: `FullScreenVideo.tsx` 등에서 삭제된 `Media` 객체와 `url` 속성 참조 에러를 `filename`으로 수정.
    - **경로 의존성 복구**: `(main)`이 `[locale]/(main)`으로 이동하면서 깨진 컴포넌트 import(`@/app/(main)/...`)들을 현재 구조에 맞게 복구.
    - **미사용 워커 라우트 잔재 제거**: `agency`, `auth`, `referral-structure` 등의 잔여 빈 API 라우트 폴더를 삭제하고 `.next` 캐시 초기화하여 유령 모듈 참조 에러 제거.
- **현재 상태**: `tsc --noEmit` 통과 (에러 0건). 로컬 개발 서버 정상 동작 가능 상태 진입.
