# Next.js 15 소셜 미디어 앱

무한 스크롤, 낙관적 업데이트, 인증, DM, 알림, 파일 업로드 등을 포함한 풀스택 소셜 미디어 플랫폼입니다.

튜토리얼: https://www.youtube.com/watch?v=TyV12oBDsYI

![thumbnail 7](https://github.com/user-attachments/assets/686b37e4-3d16-4bc4-a7f2-9d152c3addf5)

배포 URL: https://megashorts.vercel.app/

## 설치

```bash
npm i --legacy-peer-deps
```

## 플랫폼 보안 업데이트 (2026-05-19)

- 배포 대상: Vercel
- Next.js 업그레이드: `15.1.6` -> `15.5.18` (15.x 보안 패치 라인)
- 패키지 파일 반영:
  - `package.json` -> `next: 15.5.18`
  - `package-lock.json` 잠금 정보 재생성
- Next 설정 호환성 정리:
  - `next.config.mjs`에서 deprecated 옵션 `experimental.turbo.enabled` 제거

### 실행한 검증 절차

1. `npm ls next --depth=0`
   - 결과: `next@15.5.18`
2. `npm run prisma:generate`
   - 결과: 성공
3. `npm run build`
   - 결과: 성공 (exit code 0)
4. `npm run lint`
   - 결과: 성공 (exit code 0, warning만 존재)
5. `npm run start -- -p 3100`
   - 결과: 서버 기동 성공 (`Ready`)

### 빌드/린트 경고 상태

- 기존 경고(React hooks dependency, `<img>` 사용 관련 경고)는 유지됩니다.
- Next.js 업그레이드로 인한 신규 차단 오류는 확인되지 않았습니다.

### 검증 한계

- 현재 CLI 환경에서는 로그인/결제/업로드/관리자/다국어 등 전체 사용자 플로우를 완전 E2E로 자동 검증할 수 없습니다.
- 빌드 중 일부 Prisma 정적 파라미터 조회에서 DB 연결 경고 로그가 출력되지만, 빌드는 최종 성공합니다.
- `npm audit`는 현재 실행 환경 정책(외부 메타데이터 전송 제한)으로 실행되지 않았습니다.

## 다국어 콘텐츠 정책 업데이트 (2026-05-19)

### 기본 정책

- 기본값은 `전체 노출 + 선택 언어 우선 표시`입니다.
- 포스트 제목, 포스트 소개, 추천 영상 제목, 상세 페이지 제목/소개, 카드/슬라이더/모달 표시 텍스트는 현재 선택 언어를 먼저 사용합니다.
- 선택 언어 번역이 없으면 영어 번역을 사용하고, 영어 번역도 없으면 원문 필드(`title`, `content`)를 사용합니다.
- 영상 자막은 현재 선택 언어 자막을 우선 선택하고, 없으면 영어 자막을 fallback으로 선택합니다.

### 관리자 설정

- 위치: `/admin/system`
- 항목: `콘텐츠 언어 노출 정책`
- 선택값:
  - `전체 노출 + 선택 언어 우선 표시`: 모든 콘텐츠를 보여주고 언어별 텍스트/자막 fallback을 적용합니다.
  - `선택 언어 지원 콘텐츠만 노출`: 현재 선택 언어가 포스트 원본 언어이거나 영상 자막 지원 목록에 포함된 콘텐츠만 목록에 노출합니다.

### 적용 범위

- 랜딩 페이지 메인 슬라이더
- 추천 영상 페이지와 추천 영상 API
- 카테고리/최신/복합 카테고리 페이지와 무한 스크롤 API
- 포스트 카드, 포스트 그리드, 포스트 모달
- 추천/상세 영상 재생 화면의 제목과 자막 선택
- 포스트 상세 페이지의 제목, 소개, 메타데이터

### 검증 결과

1. `npm run lint`
   - 결과: 성공
   - 참고: 기존 React hooks dependency 및 `<img>` 관련 warning은 유지됩니다.
2. `npx tsc --noEmit`
   - 결과: 성공
3. `npm run build`
   - 결과: 성공
   - 참고: 현재 로컬 환경에서 Supabase DB 연결이 되지 않아 일부 `generateStaticParams` 단계에서 Prisma 연결 경고가 출력되지만, 해당 경고는 catch 처리되어 빌드 차단 오류로 이어지지 않았습니다.

### 운영 주의사항

- `선택 언어 지원 콘텐츠만 노출` 정책은 콘텐츠 수가 적은 언어에서 목록이 비어 보일 수 있으므로 기본값으로 권장하지 않습니다.
- 관리자 설정 저장 시 기존 `/api/admin/settings` 저장 구조를 그대로 사용하므로 별도 Prisma 마이그레이션은 필요하지 않습니다.
- Vercel Preview/Production에서 실제 DB 연결이 정상인 상태로 배포 빌드를 다시 확인해야 정적 파라미터 경고 여부를 최종 판단할 수 있습니다.
