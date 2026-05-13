"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CircleMinus } from "lucide-react";

// 중간관리자 타입 정의
export interface MiddleManager {
  level: number;
  enabled: boolean;
  name: string;
  // level: number;
  commissionRate: number;
  conditions: {
    memberCount: boolean;
    // chargeAmount: boolean;
    viewCount: boolean;
  };
  thresholds: {
    memberCount: number;
    // chargeAmount: number;
    viewCount: number;
  };
  duplicateDistribution: string; // 쉼표로 구분된 비율 값 (예: "60,40")
}

interface NetworkMiddleManagerSettingsProps {
  managers: MiddleManager[];
  setManagers: (managers: MiddleManager[]) => void;
  loading: boolean;
}

export default function NetworkMiddleManagerSettings({
  managers,
  setManagers,
  loading
}: NetworkMiddleManagerSettingsProps) {

  // 중간관리자 삭제
  const removeManager = (index: number) => {
    const newManagers = [...managers];
    newManagers.splice(index, 1);
    setManagers(newManagers);
  };

  // 중간관리자 업데이트
  const updateManager = (index: number, field: keyof MiddleManager, value: any) => {
    const newManagers = [...managers];
    newManagers[index] = { ...newManagers[index], [field]: value };
    setManagers(newManagers);
  };

  // 중간관리자 조건 업데이트
  const updateCondition = (index: number, condition: keyof MiddleManager['conditions'], value: boolean) => {
    const newManagers = [...managers];
    newManagers[index] = {
      ...newManagers[index],
      conditions: {
        ...newManagers[index].conditions,
        [condition]: value
      }
    };
    setManagers(newManagers);
  };

  // 중간관리자 임계값 업데이트
  const updateThreshold = (index: number, threshold: keyof MiddleManager['thresholds'], value: number) => {
    const newManagers = [...managers];
    newManagers[index] = {
      ...newManagers[index],
      thresholds: {
        ...newManagers[index].thresholds,
        [threshold]: value
      }
    };
    setManagers(newManagers);
  };

  return (
    <div className="space-y-4">
      {managers.map((manager, index) => (
        <div key={manager.level} className="space-y-4 border p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Switch
                id={`manager-enabled-${manager.level}`}
                checked={manager.enabled}
                onChange={(e) => updateManager(index, "enabled", e.target.checked)}
                disabled={loading}
              />
              <Label htmlFor={`manager-enabled-${manager.level}`}></Label>
            </div>
            
            {index > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeManager(index)}
                disabled={loading}
                className="items-center"
              >
                <CircleMinus className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {/* <Label htmlFor={`manager-name-${manager.id}`}>중간관리자 이름</Label> */}
              <Input
                id={`manager-name-${manager.level}`}
                value={manager.name}
                onChange={(e) => updateManager(index, "name", e.target.value)}
                disabled={loading || !manager.enabled}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              {/* <Label htmlFor={`manager-rate-${manager.id}`}>수수료 비율</Label> */}
              <div className="relative">
                <Input
                  id={`manager-rate-${manager.level}`}
                  type="number"
                  value={manager.commissionRate}
                  onChange={(e) => updateManager(index, "commissionRate", Number(e.target.value))}
                  disabled={loading || !manager.enabled}
                  className="text-sm pr-6"
                  // 스피너(위아래 삼각형) 제거
                  style={{ appearance: "textfield" }}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </div>
          
          {/* <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">* 매니져 설정 자동화 옵션</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`manager-condition-member-${manager.id}`}
                  checked={manager.conditions.memberCount}
                  onChange={(e) => updateCondition(index, "memberCount", e.target.checked)}
                  disabled={loading || !manager.enabled}
                />
                <Label htmlFor={`manager-condition-member-${manager.id}`}>산하 회원수</Label>
                <Input
                  id={`manager-threshold-member-${manager.id}`}
                  type="number"
                  value={manager.thresholds.memberCount}
                  onChange={(e) => updateThreshold(index, "memberCount", Number(e.target.value))}
                  disabled={loading || !manager.enabled || !manager.conditions.memberCount}
                  style={{ appearance: "textfield" }}
                  className="w-20"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`manager-condition-usage-${manager.id}`}
                  checked={manager.conditions.viewCount}
                  onChange={(e) => updateCondition(index, "viewCount", e.target.checked)}
                  disabled={loading || !manager.enabled}
                />
                <Label htmlFor={`manager-condition-usage-${manager.id}`}>산하 유료시청</Label>
                <Input
                  id={`manager-threshold-usage-${manager.id}`}
                  type="number"
                  value={manager.thresholds.viewCount}
                  onChange={(e) => updateThreshold(index, "viewCount", Number(e.target.value))}
                  disabled={loading || !manager.enabled || !manager.conditions.viewCount}
                  style={{ appearance: "textfield" }}
                  className="w-40"
                />
              </div>
            </div>
          </div> */}
          
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs" htmlFor={`manager-duplicate-${manager.level}`}># 동일자격 매니져 중복처리 (미입력시 근접 1인 지급)</Label>
            <div className="flex space-x-2">
              <Input
                id={`manager-duplicate-${manager.level}`}
                value={manager.duplicateDistribution}
                onChange={(e) => updateManager(index, "duplicateDistribution", e.target.value)}
                placeholder="예: 60, 40 (가까운 순서대로 60%, 40% 지급)"
                disabled={loading || !manager.enabled}
                className="text-xs"
              />
              {/* <Button
                variant="outline"
                size="icon"
                disabled={loading || !manager.enabled}
                title="중간관리자 조회"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </Button> */}
            </div>
            {/* <p className="text-xs text-muted-foreground">
              미입력시 근접한 매니져에게 전부 지급됩니다.
            </p> */}
          </div>
        </div>
      ))}
    </div>
  );
}
