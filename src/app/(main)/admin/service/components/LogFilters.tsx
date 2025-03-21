'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, User2, Globe, Search, LogIn, CreditCard, FileText, Video, Settings2 } from 'lucide-react';
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

// 로그 타입 아이콘 정의
type LogType = keyof typeof TYPE_DISPLAY_NAMES;

const typeIcons = {
  auth: { icon: <LogIn className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.auth },
  payment: { icon: <CreditCard className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.payment },
  post: { icon: <FileText className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.post },
  video: { icon: <Video className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.video },
  system: { icon: <Settings2 className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.system }
} as const;

function isValidLogType(type: string): type is LogType {
  return type in typeIcons;
}

function getTypeIcon(type: string) {
  if (isValidLogType(type)) {
    return typeIcons[type].icon;
  }
  return typeIcons.system.icon;
}

type CountryOption = {
  code: Language | null;
  label: string;
};

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: null, label: '모든 국가' },
  { code: Language.KOREAN, label: '대한민국' },
  { code: Language.ENGLISH, label: '영어권' },
  { code: Language.CHINESE, label: '중국' },
  { code: Language.JAPANESE, label: '일본' },
  { code: Language.THAI, label: '태국' },
  { code: Language.SPANISH, label: '스페인어권' },
  { code: Language.INDONESIAN, label: '인도네시아' },
  { code: Language.VIETNAMESE, label: '베트남' },
];

