// "use client";

// import { useSession } from "@/components/SessionProvider";
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

// interface TempFile {
//   filename: string;
//   url: string;
//   status: 'uploading' | 'completed';
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
//   const { uploadVideo, uploadSubtitle } = useUploader();
//   const [tempFiles, setTempFiles] = useState<{
//     images: TempFile[];
//     videos: TempFile[];
//     subtitles: TempFile[];
//   }>({
//     images: [],
//     videos: [],
//     subtitles: []
//   });

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
//   const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedOptions = Array.from(event.target.selectedOptions).map(
//       option => option.value as CategoryType
//     );
  
//     // 최대 3개 제한
//     if (selectedOptions.length > 3) {
//       toast({
//         description: "카테고리는 최대 3개까지 선택 가능합니다.",
//       });
//       return;
//     }
  
//     setSelectedCategories(selectedOptions);
//     setValue('categories', selectedOptions);
//   };

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
//       const priorityValue = formValues.priority ? Number(formValues.priority) : 5;
  
//       // 임시 파일들을 videos 배열에 포함
//       const tempVideos = [
//         ...tempFiles.videos.filter(v => v.status === 'completed').map((v, index) => ({
//           id: `temp-${Date.now()}-${index}`,
//           postId: 'temp',
//           url: v.url,
//           filename: v.filename,
//           sequence: videos.length + index + 1,
//           language: Language.KOREAN as Language,
//           isPremium: false,
//           createdAt: new Date(),
//           subtitles: tempFiles.subtitles
//             .filter(s => s.status === 'completed')
//             .map(s => ({
//               id: `temp-subtitle-${Date.now()}-${index}`,
//               videoId: `temp-${Date.now()}-${index}`,
//               url: s.url,
//               language: Language.KOREAN as Language,
//               createdAt: new Date()
//             }))
//         })),
//         ...videos  // 기존 videos 배열 유지
//       ];
  
//       // 이미지가 있으면 썸네일로 사용
//       let thumbnailUrl = formValues.thumbnailUrl;
//       if (tempFiles.images.length > 0 && tempFiles.images[0].status === 'completed') {
//         thumbnailUrl = tempFiles.images[0].url;
//       }
  
//       const result = postSchema.safeParse({
//         ...formValues,
//         priority: priorityValue,
//         ageLimit: Number(formValues.ageLimit),
//         thumbnailUrl,
//         videos: tempVideos
//       });
  
//       if (!result.success) {
//         const errorMessage = result.error.errors.map(error => {
//           switch (error.path[0]) {
//             case 'title':
//               return '제목을 입력해주세요';
//             case 'content':
//               return '내용을 입력해주세요';
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
  
//       const newPost = await mutation.mutateAsync({
//         ...result.data,
//         status,
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
//     // <div className="max-w-4xl mx-auto p-6 space-y-6">
//     <div className="p-3 space-y-6">
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
//         {Object.entries(CATEGORIES)
//           .filter(([key]) => key !== 'NOTIFICATION' && key !== 'MSPOST')
//           .map(([key, label]) => (
//             <button
//               key={key}
//               type="button"
//               onClick={() => {
//                 const category = key as CategoryType;
//                 const currentCategories = Array.from(selectedCategories);
//                 const index = currentCategories.indexOf(category);
                
//                 if (index === -1) {
//                   if (currentCategories.length >= 3) {
//                     toast({
//                       description: "카테고리는 최대 3개까지 선택 가능합니다.",
//                     });
//                     return;
//                   }
//                   currentCategories.push(category);
//                 } else {
//                   currentCategories.splice(index, 1);
//                 }
                
//                 setSelectedCategories(currentCategories);
//                 setValue('categories', currentCategories);
//               }}
//               className={`
//                 px-3 py-2 rounded-md text-sm transition-colors
//                 ${selectedCategories.includes(key as CategoryType)
//                   ? "bg-primary text-primary-foreground font-medium"
//                   : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"}
//                 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50
//                 active:scale-95 transform duration-100
//               `}
//             >
//               {label}
//             </button>
//           ))}
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

// {/* 임시 파일 업로드 UI - 이 부분을 원하는 위치에 붙여넣기 */}
// {/* <div className="space-y-2">
//   <Label className="flex">이미지 업로드</Label>
//   <div className="flex items-center gap-2">
//     <div className="flex-shrink-0">
//       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//       </svg>
//     </div>
//     <div className="flex flex-grow items-center gap-2">
//       <input
//         type="file"
//         accept="image/*"
//         className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
//         onChange={async (e) => {
//           const file = e.target.files?.[0];
//           if (file) {
//             try {
//               setTempFiles(prev => ({
//                 ...prev,
//                 images: [...prev.images, { filename: file.name, url: '', status: 'uploading' }]
//               }));

//               const url = await uploadImage(file);
              
