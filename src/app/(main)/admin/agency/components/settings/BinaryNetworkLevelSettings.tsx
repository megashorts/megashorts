// src/app/(main)/admin/agency/components/settings/BinaryNetworkLevelSettings.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Level {
  name: string;
  level: number;
  commissionRate: number;
}

interface AutoQualification {
  enabled: boolean;
  memberCount: number;
  chargeAmount: number;
  usageAmount: number;
  useCondition: "memberCount" | "chargeAmount" | "usageAmount" | "both";
}

interface BinaryNetworkLevelSettingsProps {
  levels: Level[];
  setLevels: (levels: Level[]) => void;
  autoQualification: AutoQualification;
  setAutoQualification: (autoQualification: AutoQualification) => void;
  requireBothLegs: boolean;
  setRequireBothLegs: (requireBothLegs: boolean) => void;
  loading: boolean;
}

export default function BinaryNetworkLevelSettings({
  levels,
  setLevels,
  autoQualification,
  setAutoQualification,
  requireBothLegs,
  setRequireBothLegs,
  loading
}: BinaryNetworkLevelSettingsProps) {
  // 레벨 추가
  const addLevel = () => {
    const newLevel = {
      name: `${levels.length + 1}단계`,
      level: levels.length + 1,
      commissionRate: 1
    };
    setLevels([...levels, newLevel]);
  };
  
  // 레벨 삭제
  const removeLevel = (index: number) => {
    const newLevels = [...levels];
    newLevels.splice(index, 1);
    setLevels(newLevels);
  };
  
  // 레벨 업데이트
  const updateLevel = (index: number, field: keyof Level, value: string | number) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };
  
  return (
    <div className="space-y-6">
      {/* 단계 및 수수료 설정 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">단계 및 수수료 설정</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addLevel}
            disabled={loading}
          >
            단계 추가
          </Button>
        </div>
        
        {levels.map((level, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <Label htmlFor={`binary-name-${index}`}>이름</Label>
              <Input
                id={`binary-name-${index}`}
                value={level.name}
                onChange={(e) => updateLevel(index, "name", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`binary-level-${index}`}>단계</Label>
              <Input
                id={`binary-level-${index}`}
                type="number"
                value={level.level}
                onChange={(e) => updateLevel(index, "level", Number(e.target.value))}
                disabled={loading}
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`binary-rate-${index}`}>수수료 (%)</Label>
              <Input
                id={`binary-rate-${index}`}
                type="number"
                value={level.commissionRate}
                onChange={(e) => updateLevel(index, "commissionRate", Number(e.target.value))}
                disabled={loading}
              />
            </div>
            <div className="col-span-2 flex items-end justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeLevel(index)}
                disabled={loading}
              >
                삭제
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* 자동 자격 부여 설정 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">중간 관리자 자동 자격 부여 설정</h3>
        <div className="space-y-4 border p-4 rounded-md">
          <div className="flex items-center space-x-2">
            <Switch
              id="binary-auto-qualification"
              checked={autoQualification.enabled}
              onChange={(e) => setAutoQualification({
                ...autoQualification,
                enabled: e.target.checked
              })}
              disabled={loading}
            />
            <Label htmlFor="binary-auto-qualification">자동 자격 부여 활성화</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="binary-member-count">하위회원 수</Label>
              <Input
                id="binary-member-count"
                type="number"
                value={autoQualification.memberCount}
                onChange={(e) => setAutoQualification({
                  ...autoQualification,
                  memberCount: Number(e.target.value)
                })}
                disabled={loading || !autoQualification.enabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="binary-charge-amount">충전 금액</Label>
              <Input
                id="binary-charge-amount"
                type="number"
                value={autoQualification.chargeAmount}
                onChange={(e) => setAutoQualification({
                  ...autoQualification,
                  chargeAmount: Number(e.target.value)
                })}
                disabled={loading || !autoQualification.enabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="binary-usage-amount">사용 금액</Label>
              <Input
                id="binary-usage-amount"
                type="number"
                value={autoQualification.usageAmount}
                onChange={(e) => setAutoQualification({
                  ...autoQualification,
                  usageAmount: Number(e.target.value)
                })}
                disabled={loading || !autoQualification.enabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="binary-use-condition">조건 적용 방식</Label>
              <Select
                value={autoQualification.useCondition}
                onValueChange={(val: "memberCount" | "chargeAmount" | "usageAmount" | "both") => setAutoQualification({
                  ...autoQualification,
                  useCondition: val
                })}
                disabled={loading || !autoQualification.enabled}
              >
                <SelectTrigger id="binary-use-condition">
                  <SelectValue placeholder="조건 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="memberCount">하위회원 수</SelectItem>
                  <SelectItem value="chargeAmount">충전 금액</SelectItem>
                  <SelectItem value="usageAmount">사용 금액</SelectItem>
                  <SelectItem value="both">모두 충족</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      {/* 하위회원 제한 설정 */}
      <div className="flex items-center space-x-2">
        <Switch
          id="require-both-legs"
          checked={requireBothLegs}
          onChange={(e) => setRequireBothLegs(e.target.checked)}
          disabled={loading}
        />
        <Label htmlFor="require-both-legs">
          하위회원 2명이 충족될 때만 추가 회원 등록 가능
        </Label>
      </div>
    </div>
  );
}
