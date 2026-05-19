import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CategoryType } from "@prisma/client";

import { useTranslations } from "next-intl";

interface CategorySelectProps {
  value: CategoryType[];
  onChange: (value: CategoryType[]) => void;
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const t = useTranslations('Category');
  
  const selectableCategories: CategoryType[] = [
    "COMEDY", "ROMANCE", "ACTION", "THRILLER", "DRAMA", 
    "PERIODPLAY", "FANTASY", "HIGHTEEN", "ADULT", "HUMANE", 
    "CALM", "VARIETYSHOW"
  ];

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
        {selectableCategories.map((catId) => (
          <div key={catId} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${catId}`}
              checked={value.includes(catId)}
              onCheckedChange={(checked: boolean) => 
                handleCheckboxChange(catId, checked)
              }
            />
            <Label 
              htmlFor={`category-${catId}`}
              className="text-sm cursor-pointer"
            >
              {t(catId)}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
