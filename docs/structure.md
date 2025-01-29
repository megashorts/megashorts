### API folder 추천

src/app/api/
├── auth/                    # 인증 관련
├── posts/                   # 포스트 관련
│   ├── route.ts            # 포스트 CRUD (추가 필요)
│   ├── [postId]/           # 개별 포스트
│   │   ├── route.ts        # 포스트 상세
│   │   ├── bookmark/       # 북마크
│   │   ├── comments/       # 댓글
│   │   └── likes/          # 좋아요
│   ├── bookmarked/         # 북마크된 포스트
│   ├── following/          # 팔로잉 포스트
│   ├── for-you/            # 추천 포스트
│   └── recommended/        # 추천 포스트
├── media/                   # 미디어 관련 (새로 생성)
│   ├── images/             # 이미지
│   │   └── route.ts        # 이미지 업로드
│   └── videos/             # 비디오
│       ├── route.ts        # 비디오 CRUD
│       ├── upload/         # 비디오 업로드
│       │   └── route.ts    # 업로드 처리
│       ├── delete/         # 비디오 삭제
│       │   └── route.ts    # 삭제 처리
│       └── subtitles/      # 자막
│           ├── route.ts    # 자막 CRUD
│           └── delete/     # 자막 삭제
│               └── route.ts
└── users/                  # 사용자 관련




## useUploader.ts는 매우 중요한 파일입니다!

useUploader 훅의 역할:
uploadVideo: 비디오 파일 업로드 (/api/upload/video)
업로드 진행률 표시
XMLHttpRequest 사용하여 진행상태 추적
uploadImage: 이미지 파일 업로드 (/api/upload/image)
uploadSubtitle: 자막 파일 업로드 (/api/upload/subtitle)
사용되는 곳:
PostEditor.tsx에서 thumbnailUrl 업로드할 때 uploadImage 사용
VideoUploader.tsx에서 비디오와 자막 업로드할 때 uploadVideo, uploadSubtitle 사용


## src/app/api/upload/video/route.ts
비디오 파일 업로드 처리
Cloudflare Stream에 업로드
크리에이터 정보 업데이트
HLS URL 반환

src/app/api/videos/route.ts
비디오 정보 조회 (GET)
비디오 순서 업데이트 (PATCH)
비디오 조회수 기록 (POST)


## 현재 이미지 업로드 프로세스와 URL 처리 방식, 그리고 수정 방법을 설명해드리겠습니다:

현재 프로젝트의 이미지 업로드 프로세스:
ImageUploader 컴포넌트에서 이미지를 선택하고 크롭하면 PostEditor에서 이미지 파일을 보관
최종 저장 버튼 클릭 시 handleSave 함수에서 uploadImage를 통해 이미지를 업로드
업로드된 이미지 URL을 받아서 submitPost 함수를 통해 데이터베이스에 저장
Cloudflare 이미지 URL 처리:
이미지 업로드 처리는 src/app/api/upload/image/route.ts에서 이루어짐
현재는 result.result.variants[0]를 반환하여 public 버전 URL을 사용 중
URL 구조:
원본: https://imagedelivery.net/[계정ID]/[이미지ID]/public
썸네일: https://imagedelivery.net/[계정ID]/[이미지ID]/thumbnail
썸네일 URL로 변경하기 위한 수정 방법:
방법 1) API 응답에서 썸네일 URL 반환:

수정할 파일: src/app/api/upload/image/route.ts
수정할 부분: Response.json 부분에서 variants[0] 대신 썸네일 URL 반환
return Response.json({
  url: `${result.result.variants[0].replace('/public', '/thumbnail')}`,
  id: result.result.id,
});
방법 2) URL 패턴 사용:

수정할 파일: src/lib/types.ts 또는 관련 유틸리티 파일
이미지 ID를 추출하고 원하는 변형(public/thumbnail)을 조합하는 유틸리티 함수 생성
export function getImageUrl(imageId: string, variant: 'public' | 'thumbnail' = 'public') {
  return `https://imagedelivery.net/wuhPilUNWOdMaNWjMYkZJg/${imageId}/${variant}`;
}

## 포스트 폴더의 뮤테이션 파일
src/components/posts/mutations.ts:
useDeletePostMutation (포스트 삭제)

src/components/posts/editor/mutations.ts:
useSubmitPostMutation (포스트 생성, 서버 액션 사용)
PostEditor.tsx에서 사용 중

## 포스트 뮤테이션 파일의 캐시관련 구문

setQueriesData: 낙관적 업데이트
캐시를 직접 업데이트
즉시 UI 반영
네트워크 요청 없음
메모리상의 데이터만 변경

