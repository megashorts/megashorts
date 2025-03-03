# QR 코드 기능 설치 안내

추천인 링크 기능에서 QR 코드를 표시하기 위해 `qrcode.react` 패키지를 설치해야 합니다.

## 설치 방법

터미널에서 다음 명령어를 실행하여 패키지를 설치하세요:

```bash
npm install qrcode.react
```

또는 yarn을 사용하는 경우:

```bash
yarn add qrcode.react
```

## 기능 설명

`qrcode.react` 패키지는 React 애플리케이션에서 QR 코드를 쉽게 생성할 수 있게 해주는 라이브러리입니다. 이 패키지를 사용하면 다음과 같은 이점이 있습니다:

1. 간단한 API로 QR 코드 생성
2. 크기, 색상, 오류 수정 레벨 등 다양한 사용자 정의 옵션
3. React 컴포넌트로 쉽게 통합

## 사용 방법

패키지가 설치되면 `ReferralLinkModal.tsx` 파일에서 자동으로 QR 코드 기능이 활성화됩니다. 추가 설정이 필요하지 않습니다.

## 문제 해결

패키지 설치 후에도 TypeScript 오류가 발생하는 경우, 타입 정의를 추가로 설치해야 할 수 있습니다:

```bash
npm install --save-dev @types/qrcode.react
```

또는 yarn을 사용하는 경우:

```bash
yarn add --dev @types/qrcode.react
