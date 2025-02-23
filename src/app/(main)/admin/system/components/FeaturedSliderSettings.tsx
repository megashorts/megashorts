'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SliderSetting, generateSliderId } from "@/lib/sliderSettings";
import { Hash, Plus } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PostSearchModal } from "./PostSearchModal";
import { useState, useEffect } from "react";
import { PostData } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface FeaturedSliderSettingsProps {
  slider: SliderSetting;
  onUpdate: (updated: SliderSetting) => void;
}

export function FeaturedSliderSettings({ slider, onUpdate }: FeaturedSliderSettingsProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<PostData[]>([]);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: slider.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handlePostCountChange = (value: string) => {
    const count = parseInt(value) || 10;
    onUpdate({ ...slider, postCount: count });
  };

  const handlePostsSelect = (posts: PostData[]) => {
    // 기존 포스트와 새로운 포스트 합치기
    const newPosts = [...selectedPosts, ...posts];
    setSelectedPosts(newPosts);
    onUpdate({
      ...slider,
      id: generateSliderId('featured', undefined, slider.order),
      manualPosts: newPosts.map(p => p.id)
    });
  };

  // 컴포넌트 마운트 시 초기 포스트 로드
  useEffect(() => {
    const loadInitialPosts = async () => {
      if (slider.manualPosts?.length) {
        try {
          const response = await fetch(`/api/admin/admin-post-search?ids=${slider.manualPosts.join(',')}`);
          if (response.ok) {
            const posts = await response.json();
            // 우선순위 순으로 정렬
            const sortedPosts = posts.sort((a: PostData, b: PostData) => 
              (b.priority || 0) - (a.priority || 0)
            );
            setSelectedPosts(sortedPosts);
          }
        } catch (error) {
          console.error('Failed to load initial posts:', error);
        }
      }
    };

    loadInitialPosts();
  }, [slider.manualPosts]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 border rounded-lg bg-card relative"
    >
      <div className="flex justify-between items-center gap-x-3 mb-2">
        <div className="flex items-center gap-x-2">
          <h1 className="text-sm ml-2">최상단 슬라이더</h1>
          <p className="text-xs text-muted-foreground">추가 포스트</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchModalOpen(true)}
          className="h-6 w-6 border"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* 포스트 수 입력 */}
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={slider.postCount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 50)) {
                  handlePostCountChange(value);
                }
              }}
              className="w-10 text-xs text-center"
            />
          </div>

          {/* 수동 추가된 포스트 목록 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1">
              {selectedPosts.map((post) => (
                <Badge 
                  key={post.id} 
                  variant="secondary"
                  className="text-xs py-0 px-2 flex items-center gap-1 group"
                >
                  <span>#{post.postNum} {post.title} / {post.priority || 0}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const newPosts = selectedPosts.filter(p => p.id !== post.id);
                      setSelectedPosts(newPosts);
                      onUpdate({
                        ...slider,
                        manualPosts: newPosts.map(p => p.id)
                      });
                    }}
                    className="opacity-0 text-base ml-1 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 포스트 검색 모달 */}
      <PostSearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onPostsSelect={handlePostsSelect}
        existingPosts={selectedPosts}
      />
    </div>
  );
}
