'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, User2, Globe, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LogFiltersProps, LogFiltersState, DateRange } from '../types';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TYPE_DISPLAY_NAMES } from '@/lib/activity-logger/constants';
import LanguageFlag from '@/components/LanguageFlag';
import { Language } from '@prisma/client';
import { DayPickerRangeProps } from 'react-day-picker';

const COUNTRY_OPTIONS = [
  { code: '', label: '모든 국가' },
  { code: Language.KOREAN, label: '대한민국' },
  { code: Language.ENGLISH, label: '영어권' },
  { code: Language.CHINESE, label: '중국' },
  { code: Language.JAPANESE, label: '일본' },
  { code: Language.THAI, label: '태국' },
  { code: Language.SPANISH, label: '스페인어권' },
  { code: Language.INDONESIAN, label: '인도네시아' },
  { code: Language.VIETNAMESE, label: '베트남' },
] as const;

export function LogFilters({ filters, onFiltersChange }: LogFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateSelect = (option: 'today' | '2days' | 'custom') => {
    let newRange: DateRange;
    const now = new Date();
    now.setHours(23, 59, 59, 999);  // 오늘 끝시간
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);  // 오늘 시작시간
    
    switch (option) {
      case 'today':
        newRange = { from: start, to: now };
        break;
      case '2days':
        newRange = { 
          from: subDays(start, 1), 
          to: now 
        };
        break;
      case 'custom':
        setShowCalendar(true);
        return;
      default:
        return;
    }
    
    setShowCalendar(false);
    setDateRange(newRange);
    onFiltersChange({
      ...filters,
      startDate: newRange.from,
      endDate: newRange.to
    });
  };

  const handleRangeSelect: DayPickerRangeProps['onSelect'] = (range) => {
    if (!range) {
      setDateRange(null);
      return;
    }

    const { from, to } = range;
    if (from && to) {
      const newRange = { from, to };
      setDateRange(newRange);
      
      // 시작일은 00:00:00, 종료일은 23:59:59로 설정
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      onFiltersChange({
        ...filters,
        startDate: start,
        endDate: end
      });
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

  const handleSearch = () => {
    // 검색 버튼 클릭 시 부모 컴포넌트에 검색 실행 알림
    onFiltersChange({
      ...filters,
      page: 1,  // 검색 시 첫 페이지로
      timestamp: new Date().toISOString()  // 강제 리프레시
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange ? (
                format(dateRange.from, 'PPP', { locale: ko }) +
                (dateRange.from.getTime() !== dateRange.to.getTime() ? 
                  ' ~ ' + format(dateRange.to, 'PPP', { locale: ko }) : 
                  '')
              ) : (
                <span>날짜 선택</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-2 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleDateSelect('today')}
              >
                오늘
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleDateSelect('2days')}
              >
                최근 2일
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleDateSelect('custom')}
              >
                기간 선택
              </Button>
              {showCalendar && (
                <Calendar
                  mode="range"
                  selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
                  onSelect={handleRangeSelect}
                  initialFocus
                  locale={ko}
                />
              )}
            </div>
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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[120px]">
              <Globe className="mr-2 h-4 w-4" />
              {filters.country ? (
                <LanguageFlag language={filters.country} />
              ) : (
                '모든 국가'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <div className="p-2 space-y-1">
              {COUNTRY_OPTIONS.map(({ code, label }) => (
                <Button
                  key={code || 'all'}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleInputChange('country', code)}
                >
                  {code ? <LanguageFlag language={code} /> : null}
                  <span className="ml-2">{label}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

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

        <Button onClick={handleSearch} className="ml-auto">
          <Search className="mr-2 h-4 w-4" />
          검색
        </Button>
      </div>
    </div>
  );
}
