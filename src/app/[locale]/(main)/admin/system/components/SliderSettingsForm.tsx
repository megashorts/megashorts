'use client';

import { CategoryType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SliderSetting, generateCategoryViewAllHref, generateSliderId } from "@/lib/sliderSettings";
import { GripVertical, Hash, Tags, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { CategorySelectModal } from "./CategorySelectModal";
import { useState } from "react";
import { Globe } from "lucide-react";

interface SliderSettingsFormProps {
  slider: SliderSetting;
  onUpdate: (updated: SliderSetting) => void;
  onDelete?: () => void;
  isFixed?: boolean;
}

export function SliderSettingsForm({ slider, onUpdate, onDelete, isFixed }: SliderSettingsFormProps) {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [showI18n, setShowI18n] = useState(false);
  
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

  const handleTitleChange = (value: string) => {
    onUpdate({ ...slider, title: value });
  };

  const handleI18nChange = (locale: string, value: string) => {
    onUpdate({ 
      ...slider, 
      titleI18n: { 
        ...(slider.titleI18n || {}), 
        [locale]: value 
      } 
    });
  };

  const handlePostCountChange = (value: string) => {
    const count = parseInt(value) || 10;
    onUpdate({ ...slider, postCount: count });
  };

  const handleRankingTypeChange = (value: string) => {
    if (slider.type === 'ranked') {
      onUpdate({ ...slider, rankingType: value as 'likes' | 'views' });
    }
  };

  const handleCategoryChange = (categories: CategoryType[]) => {
    if (slider.type === 'category' && categories.length > 0) {
      const { order } = slider;
      const newId = generateSliderId('category', categories, order);
      const viewAllHref = generateCategoryViewAllHref(categories);
      const updatedSlider = {
        ...slider,
        categories,
        id: newId,
        viewAllHref,
        order // order 유지
      };
      console.log('Updating slider with categories:', categories, updatedSlider);
      onUpdate(updatedSlider);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-2 border rounded-lg bg-card relative"
    >
      {/* 드래그 핸들 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-2 top-5 cursor-move"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      <div className="space-y-2 pr-5">
        {/* 타이틀 입력 */}
        <div className="flex gap-2">
          <Input
            value={slider.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Slider Title (Default - English)"
            className="text-sm flex-1"
          />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowI18n(!showI18n)}
            className={`shrink-0 ${showI18n ? 'bg-primary/10 text-primary' : ''}`}
            title="Set Multilingual Title"
          >
            <Globe className="h-4 w-4" />
          </Button>
        </div>

        {/* 다국어 입력 (토글 시 표시) */}
        {showI18n && (
          <div className="space-y-2 pl-2 border-l-2 border-primary/20 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold w-8">KO</span>
              <Input
                value={slider.titleI18n?.['ko'] || ''}
                onChange={(e) => handleI18nChange('ko', e.target.value)}
                placeholder="Korean Title"
                className="text-sm h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold w-8">ZH</span>
              <Input
                value={slider.titleI18n?.['zh'] || ''}
                onChange={(e) => handleI18nChange('zh', e.target.value)}
                placeholder="Chinese Title"
                className="text-sm h-8"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
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

            {/* 랭킹 타입 선택 (랭킹 슬라이더인 경우) */}
            {slider.type === 'ranked' && (
              <>
                <Select
                  value={slider.rankingType}
                  onValueChange={handleRankingTypeChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Ranking Criteria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="likes">By Likes</SelectItem>
                    <SelectItem value="views">By Views</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            
            {/* {slider.type === 'latest' && (
              <Select
                value={slider.rankingType}
                onValueChange={handleRankingTypeChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ranking Criteria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="likes">By Likes</SelectItem>
                  <SelectItem value="views">By Views</SelectItem>
                </SelectContent>
              </Select>
            )} */}

            {/* 카테고리 선택 (카테고리 슬라이더인 경우) */}
            {slider.type === 'category' && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCategoryModalOpen(true)}
                  className="shrink-0"
                >
                  <Tags className="h-3 w-3" />
                </Button>
                <div className="flex flex-wrap gap-1 min-w-0 overflow-hidden">
                  {slider.categories?.map((category) => (
                    <Badge 
                      key={category} 
                      variant="secondary"
                      className="text-xs py-0 px-2"
                    >
                      {category}
                    </Badge>
                  ))}
                  {(!slider.categories || slider.categories.length === 0) && (
                    <span className="text-xs text-muted-foreground">
                      Select Categories
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 삭제 버튼 (고정 슬라이더가 아닌 경우) */}
          {!isFixed && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive hover:text-destructive shrink-0 h-8 w-8 ml-2"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* 카테고리 선택 모달 */}
      {slider.type === 'category' && (
        <CategorySelectModal
          open={categoryModalOpen}
          onOpenChange={setCategoryModalOpen}
          selectedCategories={slider.categories ?? []}
          onCategoriesChange={handleCategoryChange}
        />
      )}
    </div>
  );
}