//               setTempFiles(prev => ({
//                 ...prev,
//                 images: prev.images.map(img => 
//                   img.filename === file.name 
//                     ? { filename: file.name, url, status: 'completed' }
//                     : img
//                 )
//               }));
//             } catch (error) {
//               setTempFiles(prev => ({
//                 ...prev,
//                 images: prev.images.filter(img => img.filename !== file.name)
//               }));
//               toast({
//                 variant: "destructive",
//                 description: "이미지 업로드에 실패했습니다.",
//               });
//             }
//           }
//         }}
//       />
//       {tempFiles.images.map((file, index) => (
//         <span key={`image-${index}`} className="text-sm text-gray-500 flex items-center gap-2">
//           {file.filename}
//           {file.status === 'uploading' ? (
//             <span className="text-yellow-500">업로드 중...</span>
//           ) : (
//             <span className="text-green-500">업로드 완료</span>
//           )}
//         </span>
//       ))}
//     </div>
//   </div>

//   <Label className="flex pt-4">동영상 업로드</Label>
//   <div className="flex items-center gap-2">
//     <div className="flex-shrink-0">
//       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
//       </svg>
//     </div>
//     <div className="flex flex-grow items-center gap-2">
//       <input
//         type="file"
//         accept="video/*"
//         className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
//         onChange={async (e) => {
//           const file = e.target.files?.[0];
//           if (file) {
//             try {
//               setTempFiles(prev => ({
//                 ...prev,
//                 videos: [...prev.videos, { filename: file.name, url: '', status: 'uploading' }]
//               }));

//               const response = await uploadVideo(file);
              
//               setTempFiles(prev => ({
//                 ...prev,
//                 videos: prev.videos.map(vid => 
//                   vid.filename === file.name 
//                     ? { filename: file.name, url: response.url, status: 'completed' }
//                     : vid
//                 )
//               }));
//             } catch (error) {
//               setTempFiles(prev => ({
//                 ...prev,
//                 videos: prev.videos.filter(vid => vid.filename !== file.name)
//               }));
//               toast({
//                 variant: "destructive",
//                 description: "비디오 업로드에 실패했습니다.",
//               });
//             }
//           }
//         }}
//       />
//       {tempFiles.videos.map((file, index) => (
//         <span key={`video-${index}`} className="text-sm text-gray-500 flex items-center gap-2">
//           {file.filename}
//           {file.status === 'uploading' ? (
//             <span className="text-yellow-500">업로드 중...</span>
//           ) : (
//             <span className="text-green-500">업로드 완료</span>
//           )}
//         </span>
//       ))}
//     </div>
//   </div>

//   <Label className="flex pt-4">자막 업로드</Label>
//   <div className="flex items-center gap-2">
//     <div className="flex-shrink-0">
//       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//       </svg>
//     </div>
//     <div className="flex flex-grow items-center gap-2">
//       <input
//         type="file"
//         accept=".srt,.vtt"
//         className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
//         onChange={async (e) => {
//           const file = e.target.files?.[0];
//           if (file && tempFiles.videos.length > 0) {
//             try {
//               setTempFiles(prev => ({
//                 ...prev,
//                 subtitles: [...prev.subtitles, { filename: file.name, url: '', status: 'uploading' }]
//               }));

//               const formData = new FormData();
//               formData.append('file', file);
              
//               const response = await fetch('/api/upload/subtitle', {
//                 method: 'POST',
//                 body: formData
//               });
              
//               if (response.ok) {
//                 const { url } = await response.json();
//                 setTempFiles(prev => ({
//                   ...prev,
//                   subtitles: prev.subtitles.map(sub => 
//                     sub.filename === file.name 
//                       ? { filename: file.name, url, status: 'completed' }
//                       : sub
//                   )
//                 }));
//               }
//             } catch (error) {
//               setTempFiles(prev => ({
//                 ...prev,
//                 subtitles: prev.subtitles.filter(sub => sub.filename !== file.name)
//               }));
//               toast({
//                 variant: "destructive",
//                 description: "자막 업로드에 실패했습니다.",
//               });
//             }
//           } else if (!tempFiles.videos.length) {
//             toast({
//               variant: "destructive",
//               description: "먼저 비디오를 업로드해주세요.",
//             });
//           }
//         }}
//       />
//       {tempFiles.subtitles.map((file, index) => (
//         <span key={`subtitle-${index}`} className="text-sm text-gray-500 flex items-center gap-2">
//           {file.filename}
//           {file.status === 'uploading' ? (
//             <span className="text-yellow-500">업로드 중...</span>
//           ) : (
//             <span className="text-green-500">업로드 완료</span>
//           )}
//         </span>
//       ))}
//     </div>
//   </div>
// </div> */}

//       {/* 기존 비디오 업로더는 그대로 유지 */}
//       {/* <div>
//         <label className="block text-sm font-medium mb-2">
//           비디오
//         </label>
//         <VideoUploader
//           videos={videos}
//           onChange={handleVideosChange}
//           maxFiles={10}
//         />
//       </div> */}

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

//       {/* 연령제한 선택 */}
//       <div className="space-y-4">
//         <div className="flex items-center gap-4">
//           <label className="text-sm font-medium">
//             컨텐츠 이용연령
//           </label>
//           <select
//             {...register("ageLimit")}
//             defaultValue="15"
//             className="w-32 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary p-2"
//           >
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


