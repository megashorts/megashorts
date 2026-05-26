import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Language } from '@prisma/client';
import { VideoWithSubtitles } from "@/lib/types";
import { toast } from "../ui/use-toast";
import { useUploader } from "@/hooks/useUploader";
import LanguageFlag from "@/components/LanguageFlag";
import { useTranslations } from "next-intl";

type Video = VideoWithSubtitles;

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

  const { deleteSubtitle } = useUploader(); 
  const tUploader = useTranslations('VideoUploader');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const handleSubtitleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const match = file.name.match(/_([A-Z]{2})\./i);
    const language = match ? getLanguageFromCode(match[1]) : "KOREAN";

    // cloudflareId 체크 제거
    onSubtitleUpload(file, language);  // DB ID 그대로 전달
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
          {tUploader('addSubtitle')}
        </Button>
        <div className="flex gap-2">
          {video.subtitle.map((lang) => (
            <div key={lang} className="relative group">
              <LanguageFlag language={lang} />
              <button
                onClick={async () => {
                  try {
                    console.log('Deleting subtitle:', {
                      videoId: video.id,
                      language: lang
                    });

                    await deleteSubtitle(video.id, lang);

                    onUpdate({
                      ...video,
                      subtitle: video.subtitle.filter(l => l !== lang)
                    });

                    toast({
                      variant: "default",
                      description: tUploader('deleteSubtitleSuccess'),
                      duration: 1500
                    });
                  } catch (error) {
                    console.error('Error deleting subtitle:', error);
                    toast({
                      variant: "destructive",
                      description: tUploader('deleteSubtitleFailed'),
                      duration: 1500
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
        <span className="text-sm">{tUploader('premiumContent')}</span>
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
// import { VideoWithSubtitles } from "@/lib/types";
// import { toast } from "../ui/use-toast";
// import { useUploader } from "@/hooks/useUploader";

// type Video = VideoWithSubtitles;

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

//   const { deleteSubtitle } = useUploader(); 

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition
//   };

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

//   const handleSubtitleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;
  
//     const match = file.name.match(/_([A-Z]{2})\./i);
//     const language = match ? getLanguageFromCode(match[1]) : "KOREAN";
  
//     // URL에서 클라우드플레어 ID 추출
//     const matches = video.url.match(/videodelivery\.net\/([^/]+)/);
//     if (!matches) {
//       toast({
//         variant: "destructive",
//         description: "잘못된 비디오 URL 형식입니다."
//       });
//       return;
//     }
//     const cloudflareId = matches[1];
  
//     onSubtitleUpload(file, language);  // 추출한 ID 사용
//   };

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
//       <button
//         {...attributes}
//         {...listeners}
//         className="cursor-grab active:cursor-grabbing"
//       >
//         <GripVertical className="h-4 w-4 text-muted-foreground" />
//       </button>

//       <span className="text-sm font-medium">
//         {video.sequence}.
//       </span>

//       <span className="text-sm truncate flex-1 min-w-[150px]">
//         {video.filename}
//       </span>

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
//           {video.subtitle.map((lang) => (
//             <div key={lang} className="relative group">
//               <span title={lang} className="text-2xl relative top-1">
//                 {languageFlags[lang]}
//               </span>
//               <button
//                 onClick={async () => {
//                   try {
//                     // 디버깅을 위한 로그
//                     console.log('Deleting subtitle:', {
//                       videoId: video.id,
//                       url: video.url,
//                       language: lang
//                     });

//                     await deleteSubtitle(video.id, lang);  // DB ID 그대로 전달

//                     onUpdate({
//                       ...video,
//                       subtitle: video.subtitle.filter(l => l !== lang)
//                     });

//                     // POST로 revalidate 호출
//                     await fetch('/api/revalidate', {
//                       method: 'POST',
//                       headers: {
//                         'Content-Type': 'application/json'
//                       },
//                       body: JSON.stringify({
//                         path: `/usermenu/posts/${video.postId}/edit`
//                       })
//                     });

//                     toast({
//                       variant: "default",
//                       description: "자막이 삭제되었습니다.",
//                       duration: 1500
//                     });
//                   } catch (error) {
//                     console.error('Error deleting subtitle:', error);
//                     toast({
//                       variant: "destructive",
//                       description: "자막 삭제에 실패했습니다.",
//                       duration: 1500
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
