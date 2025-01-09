// // src/components/posts/editor/PostEditor.tsx

// "use client"; // 클라이언트 사이드에서만 렌더링하는 컴포넌트임을 나타냅니다.

// import { useSession } from "@/app/(main)/SessionProvider"; // 현재 로그인된 사용자의 세션을 가져오는 훅입니다.
// import LoadingButton from "@/components/LoadingButton"; // 로딩 상태를 지원하는 버튼 컴포넌트입니다.
// import { Button } from "@/components/ui/button"; // 기본 버튼 컴포넌트입니다.
// import UserAvatar from "@/components/UserAvatar"; // 사용자 아바타 컴포넌트입니다.
// import { cn } from "@/lib/utils"; // 클래스 이름을 조건에 따라 조합해주는 유틸리티 함수입니다.
// import Placeholder from "@tiptap/extension-placeholder"; // 에디터에 placeholder를 넣기 위한 플러그인입니다.
// import { EditorContent, useEditor } from "@tiptap/react"; // 텍스트 에디터를 사용하는 라이브러리입니다.
// import StarterKit from "@tiptap/starter-kit"; // 텍스트 에디터의 기본 기능을 제공하는 확장 모듈입니다.
// import { useDropzone } from "@uploadthing/react"; // 파일 드래그 앤 드롭을 처리하는 훅입니다.
// import { ImageIcon, Loader2, X } from "lucide-react"; // 이미지 아이콘, 로딩 아이콘, X 버튼 아이콘입니다.
// import Image from "next/image"; // Next.js에서 최적화된 이미지 처리를 위한 컴포넌트입니다.
// import { ClipboardEvent, useRef } from "react"; // 클립보드 이벤트와 참조 훅입니다.
// import { useSubmitPostMutation } from "./mutations"; // 포스트 제출을 처리하는 GraphQL mutation 훅입니다.
// import "./styles.css"; // 이 컴포넌트에 필요한 CSS 파일입니다.
// import useMediaUpload, { Attachment } from "./useMediaUpload"; // 미디어 업로드 로직을 포함한 커스텀 훅입니다.

// // PostEditor 컴포넌트는 포스트를 작성하는 에디터입니다.
// export default function PostEditor() {
//   const { user } = useSession(); // 현재 로그인된 사용자의 정보를 가져옵니다.

//   const mutation = useSubmitPostMutation(); // 포스트를 서버에 제출하는 mutation을 사용합니다.

//   // 미디어 파일(이미지/비디오)을 업로드할 때 사용하는 커스텀 훅입니다.
//   const {
//     startUpload, // 업로드 시작 함수
//     attachments, // 업로드된 파일 목록
//     isUploading, // 업로드 중인지 여부
//     uploadProgress, // 업로드 진행 상태
//     removeAttachment, // 파일 제거 함수
//     reset: resetMediaUploads, // 업로드 상태를 초기화하는 함수
//   } = useMediaUpload();

//   // 파일 드래그 앤 드롭을 처리하는 훅입니다.
//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop: startUpload, // 드롭된 파일을 업로드 시작합니다.
//   });

//   const { onClick, ...rootProps } = getRootProps(); // 드래그 앤 드롭 영역의 속성을 가져옵니다.

//   // TipTap 에디터를 설정합니다.
//   const editor = useEditor({
//     extensions: [
//       StarterKit.configure({
//         bold: false, // 굵은 글씨 비활성화
//         italic: false, // 기울임 글씨 비활성화
//       }),
//       Placeholder.configure({
//         placeholder: "무엇을 기록하시겠어요?", // 입력 전 나타나는 힌트 텍스트입니다.
//       }),
//     ],
//   });

//   // 에디터 내용 가져오기
//   const input = editor?.getText({ blockSeparator: "\n" }) || ""; // 에디터 내용을 문자열로 가져옵니다.

