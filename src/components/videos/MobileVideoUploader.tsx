import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Language } from "@prisma/client";
import { VideoWithSubtitles } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

type Video = VideoWithSubtitles;

interface MobileVideoUploaderProps {
  onVideoSelect: (files: File[]) => void;
  disabled?: boolean;
}

export function MobileVideoUploader({ onVideoSelect, disabled }: MobileVideoUploaderProps) {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onVideoSelect(files);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div>
          <Input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
            id="mobile-video-upload"
            multiple
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-12"
            disabled={disabled}
            onClick={() => {
              document.getElementById('mobile-video-upload')?.click();
            }}
          >
            동영상 선택
          </Button>
        </div>

        <div>
          <Input
            type="file"
            accept=".srt,.vtt"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
            id="mobile-subtitle-upload"
            multiple
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-12"
            disabled={disabled}
            onClick={() => {
              document.getElementById('mobile-subtitle-upload')?.click();
            }}
          >
            자막 선택 (선택사항)
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        <span className="text-xs text-white">모바일에서는 동영상 관리 최적화 기능이 지원되지 않습니다.</span>
        <br />
        동영상: MP4/WebM/MOV (100MB 이하)
        <br />
        자막: VTT/SRT (_ko 접미사로 구분)
      </p>
    </div>
  );
}
