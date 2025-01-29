'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Language } from "@prisma/client";
import { VideoWithSubtitles } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";
import { useCallback, useState } from "react";
import { useUploader } from "@/hooks/useUploader";
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

interface MobileVideoEditorProps {
  videos: VideoWithSubtitles[];
  onChange: (videos: VideoWithSubtitles[]) => void;
  maxFiles?: number;
  postId: string;
}

export function MobileVideoEditor({
  videos,
  onChange,
  maxFiles = 10,
  postId
}: MobileVideoEditorProps) {
  const [uploading, setUploading] = useState(false);
  const { uploadVideo, uploadSubtitle } = useUploader();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    if (videos.length >= maxFiles) {
      toast({
        variant: "destructive",
        description: `최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`
      });
      return;
    }
  
    setUploading(true);
    try {
      const { id, url, filename } = await uploadVideo(file);
      
      const newVideo = {  
        id,
        postId,
        filename,
        sequence: videos.length + 1,
        isPremium: true,
        createdAt: new Date(),
        subtitle: [],
        views: []
      } as VideoWithSubtitles; 
  
      const updatedVideos = [...videos, newVideo].sort(
        (a, b) => a.sequence - b.sequence
      );
      onChange(updatedVideos);
  
      toast({
        description: "비디오가 업로드되었습니다.",
      });
    } catch (error) {
      console.error("비디오 업로드 실패:", error);
      toast({
        variant: "destructive",
        description: "업로드에 실패했습니다."
      });
    } finally {
      setUploading(false);
    }
  };

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

    onChange(updatedItems);
  }, [videos, onChange]);

  const handleVideoDelete = async (videoId: string) => {
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
  
      const updatedVideos = videos
        .filter(v => v.id !== videoId)
        .map((v, idx) => ({
          ...v,
          sequence: idx + 1
        }));
      
      onChange(updatedVideos);
      toast({
        description: "비디오가 삭제되었습니다."
      });
    } catch (error) {
      console.error('비디오 삭제 실패:', error);
      toast({
        variant: "destructive",
        description: "비디오 삭제에 실패했습니다."
      });
    }
  };

  const handleSubtitleUpload = async (videoId: string, file: File, language: string) => {
    try {
      const result = await uploadSubtitle(videoId, file, language);
      
      const updatedVideos = videos.map(video => {
        if (video.id === videoId) {
          return {
            ...video,
            subtitle: [...video.subtitle, language as Language]
          };
        }
        return video;
      });
      
      onChange(updatedVideos);
      toast({
        description: "자막이 업로드되었습니다.",
      });
    } catch (error) {
      console.error("자막 업로드 실패:", error);
      toast({
        variant: "destructive",
        description: "자막 업로드에 실패했습니다."
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 비디오 추가 버튼 */}
      <div>
        <Input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          onChange={handleVideoSelect}
          disabled={uploading}
          className="hidden"
          id="mobile-video-edit"
        />
        <Button
          type="button"
          variant="outline"
          className="w-full h-12"
          disabled={uploading}
          onClick={() => {
            document.getElementById('mobile-video-edit')?.click();
          }}
        >
          {uploading ? "업로드 중..." : `동영상 추가 (${videos.length}/${maxFiles})`}
        </Button>
      </div>

      {/* 비디오 목록 */}
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
                  onChange(updatedVideos);
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {videos.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          드래그하여 순서를 변경할 수 있습니다
        </p>
      )}
    </div>
  );
}