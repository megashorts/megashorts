"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/SessionProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { USER_ROLE, USER_ROLE_NAME } from "@/lib/constants";
import UserSearchInput from "@/components/admin/UserSearchInput";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertCircle, Settings, UserMinus } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@radix-ui/react-select";

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  userRole: number;
  settings?: any;
}

export default function TeamMasterSettings() {
  const { user } = useSession();
  const currentUser = user?.displayName ? { displayName: user.displayName, id: user.id } : undefined;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [teamMasters, setTeamMasters] = useState<User[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("add");
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  
  // 팀마스터 설정
  const [masterType, setMasterType] = useState<string>("HEADQUARTERS");
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [useMemberLimit, setUseMemberLimit] = useState<boolean>(false);
  
  // 팀마스터 목록 불러오기
  useEffect(() => {
    loadTeamMasters();
  }, []);
  
  const loadTeamMasters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/team-master-list');
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.teamMasters) {
        setTeamMasters(data.teamMasters);
      }
    } catch (error) {
      console.error("팀마스터 목록을 불러오는 중 오류가 발생했습니다:", error);
      toast({
        description: "팀마스터 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 사용자 설정 불러오기
  const loadUserSettings = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agency/settings?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const settings = data.data;
        setMasterType(settings.masterType || "HEADQUARTERS");
        setCommissionRate(settings.settings?.defaultCommissionRate || 10);
        
        // 네트워크 바이너리 설정인 경우 멤버 제한 설정
        if (settings.masterType === "BINARY_NETWORK") {
          setUseMemberLimit(true);
        } else if (settings.masterType === "NETWORK") {
          setUseMemberLimit(false);
        }
      } else {
        // 기본값 설정
        setMasterType("HEADQUARTERS");
        setCommissionRate(10);
        setUseMemberLimit(false);
      }
    } catch (error) {
      console.error("사용자 설정을 불러오는 중 오류가 발생했습니다:", error);
      toast({
        description: "사용자 설정을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 1500,
      });
      
      // 기본값 설정
      setMasterType("HEADQUARTERS");
      setCommissionRate(10);
      setUseMemberLimit(false);
    } finally {
      setLoading(false);
    }
  };
  
  // 사용자 선택 처리
  const handleUserSelect = useCallback((user: User | null) => {
    setSelectedUser(user);
    if (user) {
      loadUserSettings(user.id);
    }
  }, []);
  
  // 설정 저장
  const saveSettings = async () => {
    if (!selectedUser) {
      toast({
        description: "사용자를 선택해주세요.",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // 사용자 역할 업데이트
      const userId = selectedUser.id;
      const roleUpdateUrl = `/api/admin/users/${userId}/role`;
      
      const roleUpdateResponse = await fetch(roleUpdateUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userRole: USER_ROLE.TEAM_MASTER
        })
      });
      
      if (!roleUpdateResponse.ok) {
        throw new Error(`사용자 역할 업데이트 실패: ${roleUpdateResponse.status} ${roleUpdateResponse.statusText}`);
      }
      
      // 마스터 타입 설정
      let actualMasterType = masterType;
      if (masterType === "NETWORK" && useMemberLimit) {
        actualMasterType = "BINARY_NETWORK";
      }
      
      // 수수료 합계 검증
      let levels: any[] = [];
      
      if (actualMasterType === "HEADQUARTERS") {
        levels = [
          { name: selectedUser.displayName, level: 1, commissionRate: 90 },
          { name: "대리점", level: 2, commissionRate: 7 },
          { name: "멤버", level: 3, commissionRate: 3 }
        ];
        
        // 하위 레벨 수수료 합계 계산
        const lowerLevelsSum = levels.slice(1).reduce((sum, level) => sum + level.commissionRate, 0);
        
        // 마스터 수수료 자동 계산
        levels[0].commissionRate = 100 - lowerLevelsSum;
      } else if (actualMasterType === "NETWORK") {
        levels = [
          { name: selectedUser.displayName, level: 1, commissionRate: 90 },
          { name: "2단계", level: 2, commissionRate: 7 },
          { name: "3단계", level: 3, commissionRate: 3 }
        ];
        
        // 하위 레벨 수수료 합계 계산
        const lowerLevelsSum = levels.slice(1).reduce((sum, level) => sum + level.commissionRate, 0);
        
        // 마스터 수수료 자동 계산
        levels[0].commissionRate = 100 - lowerLevelsSum;
      } else if (actualMasterType === "BINARY_NETWORK") {
        levels = [
          { name: selectedUser.displayName, level: 1, commissionRate: 90 },
          { name: "2단계", level: 2, commissionRate: 7 },
          { name: "3단계", level: 3, commissionRate: 3 }
        ];
        
        // 하위 레벨 수수료 합계 계산
        const lowerLevelsSum = levels.slice(1).reduce((sum, level) => sum + level.commissionRate, 0);
        
        // 마스터 수수료 자동 계산
        levels[0].commissionRate = 100 - lowerLevelsSum;
      }
      
      // 기본 설정 객체 생성
      const baseSettings = {
        defaultCommissionRate: commissionRate
      };
      
      // 마스터 타입에 따른 설정 추가
      let typeSpecificSettings = {};
      
      if (actualMasterType === "HEADQUARTERS") {
        typeSpecificSettings = {
          headquarters: {
            levels: levels
          }
        };
      } else if (actualMasterType === "NETWORK") {
        typeSpecificSettings = {
          network: {
            levels: levels,
            autoQualification: {
              enabled: false,
              memberCount: 10,
              chargeAmount: 100000,
              usageAmount: 50000,
              useCondition: "memberCount"
            }
          }
        };
      } else if (actualMasterType === "BINARY_NETWORK") {
        typeSpecificSettings = {
          network: {
            levels: levels,
            autoQualification: {
              enabled: false,
              memberCount: 10,
              chargeAmount: 100000,
              usageAmount: 50000,
              useCondition: "memberCount"
            }
          },
          binaryNetwork: {
            requireBothLegs: true
          }
        };
      }
      
      // 팀마스터 설정 저장
      const settings = {
        userId: selectedUser.id,
        masterType: actualMasterType,
        settings: {
          ...baseSettings,
          ...typeSpecificSettings
        }
      };
      
      const response = await fetch("/api/agency/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          description: "팀마스터 설정이 저장되었습니다.",
          variant: "default",
          duration: 1500,
        });
        
        // 목록 다시 불러오기
        loadTeamMasters();
      } else {
        throw new Error(data.error || "설정 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("설정 저장 중 오류가 발생했습니다:", error);
      toast({
        description: "설정 저장 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 팀마스터 설정 해제
  const handleRemoveTeamMaster = async () => {
    if (!removeUserId) return;
    
    try {
      setLoading(true);
      
      const response = await fetch("/api/admin/team-master-remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId: removeUserId })
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          description: "팀마스터 설정이 해제되었습니다.",
          variant: "default",
          duration: 1500,
        });
        
        // 목록 다시 불러오기
        loadTeamMasters();
      } else {
        throw new Error(data.error || "설정 해제에 실패했습니다.");
      }
    } catch (error) {
      console.error("팀마스터 설정 해제 중 오류가 발생했습니다:", error);
      toast({
        description: "팀마스터 설정 해제 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setLoading(false);
      setRemoveDialogOpen(false);
      setRemoveUserId(null);
    }
  };
  
  // 마스터 타입 이름 가져오기
  const getMasterTypeName = (type: string) => {
    switch (type) {
      case "HEADQUARTERS": return "본부구조";
      case "NETWORK": return "네트워크";
      case "BINARY_NETWORK": return "네트워크 바이너리";
      default: return "알 수 없음";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>영업본부 마스터 설정</CardTitle>
        <CardDescription>
          본부별 마스터 권한 부여 및 설정 관리.
        </CardDescription>
      </CardHeader>
      <CardContent>
          
        <div className="space-y-2 mb-2">
          {/* 사용자 검색 */}
          <div className="space-y-2">
            <Label></Label>
            <UserSearchInput
              onSelect={handleUserSelect}
              selectedUser={selectedUser}
              placeholder="유저네임 또는 이메일"
              disabled={loading}
              className="w-full"
            />
          </div>
          
          {/* 팀마스터 설정 */}
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="masterType">본부 타입</Label>
                <Select
                  value={masterType}
                  onValueChange={(value) => {
                    setMasterType(value);
                    if (value === "NETWORK") {
                      setUseMemberLimit(false);
                    }
                  }}
                  disabled={loading}
                >
                  <SelectTrigger id="masterType">
                    <SelectValue placeholder="본부 타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEADQUARTERS">본부구조</SelectItem>
                    <SelectItem value="NETWORK">네트워크</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="commissionRate">기본 수수료 비율 (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              
              {(masterType === "NETWORK" || masterType === "BINARY_NETWORK") && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="useMemberLimit"
                    checked={masterType === "BINARY_NETWORK" ? true : useMemberLimit}
                    onChange={(e) => setUseMemberLimit(e.target.checked)}
                    disabled={loading || masterType === "BINARY_NETWORK"}
                  />
                  <Label htmlFor="useMemberLimit">
                    하위회원 수 제한 (네트워크 바이너리)
                  </Label>
                </div>
              )}
              
              <div className="flex justify-end pb-3">
                <Button
                  onClick={saveSettings}
                  disabled={loading || !selectedUser}
                >
                  {loading ? "저장 중..." : "설정 저장"}
                </Button>
              </div>

              <div className="flex justify-end">
<Separator className="border w-full"/>
              </div>

            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : teamMasters.length > 0 ? (
            <div className="space-y-2">
              {teamMasters.map((master) => (
                <div key={master.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-base">{master.displayName}</h3>
                      {/* <p className="text-sm text-muted-foreground">{master.username}</p> */}
                      <p className="text-sm text-muted-foreground">{master.email}</p>
                      {master.settings && (
                        <div className="mt-2">
                          <p className="text-sm">
                            <span className="font-medium"></span> {getMasterTypeName(master.settings.masterType)} -
                            <span className="font-medium"></span> {master.settings.settings?.defaultCommissionRate || 0}%
                          </p>

                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {/* 설정 버튼 */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // 해당 팀마스터의 설정을 불러와서 기존 UI에 표시
                          setSelectedUser(master);
                          loadUserSettings(master.id);
                          // 화면 상단으로 스크롤
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      
                      {/* 해제 버튼 */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setRemoveUserId(master.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>팀마스터 설정 해제</DialogTitle>
                          <DialogDescription>
                            {master.displayName}님의 팀마스터 설정을 해제하시겠습니까?
                            <br />
                            설정을 해제하면 관련 데이터가 모두 삭제됩니다.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setRemoveUserId(null)}>
                            취소
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleRemoveTeamMaster}
                            disabled={loading}
                          >
                            {loading ? "처리 중..." : "설정 해제"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-md">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">등록된 팀마스터가 없습니다.</p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
