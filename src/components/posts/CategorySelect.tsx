import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CategoryType } from "@prisma/client";

// Prisma schema의 CategoryType enum 값들과 한글 매핑
export const CATEGORIES = {
  COMIC: "코메디",
  ROMANCE: "로맨스",
  ACTION: "액션",
  THRILLER: "스릴러",
  DRAMA: "드라마",
  PERIOD: "시대물",
  FANTASY: "판타지",
  HIGHTEEN: "하이틴"
} as const;

interface CategorySelectProps {
  value: CategoryType[];
  onChange: (value: CategoryType[]) => void;
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const handleCheckboxChange = (categoryId: CategoryType, checked: boolean) => {
    if (checked) {
      onChange([...value, categoryId]);
    } else {
      onChange(value.filter(id => id !== categoryId));
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base">카테고리 선택 (다중 선택 가능)</Label>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Object.entries(CATEGORIES).map(([id, label]) => (
          <div key={id} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${id}`}
              checked={value.includes(id as CategoryType)}
              onCheckedChange={(checked: boolean) => 
                handleCheckboxChange(id as CategoryType, checked)
              }
            />
            <Label 
              htmlFor={`category-${id}`}
              className="text-sm cursor-pointer"
            >
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
