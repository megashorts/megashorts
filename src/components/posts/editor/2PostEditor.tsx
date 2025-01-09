// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { postSchema } from "@/lib/validation";
// import { ImageUploader } from "@/components/ImageUploader"; 
// import { VideoUploader } from "@/components/videos/VideoUploader";
// import { useEditor, EditorContent } from "@tiptap/react";  // Editor를 EditorContent로 변경
// import StarterKit from "@tiptap/starter-kit";
// import Placeholder from "@tiptap/extension-placeholder";
// import { Language, CategoryType } from "@prisma/client";
// import { PostWithVideos } from "@/lib/types";
// import { Button } from "@/components/ui/button";
// import { toast, useToast } from "@/components/ui/use-toast";
// import { Label } from "@radix-ui/react-label";
// import { useUploader } from "@/hooks/useUploader";
// import { useSubmitPostMutation } from "./mutations";  // useCreatePost 대신 useSubmitPostMutation 사용
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "@/components/SessionProvider";

// type VideoType = PostWithVideos['videos'][number];

// const CATEGORIES: Record<CategoryType, string> = {
//   COMIC: "만화",
//   ROMANCE: "로맨스",
//   ACTION: "액션",
//   THRILLER: "스릴러",
//   DRAMA: "드라마",
//   PERIOD: "시대물",
//   FANTASY: "판타지",
//   HIGHTEEN: "하이틴",
//   ADULT: "성인", 
//   NOTIFICATION: "안내", 
//   MSPOST: "블로그",
// } as const;

// interface PreparedImage {
//   file: File;
//   preview: string;
// }

// export function PostEditor() {
//   const router = useRouter();
//   const { user } = useSession();
//   const [videos, setVideos] = useState<VideoType[]>([]);
//   const mutation = useSubmitPostMutation();
//   const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([]);
//   const [preparedImage, setPreparedImage] = useState<PreparedImage | null>(null);
//   const { toast } = useToast();
//   const { uploadImage } = useUploader();
//   const [isSaving, setIsSaving] = useState(false);

//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Placeholder.configure({
//         placeholder: '내용을 입력하세요... (필수)',
//         showOnlyWhenEditable: true,
//         emptyEditorClass: 'is-editor-empty'
//       })
//     ],
//     onUpdate: ({ editor }) => {
//       const text = editor.getText();
//       setValue('content', text);
//     },
//     editorProps: {
//       attributes: {
//         class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none'
//       }
//     }
//   });

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     getValues,
//     formState: { errors }
//   } = useForm<PostWithVideos>({
//     resolver: zodResolver(postSchema)
//   });

//   // 로그인 체크를 렌더링 로직으로 이동
//   if (!user) {
//     router.push("/login");
//     return null;
//   }

//   // 카테고리 선택 핸들러
//   // const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//   //   const selectedOptions = Array.from(event.target.selectedOptions).map(
//   //     option => option.value as CategoryType
//   //   );
  
//   //   // 최대 3개 제한
//   //   if (selectedOptions.length > 5) {
//   //     toast({
//   //       description: "카테고리는 최대 5개까지 선택 가능합니다.",
//   //     });
//   //     return;
//   //   }
  
//   //   setSelectedCategories(selectedOptions);
//   //   setValue('categories', selectedOptions);
//   // };

//   // 비디오 상태 업데이트 핸들러
//   const handleVideosChange = (updatedVideos: VideoType[]) => {
//     setVideos(updatedVideos);  // 로컬 상태만 업데이트
//   };

//   // handleSave 함수 수정
//   const handleSave = async (status: 'PUBLISHED' | 'DRAFT') => {
//     if (!editor || isSaving) return;
  
//     try {
//       setIsSaving(true);
  
//       const formValues = getValues();
//       const cleanContent = editor.getHTML()
//         .replace(/<p>/g, '')
//         .replace(/<\/p>/g, '\n')
//         .replace(/<br>/g, '\n')
//         .trim();
  
