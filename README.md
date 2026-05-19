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