export function LogFilters({ filters, onFiltersChange }: LogFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);

  const handleDateSelect = (option: '1hour' | 'today' | '2days') => {
    let newRange: DateRange;
    const now = new Date();
    now.setHours(23, 59, 59, 999);  // 오늘 끝시간
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);  // 오늘 시작시간
    
    switch (option) {
      case '1hour':
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        newRange = { from: oneHourAgo, to: new Date() };
        break;
      case 'today':
        newRange = { from: start, to: now };
        break;
      case '2days':
        newRange = { 
          from: subDays(start, 1), 
          to: now 
        };
        break;
      default:
        return;
    }
    
    setDateRange(newRange);
    onFiltersChange({
      ...filters,
      startDate: newRange.from,
      endDate: newRange.to
    });
    
    // 팝업 닫기
    setMobileOpen(false);
    setDesktopOpen(false);
  };

  const handleRangeSelect: DayPickerRangeProps['onSelect'] = (range) => {
    if (!range) {
      setDateRange(null);
      return;
    }

    const { from, to } = range;
    
    // from만 있는 경우 (첫 번째 날짜만 선택한 경우)
    if (from && !to) {
      const newRange = { from, to: from };
      setDateRange(newRange);
      
      // 시작일과 종료일 모두 선택한 날짜로 설정
      const date = new Date(from);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      onFiltersChange({
        ...filters,
        startDate: start,
        endDate: end
      });
    }
    // from과 to 모두 있는 경우 (날짜 범위를 선택한 경우)
    else if (from && to) {
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

  const handleInputChange = (field: keyof LogFiltersState, value: any) => {
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

  // 날짜 표시 형식
  const formatDateDisplay = (range: DateRange | null) => {
    if (!range) return '날짜 선택';
    
    // 같은 날짜인 경우 (단일 날짜 선택)
    if (range.from.getTime() === range.to.getTime()) {
      return format(range.from, 'MM-dd');
    }
    
    // 최근 1시간인 경우
    const now = new Date();
    const oneHourAgo = new Date(now);
    oneHourAgo.setHours(now.getHours() - 1);
    if (Math.abs(range.from.getTime() - oneHourAgo.getTime()) < 60000 && 
        Math.abs(range.to.getTime() - now.getTime()) < 60000) {
      return '최근 1시간';
    }
    
    // 오늘인 경우
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    if (Math.abs(range.from.getTime() - todayStart.getTime()) < 60000 && 
        Math.abs(range.to.getTime() - todayEnd.getTime()) < 60000) {
      return '오늘';
    }
    
    // 최근 2일인 경우
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    if (Math.abs(range.from.getTime() - yesterday.getTime()) < 60000 && 
        Math.abs(range.to.getTime() - todayEnd.getTime()) < 60000) {
      return '최근 2일';
    }
    
    // 일반 날짜 범위
    return `${format(range.from, 'MM-dd')} ~ ${format(range.to, 'MM-dd')}`;
  };

  return (
    <div>
      {/* 모바일 레이아웃 */}
      <div className="md:hidden space-y-2">
        {/* 첫 번째 줄: 기간 선택 + 사용자 ID */}
        <div className="flex gap-2 items-center">
          <Popover open={mobileOpen} onOpenChange={setMobileOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                <CalendarIcon className="mr-1 h-3 w-3" />
                <span className="text-xs truncate">
                  {formatDateDisplay(dateRange)}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0 ml-5 max-h-[500px] overflow-auto" align="center" sideOffset={5}>
              <div className="p-2 space-y-0">
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7"
                    onClick={() => handleDateSelect('1hour')}
                  >
                    최근 1시간
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7"
                    onClick={() => handleDateSelect('today')}
                  >
                    오늘
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7"
                    onClick={() => handleDateSelect('2days')}
                  >
                    최근 2일
                  </Button>
                </div>
                
                <div className="flex justify-center h-[350px] pb-0">
                  <Calendar
                    mode="range"
                    selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={handleRangeSelect}
                    initialFocus
                    locale={ko}
                    className="text-xs scale-[0.9]"
                  />
                </div>
                
                <Button 
                  size="sm"
                  className="w-full text-xs h-7 mb-4" 
                  onClick={() => setMobileOpen(false)}
                  disabled={!dateRange}
                >
                  기간 선택 완료
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex-1 min-w-[80px]">
            <div className="relative">
              <User2 className="absolute left-2 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder=""
                value={filters.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                className="w-full pl-8 text-xs h-10"
              />
            </div>
          </div>
        </div>

        {/* 두 번째 줄: 타입 아이콘 + 국가 + 검색 버튼 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="flex gap-[1px]">
              {Object.keys(TYPE_DISPLAY_NAMES).map((type) => (
                <Button
                  key={type}
                  variant={filters.types.includes(type) ? "default" : "outline"}
                  onClick={() => handleTypeChange(type)}
                  className="m-1 p-0 h-7 w-7"
                  title={TYPE_DISPLAY_NAMES[type as keyof typeof TYPE_DISPLAY_NAMES]}
                >
                  {getTypeIcon(type)}
                </Button>
              ))}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-0 ml-1">
                  <Globe className="h-5 w-5" />
                  {filters.country && <LanguageFlag language={filters.country as Language} className="ml-1 h-3 w-3" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-0">
                <div className="p-2 grid grid-cols-3 gap-1">
                  <Button
                    key="all"
                    variant="ghost"
                    className="flex justify-center p-1 h-6"
                    onClick={() => handleInputChange('country', null as any)}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  {COUNTRY_OPTIONS.filter(option => option.code).map(({ code }) => (
                    <Button
                      key={code}
                      variant="ghost"
                      className="flex justify-center p-1 h-6"
                      onClick={() => handleInputChange('country', code)}
                    >
                      <LanguageFlag language={code as Language} className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={handleSearch} size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 데스크톱 레이아웃 (한 줄) */}
      <div className="hidden md:flex md:flex-wrap md:gap-2 md:items-center">
        <Popover open={desktopOpen} onOpenChange={setDesktopOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="text-sm">
                {formatDateDisplay(dateRange)}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start" sideOffset={5}>
            <div className="p-2 space-y-2">
              <div className="flex flex-col space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => handleDateSelect('1hour')}
                >
                  최근 1시간
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => handleDateSelect('today')}
                >
                  오늘
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => handleDateSelect('2days')}
                >
                  최근 2일
                </Button>
              </div>
              
              <Calendar
                mode="range"
                selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
                onSelect={handleRangeSelect}
                initialFocus
                locale={ko}
                className="text-sm"
              />
              
              <Button 
                className="w-full text-sm" 
                onClick={() => setDesktopOpen(false)}
                disabled={!dateRange}
              >
                기간 선택 완료
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-[200px]">
          <div className="relative">
            <User2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="사용자 ID"
              value={filters.userId}
              onChange={(e) => handleInputChange('userId', e.target.value)}
              className="w-full pl-9 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 ml-1">
          {Object.keys(TYPE_DISPLAY_NAMES).map((type) => (
            <Button
              key={type}
              variant={filters.types.includes(type) ? "default" : "outline"}
              onClick={() => handleTypeChange(type)}
              className="p-2 h-9 w-9"
              title={TYPE_DISPLAY_NAMES[type as keyof typeof TYPE_DISPLAY_NAMES]}
            >
              {getTypeIcon(type)}
            </Button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 w-10 p-0 ml-1">
              <Globe className="h-5 w-5" />
              {filters.country && <LanguageFlag language={filters.country as Language} className="ml-1" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <div className="p-2 grid grid-cols-3 gap-1">
              <Button
                key="all"
                variant="ghost"
                className="flex justify-center"
                onClick={() => handleInputChange('country', null as any)}
              >
                <Globe className="h-4 w-4" />
              </Button>
              {COUNTRY_OPTIONS.filter(option => option.code).map(({ code }) => (
                <Button
                  key={code}
                  variant="ghost"
                  className="flex justify-center"
                  onClick={() => handleInputChange('country', code)}
                >
                  <LanguageFlag language={code as Language} />
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={handleSearch} size="icon" className="h-9 w-9 ml-auto">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