//   // 포스트 제출 시 호출되는 함수
//   function onSubmit() {
//     mutation.mutate(
//       {
//         content: input, // 포스트 내용
//         //mediaIds: attachments.map((a) => a.mediaId).filter(Boolean) as string[], // 업로드된 파일의 ID 목록
//       },
//       {
//         onSuccess: () => {
//           editor?.commands.clearContent(); // 포스트 제출 성공 시 에디터 내용 비우기
//           resetMediaUploads(); // 미디어 업로드 상태 초기화
//         },
//       },
//     );
//   }

//   // 클립보드에서 파일을 붙여넣을 때 호출되는 함수
//   function onPaste(e: ClipboardEvent<HTMLInputElement>) {
//     const files = Array.from(e.clipboardData.items) // 클립보드의 아이템을 배열로 변환
//       .filter((item) => item.kind === "file") // 파일만 필터링
//       .map((item) => item.getAsFile()) as File[]; // 파일로 변환하여 배열에 추가
//     startUpload(files); // 파일 업로드 시작
//   }

//   return (
//     <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
//       {/* 에디터 상단: 사용자 아바타 및 입력 창 */}
//       <div className="flex gap-5">
//         {user ? ( // 사용자가 로그인되어 있는지 확인합니다.
//           <UserAvatar avatarUrl={user.avatarUrl} className="hidden sm:inline" /> // 사용자 아바타 출력
//         ) : (
//           // 로그인되지 않은 경우 기본 아이콘 출력
//           <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full">
//             <ImageIcon size={20} className="text-gray-500" /> {/* 기본 이미지 아이콘 */}
//           </div>
//         )}

//         {/* 텍스트 에디터 */}
//         <div {...rootProps} className="w-full">
//           <EditorContent
//             editor={editor} // TipTap 에디터 인스턴스
//             className={cn(
//               "max-h-[20rem] w-full overflow-y-auto rounded-2xl bg-background px-5 py-3", // 에디터 스타일
//               isDragActive && "outline-dashed", // 드래그 중일 때 테두리 스타일 변경
//             )}
//             onPaste={onPaste} // 붙여넣기 이벤트 처리
//           />
//           <input {...getInputProps()} /> {/* 파일 업로드 입력 */}
//         </div>
//       </div>

//       {/* 업로드된 파일 미리보기 */}
//       {!!attachments.length && (
//         <AttachmentPreviews
//           attachments={attachments}
//           removeAttachment={removeAttachment}
//         />
//       )}

//       {/* 제출 버튼 및 업로드 상태 */}
//       <div className="flex items-center justify-end gap-3">
//         {isUploading && ( // 업로드 중일 때 로딩 아이콘 표시
//           <>
//             <span className="text-sm">{uploadProgress ?? 0}%</span> {/* 업로드 진행률 표시 */}
//             <Loader2 className="size-5 animate-spin text-primary" /> {/* 로딩 아이콘 */}
//           </>
//         )}
//         {/* 파일 업로드 버튼 */}
//         <AddAttachmentsButton
//           onFilesSelected={startUpload} // 파일 선택 시 업로드 함수 호출
//           disabled={isUploading || attachments.length >= 5} // 최대 5개까지 파일 업로드 가능
//         />
//         {/* 포스트 제출 버튼 */}
//         <LoadingButton
//           onClick={onSubmit} // 제출 버튼 클릭 시 호출
//           loading={mutation.isPending} // 제출 중일 때 로딩 상태 표시
//           disabled={!input.trim() || isUploading} // 입력이 없거나 업로드 중이면 비활성화
//           className="min-w-20" // 버튼 최소 너비
//         >
//           Post {/* 버튼 텍스트 */}
//         </LoadingButton>
//       </div>
//     </div>
//   );
// }

// // 파일 업로드 버튼 컴포넌트
// interface AddAttachmentsButtonProps {
//   onFilesSelected: (files: File[]) => void; // 파일 선택 시 호출되는 함수
//   disabled: boolean; // 버튼 비활성화 여부
// }

