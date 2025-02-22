'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SliderSettingsForm } from "./SliderSettingsForm";
import { SliderSetting, defaultSliderSettings, generateCategoryViewAllHref, generateSliderId, getMainSliderSettings, saveMainSliderSettings } from "@/lib/sliderSettings";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { CategoryType } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";

export function MainSettings() {
  const [sliders, setSliders] = useState<SliderSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
        
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => {
          const order = index + 1;
          return {
            ...item,
            order,
            id: item.type === 'category' && item.categories
              ? generateSliderId('category', item.categories, order)
              : item.id
          };
        });

        return newItems;
      });
    }
  };

  // 슬라이더 업데이트 처리
  const handleSliderUpdate = (updated: SliderSetting) => {
    console.log('Updating slider:', updated); // 디버깅 로그
    setSliders(current => {
      // type과 order로 슬라이더 찾기
      const index = current.findIndex(slider => 
        slider.type === updated.type && slider.order === updated.order
      );
      if (index === -1) {
        // 기존 방식으로 한번 더 시도
        const oldIndex = current.findIndex(slider => slider.id === updated.id);
        if (oldIndex === -1) {
          console.error('Slider not found:', updated);
          return current;
        }
        return current.map(slider => slider.id === updated.id ? updated : slider);
      }

      // 새 배열 생성
      const newSliders = [...current];
      newSliders[index] = updated;

      console.log('New sliders state:', newSliders); // 디버깅 로그
      return newSliders;
    });
  };

  // 슬라이더 삭제 처리
  const handleSliderDelete = (id: string) => {
    setSliders(current => {
      const filtered = current.filter(slider => slider.id !== id);
      return filtered.map((slider, index) => {
        const order = index + 1;
        return {
          ...slider,
          order,
          id: slider.type === 'category' && slider.categories
            ? generateSliderId('category', slider.categories, order)
            : slider.id
        };
      });
    });
  };

  // 새 카테고리 슬라이더 추가
  const handleAddCategorySlider = () => {
    const defaultCategory = CategoryType.ROMANCE;
    const order = sliders.length + 1;
    const newSlider: SliderSetting = {
      id: generateSliderId('category', [defaultCategory], order),
      type: 'category',
      title: "새 카테고리 슬라이더",
      postCount: defaultSliderSettings.category.postCount,
      categories: [defaultCategory],
      order,
      viewAllHref: `/categories/${defaultCategory}`
    };

    console.log('Adding new slider:', newSlider); // 디버깅 로그
    setSliders(current => {
      const newSliders = [...current, newSlider];
      console.log('New sliders state after adding:', newSliders); // 디버깅 로그
      return newSliders;
    });
  };

  // 설정 저장
  const SliderhandleSave = async () => {
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
      {/* <CardHeader>
        <CardTitle>Main slider & </CardTitle>
        <CardDescription>
          
        </CardDescription>
      </CardHeader> */}
      <CardContent>
        <div className="space-y-6">
          {/* 슬라이더 설정 섹션 */}
          <div>
            <h5 className="text-lg font-medium mb-2 mt-4">
              슬라이더 관리
              <p className="text-xs text-muted-foreground">
                드래그앤드롭으로 슬라이더 순서와 추가/삭제 및 변경이 가능합니다.
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
                    <SliderSettingsForm
                      key={slider.id}
                      slider={slider}
                      onUpdate={handleSliderUpdate}
                      onDelete={() => handleSliderDelete(slider.id)}
                      isFixed={slider.type === 'latest' || slider.type === 'ranked'}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <Button
                onClick={handleAddCategorySlider}
                className="w-full"
                variant="outline"
              >
                +
              </Button>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end">
            <Button onClick={SliderhandleSave}>
              <Save className="h-5 w-5" />
            </Button>
          </div>

          <Separator />

          {/* 추천 포스트 섹션 */}
          <div>
            <h5 className="text-lg font-medium mb-4">추천 포스트 관리</h5>
            <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                추천 포스트 관리 기능이 추가될 예정입니다.
              </p>
            </div>
          </div>

          <Separator />


        </div>
      </CardContent>
    </Card>
  );
}
