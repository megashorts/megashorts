'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SliderSettingsForm } from "./SliderSettingsForm";
import { FeaturedSliderSettings } from "./FeaturedSliderSettings";
import { SliderSetting, defaultSliderSettings, generateSliderId, getMainSliderSettings, saveMainSliderSettings } from "@/lib/sliderSettings";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { CategoryType } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Save } from "lucide-react";
import { PostSearchModal } from "./PostSearchModal";
import { Badge } from "@/components/ui/badge";
import { PostData } from "@/lib/types";

export function MainSettings() {
  const [sliders, setSliders] = useState<SliderSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchModalState, setSearchModalState] = useState<{[key: string]: boolean}>({});
  const [categoryPosts, setCategoryPosts] = useState<{[key: string]: PostData[]}>({});
  const { toast } = useToast();

  // 각 카테고리의 추천 포스트 목록 로드
  useEffect(() => {
    const loadCategoryPosts = async () => {
      const categoryPromises = Object.values(CategoryType)
        .filter(category => category !== CategoryType.MSPOST && category !== CategoryType.NOTIFICATION)
        .map(async (category) => {
          try {
            const response = await fetch(`/api/admin/admin-post-search?categories=${category}&featured=true&sort=priority`);
            if (!response.ok) throw new Error('Failed to load posts');
            const posts = await response.json();
            // 우선순위 순으로 정렬
            const sortedPosts = [...posts].sort((a: PostData, b: PostData) => 
              (b.priority || 0) - (a.priority || 0)
            );
            return { category, posts: sortedPosts };
          } catch (error) {
            console.error('Failed to load posts for category:', error);
            return { category, posts: [] };
          }
        });

      const results = await Promise.all(categoryPromises);
      const postsMap = results.reduce((acc, { category, posts }) => {
        acc[category] = posts;
        return acc;
      }, {} as {[key: string]: PostData[]});

      setCategoryPosts(postsMap);
    };

    if (!isLoading) {
      loadCategoryPosts();
    }
  }, [isLoading]);

  // 포스트 추천 해제
  const handleUnfeaturePost = async (postId: string) => {
    try {
      const response = await fetch('/api/admin/featured-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          featured: false
        })
      });

      if (!response.ok) throw new Error('Failed to update post');

      // 모든 카테고리에서 해당 포스트 제거
      setCategoryPosts(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(category => {
          next[category] = next[category].filter(p => p.id !== postId);
        });
        return next;
      });

      toast({
        title: "포스트 업데이트 완료",
        description: "추천 포스트가 해제되었습니다.",
      });
    } catch (error) {
      console.error('Failed to unfeature post:', error);
      toast({
        title: "업데이트 실패",
        description: "포스트 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleOpenSearchModal = (sliderId: string) => {
    setSearchModalState(prev => ({ ...prev, [sliderId]: true }));
  };

  const handleCloseSearchModal = (sliderId: string) => {
    setSearchModalState(prev => ({ ...prev, [sliderId]: false }));
  };

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // 초기 데이터 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getMainSliderSettings();
        // Featured 슬라이더가 없으면 추가
        if (!settings.some(s => s.type === 'featured')) {
          settings.unshift({
            id: generateSliderId('featured'),
            type: 'featured',
            postCount: defaultSliderSettings.featured.postCount,
            order: 0,
            viewAllHref: defaultSliderSettings.featured.viewAllHref,
            manualPosts: []
          });
        }
        setSliders(settings);
      } catch (error) {
        console.error('Failed to load slider settings:', error);
        toast({
          title: "설정 로드 실패",
          description: "슬라이더 설정을 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  // 슬라이더 순서 변경 처리
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSliders((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        // Featured 슬라이더는 항상 최상단에 유지
        if (items[oldIndex].type === 'featured' || items[newIndex].type === 'featured') {
          return items;
        }

        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => {
          // Featured 슬라이더는 order를 0으로 유지
          const order = item.type === 'featured' ? 0 : index;
          return {
            ...item,
            order,
            id: item.type === 'category' && item.categories
              ? generateSliderId('category', item.categories, order)
              : item.type === 'featured'
              ? generateSliderId('featured', undefined, order)
              : item.id
          };
        });

        return newItems;
      });
    }
  };

  // 슬라이더 업데이트 처리
  const handleSliderUpdate = (updated: SliderSetting) => {
    console.log('Updating slider:', updated);
    setSliders(current => {
      const index = current.findIndex(slider => 
        slider.type === updated.type && slider.order === updated.order
      );
      if (index === -1) {
        const oldIndex = current.findIndex(slider => slider.id === updated.id);
        if (oldIndex === -1) {
          console.error('Slider not found:', updated);
          return current;
        }
        return current.map(slider => slider.id === updated.id ? updated : slider);
      }

      const newSliders = [...current];
      newSliders[index] = updated;
      return newSliders;
    });
  };

  // 슬라이더 삭제 처리
  const handleSliderDelete = (id: string) => {
    setSliders(current => {
      const filtered = current.filter(slider => slider.id !== id);
      return filtered.map((slider, index) => {
        const order = slider.type === 'featured' ? 0 : index + 1;
        return {
          ...slider,
          order,
          id: slider.type === 'category' && slider.categories
            ? generateSliderId('category', slider.categories, order)
            : slider.type === 'featured'
            ? generateSliderId('featured', undefined, order)
            : slider.id
        };
      });
    });
  };

  // 새 카테고리 슬라이더 추가
  const handleAddCategorySlider = () => {
    const order = sliders.length;
    const newSlider: SliderSetting = {
      id: generateSliderId('category', [], order),
      type: 'category',
      title: "새 카테고리 슬라이더",
      postCount: defaultSliderSettings.category.postCount,
      categories: [], // 빈 배열로 설정 (null 대신)
      order,
      viewAllHref: "/categories/recent" // 카테고리가 없는 경우 최신 페이지로 연결
    };
  
    setSliders(current => [...current, newSlider]);
  };

  // 랭킹 슬라이더 추가
  const handleAddRankedSlider = () => {
    const order = sliders.length;
    const newSlider: SliderSetting = {
      id: generateSliderId('ranked', undefined, order),
      type: 'ranked',
      title: "랭킹 슬라이더", // 기본 타이틀 (사용자가 변경 가능)
      postCount: defaultSliderSettings.ranked.postCount,
      rankingType: defaultSliderSettings.ranked.rankingType, // 'likes'로 기본 설정됨
      order,
      viewAllHref: defaultSliderSettings.ranked.viewAllHref
    };

    setSliders(current => [...current, newSlider]);
  };

  // 설정 저장
  const handleSave = async () => {
    try {
      await saveMainSliderSettings(sliders);
      toast({
        title: "설정 저장 완료",
        description: "슬라이더 설정이 저장되었습니다.",
      });
    } catch (error) {
      console.error('Failed to save slider settings:', error);
      toast({
        title: "설정 저장 실패",
        description: "슬라이더 설정 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="ml-2">설정을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="space-y-6">
          {/* 슬라이더 설정 섹션 */}
          <div>
            <h5 className="text-base font-medium mb-2 mt-4">
              슬라이더 관리
              <p className="text-xs text-muted-foreground">
                # 포스트 숫자 / 슬라이더별 타이틀, 위치관리, 추가, 삭제.
              </p>
            </h5>
            <div className="space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sliders.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sliders.map((slider) => (
                    slider.type === 'featured' ? (
                      <FeaturedSliderSettings
                        key={slider.id}
                        slider={slider}
                        onUpdate={handleSliderUpdate}
                      />
                    ) : (
                      <SliderSettingsForm
                        key={slider.id}
                        slider={slider}
                        onUpdate={handleSliderUpdate}
                        onDelete={() => handleSliderDelete(slider.id)}
                        isFixed={slider.type === 'latest' || slider.type === 'ranked'}
                      />
                    )
                  ))}
                </SortableContext>
              </DndContext>

              <div className="flex gap-2 mt-2">
                <Button
                  onClick={handleAddCategorySlider}
                  className="flex-1"
                  variant="outline"
                >
                  + 카테고리 슬라이더
                </Button>
                <Button
                  onClick={handleAddRankedSlider}
                  className="flex-1"
                  variant="outline"
                >
                  + 랭킹 슬라이더
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* 추천 포스트 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-base font-medium">추천 포스트 관리</h5>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleOpenSearchModal('global')}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <PostSearchModal
                open={searchModalState['global'] || false}
                onOpenChange={(open) => {
                  if (!open) handleCloseSearchModal('global');
                }}
                onPostsSelect={async (posts) => {
                  try {
                    // 선택된 포스트들의 featured/priority 업데이트
                    const updatePromises = posts.map(post => 
                      fetch('/api/admin/featured-priority', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: post.id,
                          featured: true,
                          priority: post.priority || 0
                        })
                      }).then(res => {
                        if (!res.ok) throw new Error('Update failed');
                        return res.json();
                      })
                    );

                    const updatedPosts = await Promise.all(updatePromises);

                    // 각 포스트를 해당하는 카테고리에 추가
                    const postsByCategory = updatedPosts.reduce<{[key: string]: PostData[]}>((acc, post) => {
                      post.categories.forEach((category: CategoryType) => {
                        if (category !== CategoryType.MSPOST && category !== CategoryType.NOTIFICATION) {
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(post);
                        }
                      });
                      return acc;
                    }, {});

                    // 로컬 상태 업데이트
                    setCategoryPosts(prev => {
                      const next = { ...prev };
                      Object.entries(postsByCategory).forEach(([category, posts]) => {
                        next[category] = [...(next[category] || []), ...posts]
                          .sort((a, b) => (b.priority || 0) - (a.priority || 0));
                      });
                      return next;
                    });

                    toast({
                      title: "포스트 업데이트 완료",
                      description: "추천 포스트가 추가되었습니다.",
                    });
                  } catch (error) {
                    console.error('Failed to update posts:', error);
                    toast({
                      title: "업데이트 실패",
                      description: "포스트 업데이트에 실패했습니다.",
                      variant: "destructive",
                    });
                  }
                  handleCloseSearchModal('global');
                }}
              />
            </div>
            <div className="space-y-2">
              {Object.values(CategoryType)
                .filter(category => category !== CategoryType.MSPOST && category !== CategoryType.NOTIFICATION)
                .map(category => (
                  <div key={category} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                      <h6 className="text-sm font-medium">
                        {category}
                      </h6>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {categoryPosts[category]?.map((post) => (
                        <Badge 
                          key={post.id} 
                          variant="secondary"
                          className="text-xs py-0 px-2 flex items-center gap-1 group"
                        >
                          <span>#{post.postNum} {post.title} / {post.priority || 0}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleUnfeaturePost(post.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <Separator />

          {/* 저장 버튼 */}
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-5 w-5" />
            </Button>
          </div>

          <Separator />
        </div>
      </CardContent>
    </Card>
  );
}
