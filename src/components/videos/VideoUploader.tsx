'use client';

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { VideoItem } from "./VideoItem";
import { Progress } from "@/components/ui/progress";
import { Language } from "@prisma/client";
import { useUploader } from "@/hooks/useUploader";
import { toast } from "@/components/ui/use-toast";
import { VideoWithSubtitles } from "@/lib/types";
import { useSession } from "@/components/SessionProvider";
import { MobileVideoUploader } from "./MobileVideoUploader";
import { MobileVideoEditor } from "./MobileVideoEditor";
import { useTranslations } from "next-intl";

type Video = VideoWithSubtitles;

interface VideoUploaderProps {
  videos: Video[];
  onChange: (videos: Video[]) => void;
  maxFiles?: number;
  isNewPost?: boolean; 
  postId?: string;
}

function matchVideoAndSubtitles(files: File[]) {
  const videos: File[] = [];
  const subtitles: Map<string, { file: File; language: string }[]> = new Map();

  files.forEach(file => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'mp4' || ext === 'webm' || ext === 'mov') {
      const baseName = file.name.replace(/_(ko|en|zh)\.[^.]+$/, '').replace(/\.[^.]+$/, '');
      videos.push(file);
    }
  });

  files.forEach(file => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'srt' || ext === 'vtt') {
      const match = file.name.match(/^(.+?)_(ko|en|zh)\.(srt|vtt)$/i);
      if (!match) return;

      const [, baseName, langCode] = match;
      
      const languageMap: Record<string, Language> = {
        ko: 'KOREAN',
        en: 'ENGLISH',
        zh: 'CHINESE'
      };
      
      const language = languageMap[langCode.toLowerCase()];
      if (!language) return;

      const matchingVideo = videos.find(v => {
        const videoBaseName = v.name.replace(/_(ko|en|zh)\.[^.]+$/, '').replace(/\.[^.]+$/, '');
        return videoBaseName === baseName;
      });

      if (matchingVideo) {
        if (!subtitles.has(baseName)) {
          subtitles.set(baseName, []);
        }
        subtitles.get(baseName)?.push({ file, language });
      }
    }
  });

  return { videos, subtitles };
}