invalidateQueries:
캐시를 무효화하고 서버에서 새로 데이터 가져옴
다른 사용자의 변경사항도 반영 가능
네트워크 요청 발생
실제 DB 상태와 동기화
현재 코드에서 두 작업이 순차적으로 있는 이유:

setQueriesData로 즉시 UI 업데이트 (좋은 UX)
invalidateQueries로 다른 변경사항도 동기화 (데이터 정확성)

# Linkify

import Linkify from "@/components/Linkify";
Linkify는 포스트를 보여주는 시점에서만 사용해야 합니다.

@username → 사용자 프로필 링크
https://example.com → 클릭 가능한 URL
#해시태그 → 해시태그 검색 링크

## css 여백관리 문법
gap-*: 요소 간 간격 (Flex/Grid 컨테이너).
p-*: 내부 간격 (패딩).
m-*: 외부 간격 (마진).
mx-*, my-*: 축별 간격.
mt-*, mb-*, ml-*, mr-*: 방향별 간격.

반응형으로 구현하는 방법:
브레이크포인트 사용 (sm, md, lg, xl 등).
브레이크포인트에 따라 클래스 추가 (sm:mt-5, md:gap-8 등).

@ 넥스트의 이미지 사이즈 삽입
sizes="(max-width: [작은화면크기]) [이미지너비], (max-width: [중간화면크기]) [이미지너비], [기본값]"
sizes="(max-width: 600px) 100vw, (max-width: 1024px) 75vw, 50vw"

## 사용자 비디오 시청여부

사용자가 특정 비디오를 봤는지 확인하려면, 다음과 같이 VideoView 테이블에서 userId와 videoId로 조회합니다:

const hasViewed = await prisma.videoView.findFirst({
  where: {
    userId: "사용자_ID",
    videoId: "비디오_ID",
  },
});

if (hasViewed) {
  // 이미 본 비디오
} else {
  // 보지 않은 비디오
}

추천 알고리즘 및 맞춤 재생목록 : 사용자가 본 비디오를 기록하여, 추천 알고리즘에 반영할 수 있습니다. VideoView 테이블에 인덱스를 추가했기 때문에 사용자가 본 비디오 목록을 빠르게 조회하고, 이에 기반한 추천을 제공할 수 있습니다.

## validation 파일

Zod라는 JavaScript/TypeScript 라이브러리를 사용하여 데이터 유효성을 검증(Validation)하는 스키마를 정의

1) const requiredString = z.string().trim().min(1, "Required");
이메일, 사용자 이름, 비밀번호 같은 입력 필드에 requiredString을 사용하여 필수 입력값임을 명시
필드마다 반복적으로 z.string().trim().min(1)을 설정하지 않도록 재사용 가능한 규칙으로 정의
z.string() : 입력값이 문자열인지 확인.
.trim() : 문자열 양 끝의 공백 제거.
.min(1, "Required") : 최소 1자 이상이어야 한다는 조건.

2) signUpSchema와 같은 상세 유효성 검증 스키마
export const signUpSchema = z.object({
  email: requiredString.email("Invalid email address"),
  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Only letters, numbers, - and _ allowed",
  ),
  password: requiredString.min(8, "Must be at least 8 characters"),
  confirmPassword: requiredString.min(8, "Must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"], // 에러를 표시할 필드
  });

z.object() : 객체 형태의 데이터 스키마를 정의.
.email("Invalid email address") : 이메일 형식인지 확인. 이메일 형식을 강제.
.regex(정규식, "에러 메시지") : 입력값이 정규식 패턴에 맞는지 확인. 정규식을 사용하여 특정 문자만 허용.
.min(8, "에러 메시지") : 최소 문자 수 제한. 보안상 최소 8자 이상으로 제한.
refine은 스키마의 모든 필드를 조합하여 특정 조건을 추가로 검증할 때 사용

3) SignUpValues와 같은 TypeScript 타입 추론
export type SignUpValues = z.infer<typeof signUpSchema>;
예: 폼 데이터를 처리하는 함수에서 SignUpValues를 타입으로 지정
z.infer<typeof 스키마> : Zod 스키마를 기반으로 타입 추론
export type : 외부 파일에서도 타입을 재사용 가능하도록 설정.

## DB migration

Prisma 스키마를 기존 데이터를 유지하면서 데이터베이스에 적용하기 위해서는 마이그레이션 작업이 필요합니다. 다음과 같은 순서로 진행할 수 있습니다:

먼저 마이그레이션 파일을 생성합니다:

npx prisma migrate dev --name [마이그레이션_이름]

