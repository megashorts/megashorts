// import { useSession } from "@/app/(main)/SessionProvider";
// import { useToast } from "@/components/ui/use-toast";
// import { PostsPage } from "@/lib/types";
// import {
//   InfiniteData,
//   QueryFilters,
//   useMutation,
//   useQueryClient,
// } from "@tanstack/react-query";
// import { submitPost } from "./actions";

// // 이 파일은 사용자가 작성한 포스트(게시물)를 제출하는 비동기 작업을 처리하기 위해 React Query 라이브러리를 활용한 뮤테이션(mutation)을 정의한 파일입니다. 
// // 게시물 작성 후 성공 시에는 관련 데이터(포스트 피드)를 업데이트하고, 실패 시에는 에러 메시지를 표시하는 기능

// // React Query: 서버 상태 관리를 위한 라이브러리로, 서버에서 데이터를 가져오거나 변경하는 작업을 훅(Hook)으로 제공
// // predicate: 필터링 조건을 정의하는 함수로, 쿼리가 어떤 조건을 만족하는지에 따라 필터링을 진행

// export function useSubmitPostMutation() { // 게시물 제출을 처리하는 커스텀 훅 정의
//   const { toast } = useToast(); // 우측 하단 알림 기능을 사용할 수 있도록 훅 호출
//   const queryClient = useQueryClient(); // 쿼리 관련 데이터를 관리하는 객체 호출
//   const { user } = useSession(); // 현재 로그인한 사용자 정보 가져오기

//   const mutation = useMutation({
//     mutationFn: submitPost, // 게시물을 제출하는 함수 지정
//     onSuccess: async (newPost) => { // 게시물이 성공적으로 제출된 후 실행될 함수
//       const queryFilter = { // 업데이트할 쿼리를 필터링하는 객체
//         queryKey: ["post-feed"], // "post-feed" 키를 가진 쿼리를 대상으로 필터링
//         predicate(query) { // 조건에 맞는 쿼리를 찾아내는 함수
//           return (
//             query.queryKey.includes("for-you") || // 쿼리 키에 "for-you"가 포함되어 있거나
//             (query.queryKey.includes("user-posts") && // "user-posts"가 포함되고, 사용자 ID가 맞는 경우
//              user?.id ? query.queryKey.includes(user.id) : false) // query.queryKey.includes(user.id)) & user가 null일 경우 false를 반환
//           );
//         },
//       } satisfies QueryFilters; // 필터가 QueryFilters 타입을 만족해야 함

//       await queryClient.cancelQueries(queryFilter); // 해당 쿼리가 로드 중이라면 취소

//       queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>( // 쿼리 데이터 업데이트
//         queryFilter, 
//         (oldData) => { // 기존 데이터에 새로운 게시물 추가
//           const firstPage = oldData?.pages[0]; // 첫 번째 페이지 데이터 가져오기
//           if (firstPage) {
//             return {
//               pageParams: oldData.pageParams, // 기존 페이지 매개변수 유지
//               pages: [ // 첫 번째 페이지에 새로운 게시물 추가
//                 {
//                   posts: [newPost, ...firstPage.posts],
//                   nextCursor: firstPage.nextCursor,
//                 },
//                 ...oldData.pages.slice(1), // 나머지 페이지는 그대로 유지
//               ],
//             };
//           }
//         },
//       );

//       queryClient.invalidateQueries({ // 쿼리 무효화해서 서버에서 새로운 데이터 가져오도록
//         queryKey: queryFilter.queryKey,
//         predicate(query) { // 조건에 맞는 쿼리만 무효화
//           return queryFilter.predicate(query) && !query.state.data;
//         },
//       });

//       toast({ // 성공 알림 띄우기
//         description: "Post created",
//       });
//     },
//     onError(error) { // 제출 실패 시 실행될 함수
//       console.error(error); // 콘솔에 에러 출력
//       toast({ // 실패 알림 띄우기
//         variant: "destructive",
//         description: "Failed to post. Please try again.",
//       });
//     },
//   });

//   return mutation; // 뮤테이션 반환
// }

