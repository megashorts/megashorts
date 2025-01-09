// "use client";

// import { useSession } from "../../../app/(main)/SessionProvider";
// import LoadingButton from "../../../components/LoadingButton";
// import { Button } from "../../../components/ui/button";
// import UserAvatar from "../../../components/UserAvatar";
// import { cn } from "../../../lib/utils";
// import Placeholder from "@tiptap/extension-placeholder";
// import { EditorContent, useEditor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import { useDropzone } from "@uploadthing/react";
// import { ImageIcon, Loader2, X } from "lucide-react";
// import Image from "next/image";
// import { ClipboardEvent, useRef, useState } from "react";
// import { useSubmitPostMutation } from "./mutations";
// import "./styles.css";
// import useMediaUpload, { Attachment } from "./useMediaUpload";
// import { Input } from "../../../components/ui/input";
// import { Label } from "../../../components/ui/label";

// export default function PostEditor2() {
//   const { user } = useSession();
//   const mutation = useSubmitPostMutation();
//   const [title, setTitle] = useState("");
//   const [thumbnailUrl, setThumbnailUrl] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("");

//   const {
//     startUpload,
//     attachments,
//     isUploading,
//     uploadProgress,
//     removeAttachment,
//     reset: resetMediaUploads,
//   } = useMediaUpload();

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop: startUpload,
//   });

//   const { onClick, ...rootProps } = getRootProps();

//   const editor = useEditor({
//     extensions: [
//       StarterKit.configure({
//         bold: false,
//         italic: false,
//       }),
//       Placeholder.configure({
//         placeholder: "내용을 입력하세요",
//       }),
//     ],
//   });

//   const content = editor?.getText({ blockSeparator: "\n" }) || "";

//   // 이미지가 업로드되면 자동으로 첫 번째 이미지를 썸네일로 설정
//   const updateThumbnail = (newAttachments: Attachment[]) => {
//     const firstImage = newAttachments.find(att => att.file.type.startsWith('image/'));
//     if (firstImage) {
//       setThumbnailUrl(URL.createObjectURL(firstImage.file));
//     }
//   };

//   // 파일 업로드 핸들러 수정
//   const handleFileUpload = async (files: File[]) => {
//     await startUpload(files);
//     if (attachments.length === 0) {
//       const imageFile = files.find(file => file.type.startsWith('image/'));
//       if (imageFile) {
//         setThumbnailUrl(URL.createObjectURL(imageFile));
//       }
//     }
//   };

//   function onSubmit(isDraft: boolean = false) {
//     // 첫 번째 이미지 첨부파일을 썸네일로 사용
//     const firstImageAttachment = attachments.find(att => att.file.type.startsWith('image/'));
//     const finalThumbnailUrl = firstImageAttachment ? URL.createObjectURL(firstImageAttachment.file) : '';

//     mutation.mutate(
//       {
//         title,
//         content,
//         thumbnailUrl: finalThumbnailUrl,
//         mediaIds: attachments.map((a) => a.mediaId).filter(Boolean) as string[],
//         status: isDraft ? "DRAFT" : "PUBLISHED",
//       } as any,
//       {
//         onSuccess: () => {
//           setTitle("");
//           setThumbnailUrl("");
//           setSelectedCategory("");
//           editor?.commands.clearContent();
//           resetMediaUploads();
//         },
//       },
//     );
//   }

//   function onPaste(e: ClipboardEvent<HTMLDivElement>) {
//     const files = Array.from(e.clipboardData.items)
//       .filter((item) => item.kind === "file")
//       .map((item) => item.getAsFile()) as File[];
//     handleFileUpload(files);
//   }

//   // 썸네일 선택 핸들러
//   const handleThumbnailSelect = (attachment: Attachment) => {
//     if (attachment.file.type.startsWith('image/')) {
//       setThumbnailUrl(URL.createObjectURL(attachment.file));
//     }
//   };

//   return (
//     <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
//       <div className="flex gap-5">
//         {user ? (
//           <UserAvatar avatarUrl={user.avatarUrl} className="hidden sm:inline" />
//         ) : (
//           <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full">
//             <ImageIcon size={20} className="text-gray-500" />
//           </div>
//         )}

//         <div className="w-full space-y-4">
//           <div>
//             <Label htmlFor="title">제목</Label>
//             <Input
//               id="title"
//               value={title}
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
//               placeholder="제목을 입력하세요"
//               className="mt-1"
//             />
//           </div>

//           <div {...rootProps} className="w-full">
//             <EditorContent
//               editor={editor}
//               className={cn(
//                 "max-h-[20rem] w-full overflow-y-auto rounded-2xl bg-background px-5 py-3",
//                 isDragActive && "outline-dashed",
//               )}
//               onPaste={onPaste}
//             />
//             <input {...getInputProps()} />
//           </div>
//         </div>
//       </div>

