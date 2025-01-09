import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Language } from '@prisma/client';
import { PostWithVideos } from '@/lib/types';
import { toast } from "../ui/use-toast";

type Video = PostWithVideos['videos'][0];
interface VideoItemProps {
  video: Video;
  onRemove: () => void;
  onSubtitleUpload: (file: File, language: string) => void;
  onUpdate: (updated: Video) => void;
}

export function VideoItem({
  video,
  onRemove,
  onSubtitleUpload,
  onUpdate
}: VideoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const languageFlags: Record<Language, string> = {
    KOREAN: "🇰🇷",
    ENGLISH: "🇺🇸",
    CHINESE: "🇨🇳",
    JAPANESE: "🇯🇵",
    THAI: "🇹🇭",
    SPANISH: "🇪🇸",
    INDONESIAN: "🇮🇩",
    VIETNAMESE: "🇻🇳"
  };

  const handleSubtitleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const match = file.name.match(/_([A-Z]{2})\./i);
    const language = match ? getLanguageFromCode(match[1]) : "KOREAN";

    onSubtitleUpload(file, language);
  };

  function getLanguageFromCode(code: string): Language {
    const map: Record<string, Language> = {
      KO: Language.KOREAN,
      EN: Language.ENGLISH,
      CN: Language.CHINESE,
      JP: Language.JAPANESE,
      TH: Language.THAI,
      ES: Language.SPANISH,
      ID: Language.INDONESIAN,
      VI: Language.VIETNAMESE
    };
    return map[code.toUpperCase()] || Language.KOREAN;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-2 p-3 bg-background border rounded-lg shadow-sm dark:border-gray-800"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <span className="text-sm font-medium">
        {video.sequence}.
      </span>

      <span className="text-sm truncate flex-1 min-w-[150px]">
        {video.filename}
      </span>

      <div className="flex items-center gap-2 min-w-[180px]">
        <Input
          type="file"
          accept=".vtt,.srt"
          className="hidden"
          id={`subtitle-${video.id}`}
          onChange={handleSubtitleSelect}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            document.getElementById(`subtitle-${video.id}`)?.click();
          }}
        >
          자막 추가
        </Button>
        <div className="flex gap-2">
          {video.subtitle.map((lang) => (
            <div key={lang} className="relative group">
              <span title={lang} className="text-2xl relative top-1">
                {languageFlags[lang]}
              </span>
              <button
                onClick={async () => {
                  try {
                    // const response = await fetch('/api/videos/subtitle/delete', {
                    //   method: 'POST',
                    //   headers: {
                    //     'Content-Type': 'application/json',
                    //   },
                    //   body: JSON.stringify({
                    //     videoId: video.id,
                    //     language: lang
                    //   }),
                    // });

                    // if (!response.ok) {
                    //   throw new Error('Failed to delete subtitle');
                    // }
                    onUpdate({
                      ...video,
                      subtitle: video.subtitle.filter(l => l !== lang)
                    });
                  } catch (error) {
                    console.error('Error deleting subtitle:', error);
                    toast({
                      variant: "destructive",
                      description: "자막 삭제에 실패했습니다."
                    });
                  }
                }}
                className="absolute -top-1 -right-1 hidden group-hover:block bg-red-500 rounded-full p-0.5"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 min-w-[120px]">
        <input
          type="checkbox"
          checked={video.isPremium}
          onChange={(e) => {
            const updatedVideo = {
              ...video,
              isPremium: e.target.checked
            };
            onUpdate(updatedVideo);
          }}
          className="rounded border-gray-300 dark:border-gray-700"
        />
        <span className="text-sm">유료컨텐츠</span>
      </label>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 px-2 items-center justify-end ml-auto"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// import { useSortable } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import { GripVertical, X } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Language } from '@prisma/client';
// import { PostWithVideos } from '@/lib/types';
// import { Flag } from 'lucide-react';  // 국기 아이콘용
// import { toast } from "../ui/use-toast";

// // PostWithVideos에서 사용하는 Video 타입 추출
// type Video = PostWithVideos['videos'][0];

// interface VideoItemProps {
//   video: Video;
//   onRemove: () => void;
//   onSubtitleUpload: (file: File, language: string) => void;
//   onUpdate: (updated: Video) => void;
// }

// export function VideoItem({
//   video,
//   onRemove,
//   onSubtitleUpload,
//   onUpdate
// }: VideoItemProps) {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition
//   } = useSortable({ id: video.id });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition
//   };

//   // 언어별 국기 이모지
//   const languageFlags: Record<Language, string> = {
//     KOREAN: "🇰🇷",
//     ENGLISH: "🇺🇸",
//     CHINESE: "🇨🇳",
//     JAPANESE: "🇯🇵",
//     THAI: "🇹🇭",
//     SPANISH: "🇪🇸",
//     INDONESIAN: "🇮🇩",
//     VIETNAMESE: "🇻🇳"
//   };

//   // 자막 파일 선택 처리
//   const handleSubtitleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     // 파일명에서 언어 코드 추출 (예: subtitle_KO.vtt -> KOREAN)
//     const match = file.name.match(/_([A-Z]{2})\./i);
//     const language = match ? getLanguageFromCode(match[1]) : "KOREAN";

//     onSubtitleUpload(file, language);
//   };

//   // 언어 코드를 Language 열거형으로 변환
//   function getLanguageFromCode(code: string): Language {
//     const map: Record<string, Language> = {
//       KO: Language.KOREAN,
//       EN: Language.ENGLISH,
//       CN: Language.CHINESE,
//       JP: Language.JAPANESE,
//       TH: Language.THAI,
//       ES: Language.SPANISH,
//       ID: Language.INDONESIAN,
//       VI: Language.VIETNAMESE
//     };
//     return map[code.toUpperCase()] || Language.KOREAN;
//   }

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       className="flex flex-wrap items-center gap-2 p-3 bg-background border rounded-lg shadow-sm dark:border-gray-800"
//     >
//       {/* 드래그 핸들 */}
//       <button
//         {...attributes}
//         {...listeners}
//         className="cursor-grab active:cursor-grabbing"
//       >
//         <GripVertical className="h-4 w-4 text-muted-foreground" />
//       </button>

//       {/* 순서 번호 */}
//       <span className="text-sm font-medium">
//         {video.sequence}.
//       </span>

//       {/* 파일명 */}
//       <span className="text-sm truncate flex-1 min-w-[150px]">
//         {video.filename}
//       </span>

//       {/* 영상 언어 선택 */}
//       {/* <div className="flex items-center gap-1 min-w-[200px]">
//         <span className="text-sm text-muted-foreground">영상 언어:</span>
//         <Select
//           value={video.language}
//           onValueChange={(value) => {
//             const updatedVideo = {
//               ...video,
//               language: value as Language
//             };
//             onUpdate(updatedVideo);
//           }}
//         >
//           <SelectTrigger className="h-8 w-[140px]">
//             <SelectValue placeholder="언어 선택" />
//           </SelectTrigger>
//           <SelectContent>
//             {Object.values(Language).map((lang) => (
//               <SelectItem key={lang} value={lang}>
//                 {languageFlags[lang]} {lang}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div> */}

//       {/* 자막 관련 */}
//       <div className="flex items-center gap-2 min-w-[180px]">
//         <Input
//           type="file"
//           accept=".vtt,.srt"
//           className="hidden"
//           id={`subtitle-${video.id}`}
//           onChange={handleSubtitleSelect}
//         />
//         <Button
//           variant="outline"
//           size="sm"
//           className="h-8"
//           onClick={() => {
//             document.getElementById(`subtitle-${video.id}`)?.click();
//           }}
//         >
//           자막 추가
//         </Button>
//         <div className="flex gap-2">
//           {video.subtitle?.map((subtitle) => (  // subtitles -> subtitle
//             <div key={subtitle.id} className="relative group">
//               <span title={subtitle.language} className="text-2xl relative top-1">
//                 {languageFlags[subtitle.language as Language]}
//               </span>
//               <button
//                 onClick={async () => {
//                   try {
//                     const response = await fetch('/api/videos/subtitle/delete', {
//                       method: 'POST',
//                       headers: {
//                         'Content-Type': 'application/json',
//                       },
//                       body: JSON.stringify({
//                         videoId: video.id,
//                         language: subtitle  // subtitleId 대신 language 전달
//                       }),
//                     });

//                     if (!response.ok) {
//                       throw new Error('Failed to delete subtitle');
//                     }

//                     onUpdate({
//                       ...video,
//                       subtitle: video.subtitle.filter(lang => lang !== subtitle)  // 언어로 필터링
//                     });
//                   } catch (error) {
//                     console.error('Error deleting subtitle:', error);
//                     toast({
//                       variant: "destructive",
//                       description: "자막 삭제에 실패했습니다."
//                     });
//                   }
//                 }}
//                 className="absolute -top-1 -right-1 hidden group-hover:block bg-red-500 rounded-full p-0.5"
//               >
//                 <X className="h-3 w-3 text-white" />
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* 프리미엄 설정 */}
//       <label className="flex items-center gap-2 min-w-[120px]">
//         <input
//           type="checkbox"
//           checked={video.isPremium}
//           onChange={(e) => {
//             const updatedVideo = {
//               ...video,
//               isPremium: e.target.checked
//             };
//             onUpdate(updatedVideo);
//           }}
//           className="rounded border-gray-300 dark:border-gray-700"
//         />
//         <span className="text-sm">유료컨텐츠</span>
//       </label>

//       {/* 삭제 버튼 */}
//       <Button
//         variant="ghost"
//         size="sm"
//         onClick={onRemove}
//         className="h-8 px-2 items-center justify-end ml-auto"
//       >
//         <X className="h-4 w-4" />
//       </Button>
//     </div>
//   );
// }