'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CategoryType } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

interface CategorySelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategories: CategoryType[];
  onCategoriesChange: (categories: CategoryType[]) => void;
}

export function CategorySelectModal({
  open,
  onOpenChange,
  selectedCategories,
  onCategoriesChange,
}: CategorySelectModalProps) {
  // 임시 상태 관리
  const [tempCategories, setTempCategories] = useState<CategoryType[]>([]);

  // 모달이 열릴 때 초기 상태 설정
  useEffect(() => {
    if (open) {
      setTempCategories(selectedCategories);
    }
  }, [open, selectedCategories]);

  const handleSave = () => {
    if (tempCategories.length > 0) {
      onCategoriesChange(tempCategories);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>카테고리 선택</DialogTitle>
        </DialogHeader>
        <div className="h-[300px] overflow-y-auto pr-4 -mx-6 px-6">
          <div className="space-y-1">
            {Object.values(CategoryType)
              .filter(cat => cat !== CategoryType.MSPOST && cat !== CategoryType.NOTIFICATION)
              .map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                >
                  <Checkbox
                    id={`category-${category}`}
                    checked={tempCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (typeof checked === 'boolean') {
                        const newCategories = checked
                          ? [...tempCategories, category]
                          : tempCategories.filter(c => c !== category);
                        
                        if (newCategories.length > 0) {
                          setTempCategories(newCategories);
                        }
                      }
                    }}
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