//       {!!attachments.length && (
//         <>
//           <div className="mb-4">
//             <Label>썸네일 이미지 선택</Label>
//             <div className="grid grid-cols-2 gap-4 mt-2 sm:grid-cols-3 md:grid-cols-4">
//               {attachments.map((attachment) => (
//                 attachment.file.type.startsWith('image/') && (
//                   <div
//                     key={attachment.file.name}
//                     className={cn(
//                       "relative cursor-pointer rounded-lg overflow-hidden border-2",
//                       thumbnailUrl === URL.createObjectURL(attachment.file)
//                         ? "border-primary"
//                         : "border-transparent"
//                     )}
//                     onClick={() => handleThumbnailSelect(attachment)}
//                   >
//                     <Image
//                       src={URL.createObjectURL(attachment.file)}
//                       alt="Thumbnail option"
//                       width={200}
//                       height={200}
//                       className="object-cover w-full h-32"
//                     />
//                   </div>
//                 )
//               ))}
//             </div>
//           </div>
//           <AttachmentPreviews
//             attachments={attachments}
//             removeAttachment={removeAttachment}
//           />
//         </>
//       )}

//       <div className="flex items-center justify-end gap-3">
//         {isUploading && (
//           <>
//             <span className="text-sm">{uploadProgress ?? 0}%</span>
//             <Loader2 className="size-5 animate-spin text-primary" />
//           </>
//         )}
//         <AddAttachmentsButton
//           onFilesSelected={handleFileUpload}
//           disabled={isUploading || attachments.length >= 5}
//         />
//         <LoadingButton
//           onClick={() => onSubmit(true)}
//           loading={mutation.isPending}
//           disabled={!title.trim() || !content.trim() || isUploading}
//           variant="outline"
//           className="min-w-20"
//         >
//           임시저장
//         </LoadingButton>
//         <LoadingButton
//           onClick={() => onSubmit(false)}
//           loading={mutation.isPending}
//           disabled={!title.trim() || !content.trim() || isUploading}
//           className="min-w-20"
//         >
//           게시하기
//         </LoadingButton>
//       </div>
//     </div>
//   );
// }

// interface AddAttachmentsButtonProps {
//   onFilesSelected: (files: File[]) => void;
//   disabled: boolean;
// }

// function AddAttachmentsButton({
//   onFilesSelected,
//   disabled,
// }: AddAttachmentsButtonProps) {
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   return (
//     <>
//       <Button
//         variant="ghost"
//         size="icon"
//         className="text-primary hover:text-primary"
//         disabled={disabled}
//         onClick={() => fileInputRef.current?.click()}
//       >
//         <ImageIcon size={20} />
//       </Button>
//       <input
//         type="file"
//         accept="image/*, video/*"
//         multiple
//         ref={fileInputRef}
//         className="sr-only hidden"
//         onChange={(e) => {
//           const files = Array.from(e.target.files || []);
//           if (files.length) {
//             onFilesSelected(files);
//             e.target.value = "";
//           }
//         }}
//       />
//     </>
//   );
// }

// interface AttachmentPreviewsProps {
//   attachments: Attachment[];
//   removeAttachment: (fileName: string) => void;
// }

// function AttachmentPreviews({
//   attachments,
//   removeAttachment,
// }: AttachmentPreviewsProps) {
//   return (
//     <div
//       className={cn(
//         "flex flex-col gap-3",
//         attachments.length > 1 && "sm:grid sm:grid-cols-2",
//       )}
//     >
//       {attachments.map((attachment) => (
//         <AttachmentPreview
//           key={attachment.file.name}
//           attachment={attachment}
//           onRemoveClick={() => removeAttachment(attachment.file.name)}
//         />
//       ))}
//     </div>
//   );
// }

// interface AttachmentPreviewProps {
//   attachment: Attachment;
//   onRemoveClick: () => void;
// }

// function AttachmentPreview({
//   attachment: { file, mediaId, isUploading },
//   onRemoveClick,
// }: AttachmentPreviewProps) {
//   const src = URL.createObjectURL(file);

//   return (
//     <div
//       className={cn("relative mx-auto size-fit", isUploading && "opacity-50")}
//     >
//       {file.type.startsWith("image") ? (
//         <Image
//           src={src}
//           alt="Attachment preview"
//           width={500}
//           height={500}
//           className="size-fit max-h-[30rem] rounded-2xl"
//         />
//       ) : (
//         <video controls className="size-fit max-h-[30rem] rounded-2xl">
//           <source src={src} type={file.type} />
//         </video>
//       )}
//       <Button
//         type="button"
//         variant="ghost"
//         size="icon"
//         className="absolute right-2 top-2 rounded-full hover:bg-muted"
//         onClick={onRemoveClick}
//       >
//         <X size={15} />
//       </Button>
//     </div>
//   );
// }