//       const now = new Date().toISOString();
  
//       const postData = {
//         title: formValues.title,
//         content: cleanContent,
//         priority: formValues.priority ? Number(formValues.priority) : 5,
//         categories: selectedCategories,
//         ageLimit: Number(formValues.ageLimit),
//         featured: formValues.featured || false,
//         status,
//         createdAt: now,
//         publishedAt: status === 'PUBLISHED' ? now : null,
//         videos: videos.map(video => ({
//           url: video.url,
//           filename: video.filename,
//           sequence: video.sequence,
//           language: video.language,
//           isPremium: video.isPremium,
//           subtitles: video.subtitles || []
//         }))
//       };
  
//       const result = postSchema.safeParse(postData);
  
//       if (!result.success) {
//         const errorMessage = result.error.errors.map(error => {
//           switch (error.path[0]) {
//             case 'title':
//               return '제목을 입력해주세요';
//             case 'content':
//               return '내용을 입력해주세요';
//             case 'priority':
//               return '우선순위를 1-10 사이의 숫자로 입력해주세요';
//             case 'categories':
//               return '카테고리를 선택해주세요';
//             case 'ageLimit':
//               return '연령제한은 12-18 사이여야 합니다';
//             case 'videos':
//               return '최소 1개의 비디오가 필요합니다';
//             default:
//               return error.message;
//           }
//         })[0];
  
//         toast({
//           variant: "destructive",
//           description: errorMessage,
//         });
//         setIsSaving(false);
//         return;
//       }
  
//       let thumbnailUrl: string | undefined = undefined;
//       if (preparedImage) {
//         thumbnailUrl = await uploadImage(preparedImage.file);
//       }
  
//       const newPost = await mutation.mutateAsync({
//         ...result.data,
//         thumbnailUrl,
//       });
  
//       toast({
//         description: status === 'PUBLISHED' ? "포스트가 발행되었습니다." : "임시저장되었습니다.",
//       });
  
//       if (newPost && typeof newPost === 'object' && 'id' in newPost) {
//         router.push(`/posts/${newPost.id}`);
//       }
  
//     } catch (error) {
//       console.error("Error creating post:", error);
//       toast({
//         variant: "destructive",
//         description: "포스트 저장에 실패했습니다.",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6 space-y-6">
//       {/* 제목 입력 */}
//       <div>
//         <label className="block text-sm font-medium mb-2">
//           제목
//         </label>
//         <input
//           type="text"
//           {...register("title")}
//           placeholder="제목을 입력해주세요 (필수)"
//           className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 p-3"
//         />
//         {errors.title && (
//           <p className="mt-1 text-sm text-red-600">
//             {errors.title.message}
//           </p>
//         )}
//       </div>

//       <div>
//         <input
//           type="text"
//           {...register("titleOriginal")}
//           placeholder="(옵션)원작제목의 언어가 다르다면 입력하세요"
//           className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 p-3"
//         />
//         {errors.titleOriginal && (
//           <p className="mt-1 text-sm text-red-600">
//             {errors.titleOriginal.message}
//           </p>
//         )}
//       </div>

//       {/* 썸네일 업로더 */}
//       <div className="space-y-4">
//         <label className="block text-sm font-medium mb-2">
//           썸네일 이미지
//         </label>
//         <ImageUploader
//           onImagePrepared={setPreparedImage}
//           aspectRatio={2/3}
//           username={user?.username}
//         />
//         {errors.thumbnailUrl && (
//           <p className="mt-1 text-sm text-red-600">
//             {errors.thumbnailUrl?.message}
//           </p>
//         )}
//       </div>

//       {/* 카테고리 선택 */}
//       <div>
//         <Label>카테고리 (최대 3개)</Label>
//         <div className="flex flex-wrap gap-2 mt-2">
//           {Object.entries(CATEGORIES)
//             .filter(([key]) => key !== 'NOTIFICATION' && key !== 'MSPOST')
//             .map(([key, label]) => (
//               <button
//                 key={key}
//                 type="button"
//                 onClick={() => {
//                   const category = key as CategoryType;
//                   const currentCategories = Array.from(selectedCategories);
//                   const index = currentCategories.indexOf(category);
                  
