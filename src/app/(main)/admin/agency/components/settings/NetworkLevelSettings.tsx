// src/app/(main)/admin/agency/components/settings/NetworkLevelSettings.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Level {
  name: string;
  level: number;
  commissionRate: number;
}

interface NetworkLevelSettingsProps {
  levels: Level[];
  setLevels: (levels: Level[]) => void;
  loading: boolean;
  remainingCommissionRate?: number;
}

export default function NetworkLevelSettings({
  levels,
  setLevels,
  loading,
  remainingCommissionRate
}: NetworkLevelSettingsProps) {
  // 레벨 추가 (최하위 단계 바로 위에 추가)
  const addLevel = () => {
    // 레벨 번호 자동 할당
    const newLevels = [...levels];
    
    // 새 레벨 생성
    const newLevel = {
      name: `${levels.length}단계`,
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
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium"># 네트워크 단계 및 수수료 설정</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={addLevel}
          disabled={loading}
        >
          +
        </Button>
      </div>
      
      {levels.map((level, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-center text-sm">
          <div className="col-span-7">
            <div className="flex items-center">
              <span className="mr-2 text-sm text-muted-foreground">{level.level}.</span>
              <Input
                id={`network-name-${index}`}
                value={level.name}
                onChange={(e) => updateLevel(index, "name", e.target.value)}
                disabled={loading || index === 0} // 최상위 단계는 이름 변경 불가
              />
            </div>
          </div>
          <div className="col-span-3">
            {index === 0 ? (
              // 최상위 단계는 수수료 입력란 대신 계산된 수수료 표시
              <div className="h-10 flex items-center px-3">
                {remainingCommissionRate !== undefined ? remainingCommissionRate.toFixed(1) : "0.0"} %
              </div>
            ) : (
              <div className="relative">
                <Input
                  id={`network-rate-${index}`}
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
          <div className="col-span-2 flex items-center justify-center">
            {index !== 0 && index !== levels.length - 1 ? (
              // 중간 단계만 삭제 버튼 표시 (중앙 정렬)
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeLevel(index)}
                disabled={loading}
                className="mx-auto"
              >
                x
              </Button>
            ) : (
              <div className="h-4"></div> // 최상위와 최하위 단계는 삭제 버튼 대신 빈 공간
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
