"use client";

import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface DateFilterButtonProps {
  date?: Date;
  onSelect: (dateRange: DateRange | undefined) => void;
}

export default function DateFilterButton({ date, onSelect }: DateFilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [displayText, setDisplayText] = useState<string>("");
  const today = new Date();

  const getPresetDate = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case "today":
        return { 
          start: today, 
          end: today, 
          label: format(today, "yyyy-MM-dd")  // 오늘 날짜
        };
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return { 
          start: yesterday, 
          end: today, 
          label: format(yesterday, "yyyy-MM-dd") + " ~"  // 어제 날짜 ~
        };
      }
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return { 
          start: weekAgo, 
          end: today, 
          label: format(weekAgo, "yyyy-MM-dd") + " ~"  // 일주일 전 날짜 ~
        };
      }
      default:
        return { 
          start: today, 
          end: today, 
          label: format(today, "yyyy-MM-dd")
        };
    }
  };

  const handlePresetSelect = (preset: string) => {
    const dateRange = getPresetDate(preset);
    setDisplayText(dateRange.label);
    onSelect(dateRange);
    setIsOpen(false);
  };

  const handleAllSelect = () => {
    setDisplayText("전체");
    onSelect(undefined);  // undefined를 전달하여 날짜 필터 제거
    setIsOpen(false);
  };

  const handleCalendarSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const selectedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      setDisplayText(format(selectedDate, "yyyy-MM-dd"));  // 선택한 날짜
      onSelect({ 
        start: selectedDate, 
        end: selectedDate,
        label: format(selectedDate, "yyyy-MM-dd")
      });
    } else {
      setDisplayText("");
      onSelect(undefined);
    }
    setIsCalendarOpen(false);
    setIsOpen(false);
  };

  // 컴포넌트 마운트 시 오늘 날짜로 초기화
  useEffect(() => {
    if (!date) {
      handlePresetSelect("today");
    }
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Calendar className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuItem onClick={() => handleAllSelect()} className="gap-2 text-sm">
            전체
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect("today")} className="gap-2 text-sm">
            오늘
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect("yesterday")} className="gap-2 text-sm">
            어제부터
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect("week")} className="gap-2 text-sm">
            일주일전부터
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="p-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left font-normal"
                >
                  지정일 선택
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="single"
                  defaultMonth={date || today}
                  selected={date}
                  onSelect={handleCalendarSelect}
                />
              </PopoverContent>
            </Popover>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {displayText && (
        <span className="text-sm text-muted-foreground">
          {displayText}
        </span>
      )}
    </div>
  );
}