//                   if (index === -1) {
//                     if (currentCategories.length >= 3) {
//                       toast({
//                         description: "카테고리는 최대 3개까지 선택 가능합니다.",
//                       });
//                       return;
//                     }
//                     currentCategories.push(category);
//                   } else {
//                     currentCategories.splice(index, 1);
//                   }
                  
//                   setSelectedCategories(currentCategories);
//                   setValue('categories', currentCategories);
//                 }}
//                 className={`
//                   px-4 py-2 rounded-md text-xs transition-colors
//                   ${selectedCategories.includes(key as CategoryType)
//                     ? "bg-primary text-primary-foreground font-medium"
//                     : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"}
//                   hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50
//                   active:scale-95 transform duration-100
//                 `}
//               >
//                 {label}
//               </button>
//             ))}
//         </div>
//         <div className="mt-2 flex flex-wrap gap-2">
//           {selectedCategories.map((category) => (
//             <span
//               key={category}
//               className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
//             >
//               {CATEGORIES[category]}
//             </span>
//           ))}
//         </div>
//       </div>

//       {/* 비디오 업로더 */}
//       <div>
//         <label className="block text-sm font-medium mb-2">
//           비디오
//         </label>
//         <VideoUploader
//           videos={videos}
//           onChange={handleVideosChange}  // setVideos 대신 핸들러 사용
//           maxFiles={10}
//         />
//         {errors.videos && (
//           <p className="mt-1 text-sm text-red-600">
//             {errors.videos.message}
//           </p>
//         )}
//       </div>

//       {/* 컨텐츠 에디터 */}
//       <div>
//         <label className="block text-sm font-medium mb-2">
//           내용
//         </label>
//         <EditorContent
//           editor={editor}
//           className="mt-1 min-h-[200px] border border-gray-300 rounded-md p-3 [&_.ProseMirror]:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 [&_.is-editor-empty]:before:text-gray-400 [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none"
//         />
//         {errors.content && (
//           <p className="mt-1 text-sm text-red-600">
//             {errors.content.message}
//           </p>
//         )}
//       </div>

//        {/* 연령제한 선택 */}
//        <div className="space-y-4">
//         <div className="flex items-center gap-4">
//           <label className="text-sm font-medium">
//              컨텐츠 이용연령
//            </label>
//            <select
//             {...register("ageLimit")}
//             defaultValue="15"
//             className="w-32 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary p-2"
//           >
//             <option value="0">전체</option>
//             <option value="12">12세 이상</option>
//             <option value="15">15세 이상</option>
//             <option value="18">18세 이상</option>
//           </select>
//         </div>

//         {/* 추천 컨텐츠 */}
//         <label className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             {...register("featured")}
//             className="rounded border-gray-300"
//           />
//           <span className="text-sm">추천 컨텐츠</span>
//         </label>

//         {/* 우선순위 */}
//         <div className="flex items-center gap-2">
//           <label className="text-sm font-medium">
//             우선순위 (1-10)
//           </label>
//           <input
//             type="number"
//             {...register("priority")}
//             min={1}
//             max={10}
//             placeholder="5"
//             className="w-32 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary p-2"
//           />
//         </div>
//       </div>

//       {/* 제출 버튼 */}
//       <div className="flex justify-end gap-4">
//         <Button
//           type="button"
//           variant="outline"
//           onClick={() => handleSave('DRAFT')}
//           disabled={isSaving}
//         >
//           임시저장
//         </Button>
//         <Button
//           type="button"
//           onClick={() => handleSave('PUBLISHED')}
//           disabled={isSaving}
//         >
//           {isSaving ? "저장 중..." : "저장"}
//         </Button>
//       </div>
//     </div>
//   );
// }