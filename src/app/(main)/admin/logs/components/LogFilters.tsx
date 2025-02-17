'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, User2, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LogFiltersProps, LogFiltersState } from '../types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TYPE_DISPLAY_NAMES } from '@/lib/activity-logger/constants';

export function LogFilters({ filters, onFiltersChange }: LogFiltersProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newFilters: LogFiltersState = {
        ...filters,
        startDate: date,
        endDate: date
      };
      onFiltersChange(newFilters);
    }
  };

  const handleInputChange = (field: keyof LogFiltersState, value: string) => {
    const newFilters: LogFiltersState = {
      ...filters,
      [field]: value
    };
    onFiltersChange(newFilters);
  };

  const handleTypeChange = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t: string) => t !== type)
      : [...filters.types, type];
    
    onFiltersChange({
      ...filters,
      types: newTypes
    });
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.startDate ? (
              format(filters.startDate, 'PPP', { locale: ko })
            ) : (
              <span>날짜 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <User2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="사용자 ID"
              value={filters.userId}
              onChange={(e) => handleInputChange('userId', e.target.value)}
              className="w-[200px] pl-9"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>사용자 ID로 검색</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="국가"
              value={filters.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-[120px] pl-9"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>국가 코드로 검색</TooltipContent>
      </Tooltip>

      <div className="flex gap-2">
        {Object.entries(TYPE_DISPLAY_NAMES).map(([type, label]) => (
          <Button
            key={type}
            variant={filters.types.includes(type) ? "default" : "outline"}
            onClick={() => handleTypeChange(type)}
            className="px-3 py-1 h-8"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