// function AddAttachmentsButton({
//   onFilesSelected,
//   disabled,
// }: AddAttachmentsButtonProps) {
//   const fileInputRef = useRef<HTMLInputElement>(null); // 파일 입력 필드에 대한 참조

//   return (
//     <>
//       <Button
//         variant="ghost"
//         size="icon"
//         className="text-primary hover:text-primary"
//         disabled={disabled} // 비활성화 상태면 클릭 불가능
//         onClick={() => fileInputRef.current?.click()} // 버튼 클릭 시 파일 입력 필드를 클릭
//       >
//         <ImageIcon size={20} /> {/* 이미지 아이콘 */}
//       </Button>
//       <input
//         type="file"
//         accept="image/*, video/*" // 이미지 및 비디오 파일만 허용
//         multiple // 여러 파일 선택 가능
//         ref={fileInputRef} // 참조 설정
//         className="sr-only hidden" // 화면에 표시되지 않음
//         onChange={(e) => {
//           const files = Array.from(e.target.files || []); // 선택한 파일 배열로 가져오기
//           if (files.length) {
//             onFilesSelected(files); // 파일이 선택되면 처리 함수 호출
//             e.target.value = ""; // 파일 입력 필드 초기화
//           }
//         }}
//       />
//     </>
//   );
// }

// // AttachmentPreviewProps 인터페이스는 AttachmentPreview 컴포넌트에 필요한 props의 타입을 정의합니다.
// interface AttachmentPreviewsProps {
//   attachments: Attachment[]; // 첨부 파일 배열
//   removeAttachment: (fileName: string) => void; // 첨부 파일 제거 함수
// }

// function AttachmentPreviews({
//   attachments,
//   removeAttachment,
// }: AttachmentPreviewsProps) {
//   return (
//     <div
//       className={cn(
//         "flex flex-col gap-3", // 기본 스타일
//         attachments.length > 1 && "sm:grid sm:grid-cols-2", // 첨부 파일이 2개 이상일 때 그리드 레이아웃
//       )}
//     >
//       {attachments.map((attachment) => (
//         <AttachmentPreview
//           key={attachment.file.name} // 고유 키
//           attachment={attachment} // 첨부 파일 정보
//           onRemoveClick={() => removeAttachment(attachment.file.name)} // 제거 클릭 시 호출되는 함수
//         />
//       ))}
//     </div>
//   );
// }

// interface AttachmentPreviewProps {
//   attachment: Attachment; // 첨부 파일 정보
//   onRemoveClick: () => void; // 제거 클릭 시 호출되는 함수
// }

// function AttachmentPreview({
//   attachment: { file, mediaId, isUploading }, // 파일 정보
//   onRemoveClick,
// }: AttachmentPreviewProps) {
//   const src = URL.createObjectURL(file); // 파일 URL 생성

//   return (
//     <div
//       className={cn("relative mx-auto size-fit", isUploading && "opacity-50")} // 스타일 설정
//     >
//       {file.type.startsWith("image") ? (
//         <Image
//           src={src} // 이미지 URL
//           alt="Attachment preview" // 이미지 설명
//           width={500} // 너비
//           height={500} // 높이
//           className="size-fit max-h-[30rem] rounded-2xl" // 스타일 설정
//         />
//       ) : (
//         <video controls className="size-fit max-h-[30rem] rounded-2xl"> {/* 비디오 표시 */}
//           <source src={src} type={file.type} /> {/* 비디오 소스 */}
//         </video>
//       )}
//       <button
//         type="button" // 버튼 타입 설정
//         className="absolute right-2 top-2 rounded-full p-2 hover:bg-muted" // 버튼 스타일 설정
//         onClick={onRemoveClick} // 클릭 시 제거 클릭 함수 호출
//       >
//         <X size={15} /> {/* 제거 아이콘 */}
//       </button>
//     </div>
//   );
// }