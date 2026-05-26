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
      name: `Level ${levels.length + 1}`,
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
          <h3 className="text-lg font-medium">Level & Commission Settings</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addLevel}
            disabled={loading}
          >
            Add Level
          </Button>
        </div>
        
        {levels.map((level, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <Label htmlFor={`binary-name-${index}`}>Name</Label>
              <Input
                id={`binary-name-${index}`}
                value={level.name}
                onChange={(e) => updateLevel(index, "name", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`binary-level-${index}`}>Level</Label>
              <Input
                id={`binary-level-${index}`}
                type="number"
                value={level.level}
                onChange={(e) => updateLevel(index, "level", Number(e.target.value))}
                disabled={loading}
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`binary-rate-${index}`}>Commission (%)</Label>
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
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* 자동 자격 부여 설정 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Middle Manager Auto Qualification Settings</h3>
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
            <Label htmlFor="binary-auto-qualification">Enable Auto Qualification</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="binary-member-count">Sub-members</Label>
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
              <Label htmlFor="binary-charge-amount">Charge Amount</Label>
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
              <Label htmlFor="binary-usage-amount">Usage Amount</Label>
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
              <Label htmlFor="binary-use-condition">Condition Type</Label>
              <Select
                value={autoQualification.useCondition}
                onValueChange={(val: "memberCount" | "chargeAmount" | "usageAmount" | "both") => setAutoQualification({
                  ...autoQualification,
                  useCondition: val
                })}
                disabled={loading || !autoQualification.enabled}
              >
                <SelectTrigger id="binary-use-condition">
                  <SelectValue placeholder="Select Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="memberCount">Sub-members</SelectItem>
                  <SelectItem value="chargeAmount">Charge Amount</SelectItem>
                  <SelectItem value="usageAmount">Usage Amount</SelectItem>
                  <SelectItem value="both">All Conditions Met</SelectItem>
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
          Only register additional members when 2 sub-members are met
        </Label>
      </div>
    </div>
  );
}