export function VideoUploader({
  videos: initialVideos,
  onChange,
  maxFiles = 10,
  isNewPost = false,
  postId
}: VideoUploaderProps) {
  const [videos, setVideos] = useState(initialVideos);
  const [uploading, setUploading] = useState(false);
  const { uploadVideo, uploadSubtitle, progress } = useUploader();
  const { user } = useSession();
  const tUploader = useTranslations('VideoUploader');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768;
    setIsMobile(checkMobile());

    const handleResize = () => {
      setIsMobile(checkMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        variant: "destructive",
        description: tUploader('loginRequired')
      });
      return;
    }

    if (acceptedFiles.length > maxFiles) {
      toast({
        variant: "destructive",
        description: tUploader('maxFiles', { maxFiles })
      });
      return;
    }

    setUploading(true);
    
    try {
      const { videos: videoFiles, subtitles } = matchVideoAndSubtitles(acceptedFiles);
      
      const newVideos = await Promise.all(
        videoFiles.map(async (file: File, index: number) => {
          const sequence = videos.length + index + 1;
          const baseName = file.name.replace(/_(ko|en|zh)\.[^.]+$/, '').replace(/\.[^.]+$/, '');
      
          try {
            // 1. 비디오 업로드
            const { id, url, filename } = await uploadVideo(file);
            
            // 2. 자막 업로드
            const matchedSubtitles = subtitles.get(baseName) || [];
            const uploadedLanguages: Language[] = [];
            
            // 자막이 있으면 바로 업로드 시도
            if (matchedSubtitles.length > 0) {
              await Promise.all(
                matchedSubtitles.map(async ({ file: subtitleFile, language }) => {
                  try {
                    const result = await uploadSubtitle(id, subtitleFile, language);
                    uploadedLanguages.push(language as Language);
                  } catch (subtitleError) {
                    console.error(`Failed to upload subtitle for ${baseName}:`, subtitleError);
                    toast({
                      description: tUploader('subtitleUploadFailedWithName', { filename: subtitleFile.name }),
                      variant: "destructive",
                    });
                  }
                })
              );
            }
            
            // 3. 비디오 정보 반환 (자막 정보 포함)
            const newVideo: Partial<Video> = {
              id,
              filename,
              sequence,
              isPremium: true,
              createdAt: new Date(),
              subtitle: uploadedLanguages,
              views: []
            };
      
            return newVideo as Video;
          } catch (uploadError) {
            console.error(`Failed to upload ${file.name}:`, uploadError);
            throw uploadError;
          }
        })
      );

      const sortedVideos = [...videos, ...newVideos].sort(
        (a, b) => a.sequence - b.sequence
      );

      setVideos(sortedVideos);
      onChange(sortedVideos);
    } catch (error) {
      console.error("업로드 실패:", error);
      toast({
        variant: "destructive",
        description: tUploader('uploadFailed')
      });
    } finally {
      setUploading(false);
    }
  }, [videos, maxFiles, uploadVideo, uploadSubtitle, onChange, user, tUploader]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = videos.findIndex(item => item.id === active.id);
    const newIndex = videos.findIndex(item => item.id === over.id);

    const reorderedItems = arrayMove([...videos], oldIndex, newIndex);
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      sequence: index + 1
    }));

    setVideos(updatedItems);
    onChange(updatedItems);
  }, [videos, onChange]);

  const handleSubtitleUpload = useCallback(async (
    videoId: string,
    file: File,
    language: string
  ) => {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'srt' && ext !== 'vtt') {
        throw new Error(tUploader('unsupportedSubtitle'));
      }
  
      const result = await uploadSubtitle(videoId, file, language);
  
      const updatedVideos = videos.map(video => {
        if (video.id === videoId) {
          const newSubtitles = video.subtitle.includes(language as Language)
            ? video.subtitle
            : [...video.subtitle, language as Language];
          
          return {
            ...video,
            subtitle: newSubtitles
          };
        }
        return video;
      });
  
      setVideos(updatedVideos);
      onChange(updatedVideos);
  
      toast({
        description: tUploader('subtitleUploaded'),
      });
    } catch (error) {
      console.error("자막 업로드 실패:", error);
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : tUploader('subtitleUploadFailed')
      });
    }
  }, [videos, uploadSubtitle, onChange, tUploader]);

  const handleVideoDelete = useCallback(async (videoId: string) => {
    try {
      const response = await fetch('/api/videos/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete video');
      }
  
      const updatedVideos = videos.filter(v => v.id !== videoId);
      const reorderedVideos = updatedVideos.map((v, idx) => ({
        ...v,
        sequence: idx + 1
      }));
      
      setVideos(reorderedVideos);
      onChange(reorderedVideos);
      
      toast({
        description: tUploader('videoDeleted')
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        variant: "destructive",
        description: tUploader('videoDeleteFailed')
      });
    }
  }, [videos, onChange, tUploader]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "video/mp4": [".mp4"],
      "video/webm": [".webm"],
      "text/srt": [".srt"],
      "text/vtt": [".vtt"],
      "application/x-subrip": [".srt"]
    },
    maxSize: 100 * 1024 * 1024,
    disabled: uploading
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  return (
    <div className="space-y-4">
      {isMobile ? (
        // 모바일 버전
        isNewPost ? (
          // 새 포스트 작성 시
          <MobileVideoUploader
            onVideoSelect={onDrop}
            disabled={uploading}
          />
        ) : (
          // 포스트 수정 시
          <MobileVideoEditor
            videos={videos}
            onChange={(updatedVideos) => {
              setVideos(updatedVideos);  // 내부 상태 업데이트
              onChange(updatedVideos);    // 부모 컴포넌트에 알림
            }}
            maxFiles={maxFiles}
            postId={postId!}
          />
        )
      ) : (
        // 데스크톱 버전
        <>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center
              ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-2">
                <p>{tUploader('uploading')}</p>
                {Object.entries(progress).map(([filename, value]) => (
                  <div key={filename} className="space-y-1">
                    <p className="text-sm">{filename}</p>
                    <Progress value={value} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {tUploader('dropHint')}
                <br />
                <span className="text-xs text-gray-500">
                  ({tUploader('fileLimit', { maxFiles })})
                  <br />
                  {tUploader('fileGuide')}
                </span>
              </p>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={videos.map(v => v.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {videos.map((video) => (
                  <VideoItem
                    key={video.id}
                    video={video}
                    onRemove={() => handleVideoDelete(video.id)}
                    onSubtitleUpload={(file, language) => {
                      handleSubtitleUpload(video.id, file, language);
                    }}
                    onUpdate={(updated) => {
                      const updatedVideos = videos.map(v => 
                        v.id === video.id ? updated : v
                      );
                      setVideos(updatedVideos);
                      onChange(updatedVideos);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
