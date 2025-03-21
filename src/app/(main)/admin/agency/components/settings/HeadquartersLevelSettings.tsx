
// src/app/(main)/admin/agency/components/settings/HeadquartersLevelSettings.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash, Trash2, Plus, UsersRound, Wallet, CircleDollarSign, CircleMinus, CirclePlus } from "lucide-react";

interface SubLevel {
  id: string;
  name: string;
  level: number;
  commissionRate: number;
  qualification?: {
    enabled: boolean;
    memberCount: {
      enabled: boolean;
      threshold: number;
    };
    pointsGenerated: {
      enabled: boolean;
      threshold: number;
    };
    referralAmount: {
      enabled: boolean;
      threshold: number;
    };
    useCondition: 'any' | 'all';
  };
}

interface Level {
  name: string;
  level: number;
  commissionRate: number;
  subLevels?: SubLevel[];
}

interface HeadquartersLevelSettingsProps {
  levels: Level[];
  setLevels: (levels: Level[]) => void;
  loading: boolean;
  remainingCommissionRate?: number;
}

export default function HeadquartersLevelSettings({
  levels,
  setLevels,
  loading,
  remainingCommissionRate
}: HeadquartersLevelSettingsProps) {
  // 레벨 추가 (최하위 단계 바로 위에 추가)
  const addLevel = () => {
    // 레벨 번호 자동 할당
    const newLevels = [...levels];
    
    // 새 레벨 생성
    const newLevel = {
      name: `중간 단계 ${levels.length}`,
      level: levels.length,
      commissionRate: 1
    };
    
    // 최하위 단계를 제외한 모든 단계 + 새 단계 + 최하위 단계
    const updatedLevels = [
      ...newLevels.slice(0, newLevels.length - 1),
      newLevel,
      newLevels[newLevels.length - 1]
    ];
    
    // 레벨 번호 재할당
    const reorderedLevels = updatedLevels.map((level, idx) => ({
      ...level,
      level: idx + 1
    }));
    
    setLevels(reorderedLevels);
  };
  
  // 레벨 삭제 (최상위와 최하위 단계는 삭제 불가)
  const removeLevel = (index: number) => {
    // 최상위(0)와 최하위(length-1) 단계는 삭제 불가
    if (index === 0 || index === levels.length - 1) return;
    
    const newLevels = [...levels];
    newLevels.splice(index, 1);
    
    // 레벨 번호 재할당
    const reorderedLevels = newLevels.map((level, idx) => ({
      ...level,
      level: idx + 1
    }));
    
    setLevels(reorderedLevels);
  };
  
  // 레벨 업데이트
  const updateLevel = (index: number, field: keyof Level, value: string | number) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };
  
  // 서브레벨 추가
  const addSubLevel = (levelIndex: number) => {
    // 최상위와 최하위 레벨에는 서브레벨 추가 불가
    if (levelIndex === 0 || levelIndex === levels.length - 1) return;
    
    const newLevels = [...levels];
    const targetLevel = newLevels[levelIndex];
    
    // 서브레벨 배열이 없으면 초기화
    if (!targetLevel.subLevels) {
      targetLevel.subLevels = [];
    }
    
    const subLevelNumber = targetLevel.subLevels.length + 1;

    // 새 서브레벨 추가
    const newSubLevel: SubLevel = {
      id: `sublevel-${Date.now()}`,
      name: `${targetLevel.name} ${targetLevel.subLevels.length + 1}`,
      level: parseFloat(`${targetLevel.level}.${subLevelNumber}`),
      commissionRate: Math.max(1, targetLevel.commissionRate - 1), // 기본값은 메인 레벨보다 1% 작게
      qualification: {
        enabled: false,
        memberCount: { enabled: false, threshold: 10 },
        pointsGenerated: { enabled: false, threshold: 100000 },
        referralAmount: { enabled: false, threshold: 50000 },
        useCondition: 'any'
      }
    };
    
    targetLevel.subLevels.push(newSubLevel);
    setLevels(newLevels);
  };
  
  // 서브레벨 삭제
  const removeSubLevel = (levelIndex: number, subLevelIndex: number) => {
    const newLevels = [...levels];
    const targetLevel = newLevels[levelIndex];
    
    if (targetLevel.subLevels) {
      targetLevel.subLevels.splice(subLevelIndex, 1);

      // 서브레벨 level 값 재할당 (삭제 후 연속된 숫자로 정렬)
      targetLevel.subLevels = targetLevel.subLevels.map((subLevel, idx) => ({
        ...subLevel,
        level: parseFloat(`${targetLevel.level}.${idx + 1}`)
      }));

      setLevels(newLevels);
    }
  };
  
  // 서브레벨 업데이트
  const updateSubLevel = (levelIndex: number, subLevelIndex: number, field: keyof SubLevel, value: any) => {
    const newLevels = [...levels];
    const targetLevel = newLevels[levelIndex];
    
    if (targetLevel.subLevels && targetLevel.subLevels[subLevelIndex]) {
      if (field === 'commissionRate') {
        // 수수료 비율은 메인 레벨보다 클 수 없음
        const maxRate = targetLevel.commissionRate;
        value = Math.min(Number(value), maxRate);
      }
      
      targetLevel.subLevels[subLevelIndex] = { 
        ...targetLevel.subLevels[subLevelIndex], 
        [field]: value 
      };
      
      setLevels(newLevels);
    }
  };
  
  // 서브레벨 자격 조건 업데이트
  const updateSubLevelQualification = (
    levelIndex: number, 
    subLevelIndex: number, 
    path: string[], 
    value: any
  ) => {
    const newLevels = [...levels];
    const targetLevel = newLevels[levelIndex];
    
    if (targetLevel.subLevels && targetLevel.subLevels[subLevelIndex]) {
      const subLevel = targetLevel.subLevels[subLevelIndex];
      
      // qualification이 없으면 초기화
      if (!subLevel.qualification) {
        subLevel.qualification = {
          enabled: false,
          memberCount: { enabled: false, threshold: 10 },
          pointsGenerated: { enabled: false, threshold: 100000 },
          referralAmount: { enabled: false, threshold: 50000 },
          useCondition: 'any'
        };
      }
      
      // 중첩 객체 업데이트
      let current: any = subLevel.qualification;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      
      setLevels(newLevels);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">본부구조 수직/수평 확장 및 수수료 설정</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={addLevel}
          disabled={loading}
        >
          <CirclePlus className="h-6 w-6" />
        </Button>
      </div>
      
      {levels.map((level, index) => (
        <React.Fragment key={index}>
          <div className="grid grid-cols-12 gap-2 items-center text-sm">
            <div className="col-span-7">
              <div className="flex items-center">
                <span className="mr-2 text-sm text-muted-foreground">{level.level}.</span>
                <Input
                  id={`hq-name-${index}`}
                  value={level.name}
                  onChange={(e) => updateLevel(index, "name", e.target.value)}
                  disabled={loading || index === 0} // 본부는 이름 변경 불가
                />
              </div>
            </div>
            <div className="col-span-3">
              {index === 0 ? (
                // 본부는 수수료 입력란 대신 계산된 수수료 표시
                <div className="h-10 flex items-center px-3">
                  {remainingCommissionRate !== undefined ? remainingCommissionRate.toFixed(1) : "0.0"} %
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id={`hq-rate-${index}`}
                    type="number"
                    value={level.commissionRate}
                    onChange={(e) => updateLevel(index, "commissionRate", Number(e.target.value))}
                    disabled={loading}
                    className="pr-6"
                    // 스피너(위아래 삼각형) 제거
                    style={{ appearance: "textfield" }}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              )}
            </div>
            <div className="col-span-2 flex items-center justify-center space-x-1">
              {index !== 0 && index !== levels.length - 1 ? (
                <>
                  {/* 서브레벨 추가 버튼 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSubLevel(index)}
                    disabled={loading}
                    className="px-2"
                  >
                    <CirclePlus className="h-5 w-5" />
                  </Button>
                  
                  {/* 레벨 삭제 버튼 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLevel(index)}
                    disabled={loading}
                    className="px-2"
                  >
                    <CircleMinus className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <div className="h-4"></div> // 본부와 멤버는 삭제 버튼 대신 빈 공간
              )}
            </div>
          </div>
          
          {/* 서브레벨 UI */}
          {level.subLevels && level.subLevels.length > 0 && (
            <div className="pl-6 space-y-2 border-l-2 border-muted ml-2 mt-2">
              {level.subLevels.map((subLevel, subIndex) => (
                <div key={subLevel.id} className="grid grid-cols-12 gap-2 items-center text-sm">
                  <div className="col-span-7">
                    <div className="flex items-center">
                      <span className="mr-2 text-sm text-muted-foreground">{level.level}-{subIndex+1}.</span>
                      <Input
                        id={`sublevel-name-${index}-${subIndex}`}
                        value={subLevel.name}
                        onChange={(e) => updateSubLevel(index, subIndex, "name", e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="relative">
                      <Input
                        id={`sublevel-rate-${index}-${subIndex}`}
                        type="number"
                        value={subLevel.commissionRate}
                        onChange={(e) => updateSubLevel(index, subIndex, "commissionRate", Number(e.target.value))}
                        disabled={loading}
                        className="pr-6"
                        style={{ appearance: "textfield" }}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    {/* 서브레벨 삭제 버튼 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubLevel(index, subIndex)}
                      disabled={loading}
                      className="px-2"
                    >
                      <CircleMinus className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* 자격 취득 조건 UI (접이식) */}
                  <div className="col-span-12 pl-6">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        자격 취득 조건 설정
                      </summary>
                      <div className="p-2 border rounded-md mt-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`qualification-enabled-${index}-${subIndex}`}
                            checked={subLevel.qualification?.enabled || false}
                            onChange={(e) => {
                              updateSubLevelQualification(index, subIndex, ['enabled'], e.target.checked);
                            }}
                            disabled={loading}
                          />
                          <Label htmlFor={`qualification-enabled-${index}-${subIndex}`}>
                            자동 자격 부여 활성화
                          </Label>
                        </div>
                        
                        {/* 자격 취득 조건 상세 설정 */}
                        {subLevel.qualification?.enabled && (
                          <div className="space-y-2 md:space-y-0 pt-2">
                            {/* 데스크톱에서는 한 줄에 나란히 배치 */}
                            <div className="md:flex md:space-x-2 md:justify-between">
                              {/* 하위 회원 수 조건 */}
                              <div className="flex items-center mb-2 md:mb-0 md:flex-1">
                                <Switch
                                  id={`member-count-${index}-${subIndex}`}
                                  checked={subLevel.qualification?.memberCount?.enabled || false}
                                  onChange={(e) => {
                                    updateSubLevelQualification(index, subIndex, ['memberCount', 'enabled'], e.target.checked);
                                  }}
                                  disabled={loading}
                                  className="mr-2"
                                />
                                <UsersRound className="h-8 w-8 text-muted-foreground mr-1" />
                                <Input
                                  type="number"
                                  value={subLevel.qualification?.memberCount?.threshold || 10}
                                  onChange={(e) => {
                                    updateSubLevelQualification(index, subIndex, ['memberCount', 'threshold'], Number(e.target.value));
                                  }}
                                  disabled={loading || !subLevel.qualification?.memberCount?.enabled}
                                  className="w-full text-right ml-1"
                                  style={{ appearance: "textfield" }}
                                />
                                <span className="text-xs ml-1 mr-6">명</span>
                              </div>
                              
                              {/* 하위 시청 포인트 조건 */}
                              <div className="flex items-center mb-2 md:mb-0 md:flex-1">
                                <Switch
                                  id={`points-generated-${index}-${subIndex}`}
                                  checked={subLevel.qualification?.pointsGenerated?.enabled || false}
                                  onChange={(e) => {
                                    updateSubLevelQualification(index, subIndex, ['pointsGenerated', 'enabled'], e.target.checked);
                                  }}
                                  disabled={loading}
                                  className="mr-2"
                                />
                                <Wallet className="h-8 w-8 text-muted-foreground mr-1" />
                                <Input
                                  type="number"
                                  value={subLevel.qualification?.pointsGenerated?.threshold || 100000}
                                  onChange={(e) => {
                                    updateSubLevelQualification(index, subIndex, ['pointsGenerated', 'threshold'], Number(e.target.value));
                                  }}
                                  disabled={loading || !subLevel.qualification?.pointsGenerated?.enabled}
                                  className="w-full text-right ml-1  mr-6"
                                  style={{ appearance: "textfield" }}
                                />
                                <span className="text-xs ml-1">P</span>
                              </div>
                              
                              {/* 하위 추천 금액 조건 */}
                              <div className="flex items-center md:flex-1">
                                <Switch
                                  id={`referral-amount-${index}-${subIndex}`}
                                  checked={subLevel.qualification?.referralAmount?.enabled || false}
                                  onChange={(e) => {
                                    updateSubLevelQualification(index, subIndex, ['referralAmount', 'enabled'], e.target.checked);
                                  }}
                                  disabled={loading}
                                  className="mr-2"
                                />
                                <CircleDollarSign className="h-8 w-8 text-muted-foreground mr-1" />
                                <Input
                                  type="number"
                                  value={subLevel.qualification?.referralAmount?.threshold || 50000}
                                  onChange={(e) => {
                                    updateSubLevelQualification(index, subIndex, ['referralAmount', 'threshold'], Number(e.target.value));
                                  }}
                                  disabled={loading || !subLevel.qualification?.referralAmount?.enabled}
                                  className="w-full text-right ml-1 mr-6"
                                  style={{ appearance: "textfield" }}
                                />
                                <span className="text-xs ml-1">원</span>
                              </div>
                            </div>
                            
                            {/* 조건 적용 방식 */}
                            <div className="flex items-center space-x-2 pt-1">
                              <Label className="text-xs">조건 적용:</Label>
                              <select
                                value={subLevel.qualification?.useCondition || 'any'}
                                onChange={(e) => {
                                  updateSubLevelQualification(index, subIndex, ['useCondition'], e.target.value);
                                }}
                                disabled={loading}
                                className="text-xs p-1 border rounded"
                              >
                                <option value="any">하나라도 충족</option>
                                <option value="all">모두 충족</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