생성된 마이그레이션 파일을 확인합니다. prisma/migrations 폴더에서 새로 생성된 SQL 파일을 검토하여 의도한 대로 변경사항이 반영되었는지 확인하세요.
프로덕션 환경의 Vercel PostgreSQL 데이터베이스에 마이그레이션을 적용합니다:

npx prisma migrate deploy

마이그레이션 전에 항상 데이터베이스 백업을 해두는 것이 안전합니다
migrate deploy 명령어는 pending 상태의 마이그레이션만 실행하므로 기존 데이터는 보존됩니다

## api 반환값 로그로 찍어보기

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', responseText);

## 루시안 세션 인증

세션 프로바이더로 감싸고 useSession 훅을 사용하여 인증 정보를 가져오는 방식은 여전히 서버 측 세션 관리를 기반으로 하기 때문에 보안 측면에서 동일한 장점을 유지합니다.

세션 프로바이더:

세션 프로바이더는 기본적으로 Lucia 세션을 서버 측에서 관리하고, 세션 정보를 클라이언트로 전달하는 역할을 합니다. 클라이언트는 이 정보를 useSession을 통해 쉽게 사용할 수 있습니다.
이 과정에서 클라이언트가 사용하는 것은 세션 ID이며, 세션 ID는 주로 httpOnly 쿠키에 저장됩니다. httpOnly 속성 덕분에, 클라이언트 측 자바스크립트에서 세션 정보를 직접 접근할 수 없고, XSS 공격으로부터 보호됩니다.
useSession 훅**:

useSession 훅을 사용하면 클라이언트에서 현재 로그인된 사용자의 세션 정보를 쉽게 가져올 수 있습니다. 이 정보는 기본적으로 서버 측 세션에서 가져오므로, 사용자의 인증 정보가 클라이언트 측에 직접 노출되지 않습니다.
useSession 훅은 세션 ID를 기반으로 서버에서 세션 정보를 조회하고 이를 클라이언트에 전달하기 때문에, 보안상 안전합니다.
세션 관리:

세션의 만료와 갱신은 모두 서버에서 관리되며, 클라이언트에서는 세션 ID만을 httpOnly 쿠키로 저장하여 자동으로 서버와 통신합니다.
따라서 세션이 만료되거나 갱신될 때도 클라이언트는 그 과정을 알지 못하며, 서버가 이를 관리하고 처리합니다.
요약:
세션 프로바이더로 감싸고 useSession을 사용하여 사용자 인증 정보를 가져오는 방식은 Lucia 세션의 서버 측 세션 관리 방식을 따르고 있기 때문에, 보안상 안전합니다.
XSS 공격에 대한 위험이 없고, 세션 정보는 클라이언트 측에 직접 저장되지 않으므로 보안상의 문제는 발생하지 않습니다.
세션 ID만 httpOnly 쿠키로 저장되고, 세션 데이터는 서버 측에서 안전하게 관리되므로 보안이 유지됩니다.

## 탄스택쿼리 캐시무효화가 필요한 경우 

캐시 무효화가 필요한 페이지에서: useUserAuth.ts 사용자의 성인인증과 구독 상태를 함께 조회하는 hook 
auth/route.ts 성인인증과 구독 정보를 함께 제공하는 탄스택쿼리 캐시용 API
사용은 아래와 같이

// src/app/(main)/subscription/page.tsx 또는 성인인증 페이지
import { useQueryClient } from '@tanstack/react-query';
import { USER_INFO_QUERY_KEY } from '@/hooks/queries/useUserInfo';

// 구독/성인인증 상태 변경 후
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: USER_INFO_QUERY_KEY });

---------------
구독 상태가 변경되는 서버 API에서 비슷한 서버 캐시를 무효화: view/router.ts

// src/app/api/subscription/[action]/route.ts 등
import { revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  // 구독 상태 변경 처리 후
  revalidateTag('subscription');
}


## 서버액션과 라우터 구현 비교

@ Server Actions 사용이 좋은 경우. - 자동 최적화 (Next.js가 자동으로 처리), 불필요한 클라이언트-서버 통신 최소화
1_ 폼 제출 처리

비밀번호 재설정
회원가입/로그인
간단한 데이터 수정

2_ 페이지에 종속된 동작
특정 페이지의 데이터 수정
UI와 밀접한 상호작용

@ API 라우트 사용이 좋은 경우
1_ 외부 서비스 연동
결제 웹훅
OAuth 콜백
외부 API 연동

2_ 복잡한 데이터 처리
파일 업로드
스트리밍 데이터
실시간 데이터 처리