// src/app/(main)/admin/agency/components/Agencysettings.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/SessionProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { USER_ROLE, USER_ROLE_NAME } from "@/lib/constants";
import { AlertCircle, IdCard, Info, Save } from "lucide-react";
import UserSearchInput from "@/components/admin/UserSearchInput";
import NetworkMiddleManagerSettings, { MiddleManager } from "./NetworkMiddleManagerSettings";
import HeadquartersLevelSettings from "./settings/HeadquartersLevelSettings";
import NetworkLevelSettings from "./settings/NetworkLevelSettings";
import { Separator } from "@/components/ui/separator";

// 타입 정의
interface Level {
  name: string;
  level: number;
  commissionRate: number;
}

interface TeamMasterUser {
  id: string;
  username?: string;
  email?: string;
  displayName: string;
  userRole: number;
}

export default function Agencysettings() {
  const { user } = useSession();
  const currentUser = user ? { 
    displayName: user.displayName, 
    id: user.id, 
    userRole: user.userRole || USER_ROLE.USER,
    username: user.username,
    // avatarUrl: user.avatarUrl
  } : undefined;
  
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [selectedTeamMaster, setSelectedTeamMaster] = useState<TeamMasterUser | null>(null);
  
  // 팀마스터 설정
  const [masterType, setMasterType] = useState<string>("");
  const [remainingCommissionRate, setRemainingCommissionRate] = useState<number>(0);
  
  // 기본 수수료 비율 (팀마스터 설정 탭에서 설정)
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(0);
  
  // 본부구조 설정
  const [headquartersLevels, setHeadquartersLevels] = useState<Level[]>([
    { name: "본부마스터", level: 1, commissionRate: 5 },
    { name: "대리점", level: 2, commissionRate: 3 },
    { name: "멤버", level: 3, commissionRate: 1 }
  ]);
  
  // 네트워크 설정
  const [networkLevels, setNetworkLevels] = useState<Level[]>([
    { name: "본부마스터", level: 1, commissionRate: 5 },
    { name: "2단계", level: 2, commissionRate: 3 },
    { name: "3단계", level: 3, commissionRate: 1 }
  ]);
  
  // 중간관리자 설정
  const [networkMiddleManagers, setNetworkMiddleManagers] = useState<MiddleManager[]>([
    {
      id: "mm1",
      enabled: false,
      name: "매니져 1",
      commissionRate: 3,
      conditions: {
        memberCount: false,
        chargeAmount: false,
        usageAmount: false
      },
      thresholds: {
        memberCount: 10,
        chargeAmount: 100000,
        usageAmount: 50000
      },
      duplicateDistribution: ""
    }
  ]);
  
  // 네트워크 바이너리 설정
  const [requireBothLegs, setRequireBothLegs] = useState(false);
  
  // 관리자 권한 확인 (OPERATION3 이상)
  const isAdmin = currentUser?.userRole && currentUser.userRole >= USER_ROLE.OPERATION3;
  
  // 사용자 정보 및 설정 불러오기
  useEffect(() => {
    if (currentUser?.id && !loading) {
      if (isAdmin) {
        // 관리자인 경우 자신을 기본 선택
        setSelectedTeamMaster({
          id: currentUser.id,
          username: currentUser.username || "",
          email: "",
          displayName: currentUser.displayName,
          userRole: currentUser.userRole
        });
      } else {
        loadUserInfo();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 선택된 팀마스터가 변경되면 설정 불러오기
  useEffect(() => {
    if (selectedTeamMaster?.id) {
      loadSettings(selectedTeamMaster.id);
    }
  }, [selectedTeamMaster]);
  
  // 수수료 합계 계산
  const calculateCommission = useCallback(() => {
    let totalCommission = 0;
    
    if (masterType === "HEADQUARTERS") {
      // 본부구조 수수료 계산 (첫 번째 레벨 제외)
      totalCommission = headquartersLevels.slice(1).reduce((sum, level) => sum + level.commissionRate, 0);
    } else if (masterType === "NETWORK" || masterType === "BINARY_NETWORK") {
      // 네트워크 수수료 계산 (첫 번째 레벨 제외)
      totalCommission = networkLevels.slice(1).reduce((sum, level) => sum + level.commissionRate, 0);
      
      // 중간관리자 수수료 추가
      totalCommission += networkMiddleManagers
        .filter(manager => manager.enabled)
        .reduce((sum, manager) => sum + manager.commissionRate, 0);
    }
    
    // 남은 수수료 계산 (마스터의 수수료)
    const remaining = 100 - totalCommission;
    return remaining < 0 ? 0 : remaining;
  }, [masterType, headquartersLevels, networkLevels, networkMiddleManagers]);
  
  // 수수료 합계 계산 및 남은 수수료 업데이트
  useEffect(() => {
    const remaining = calculateCommission();
    setRemainingCommissionRate(remaining);
    
    // 첫 번째 레벨(마스터)의 수수료 자동 업데이트
    if (masterType === "HEADQUARTERS" && headquartersLevels.length > 0) {
      if (headquartersLevels[0].commissionRate !== remaining || 
          (selectedTeamMaster && headquartersLevels[0].name !== selectedTeamMaster.displayName)) {
        const updatedLevels = [...headquartersLevels];
        updatedLevels[0] = { 
          ...updatedLevels[0], 
          commissionRate: remaining,
          name: selectedTeamMaster?.displayName || "본부마스터"
        };
        setHeadquartersLevels(updatedLevels);
      }
    } else if ((masterType === "NETWORK" || masterType === "BINARY_NETWORK") && networkLevels.length > 0) {
      if (networkLevels[0].commissionRate !== remaining || 
          (selectedTeamMaster && networkLevels[0].name !== selectedTeamMaster.displayName)) {
        const updatedLevels = [...networkLevels];
        updatedLevels[0] = { 
          ...updatedLevels[0], 
          commissionRate: remaining,
          name: selectedTeamMaster?.displayName || "본부마스터"
        };
        setNetworkLevels(updatedLevels);
      }
    }
  }, [masterType, calculateCommission, selectedTeamMaster]);
  
  // 사용자 정보 불러오기
  const loadUserInfo = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      // 실제 API가 구현되면 해당 API를 호출
      // 현재는 더미 데이터 사용
      const userInfoData = {
        id: currentUser?.id,
        displayName: currentUser?.displayName,
        userRole: currentUser?.userRole || USER_ROLE.TEAM_MASTER,
        masterType: "HEADQUARTERS",
        memberCount: 120,
        totalPoints: 25000,
        defaultCommissionRate: 10
      };
      
      setUserInfo(userInfoData);
      setDefaultCommissionRate(userInfoData.defaultCommissionRate || 0);
      
      // 팀마스터 자신을 선택
      setSelectedTeamMaster({
        id: userInfoData.id || "",
        username: currentUser?.username || "",
        email: "",
        displayName: userInfoData.displayName || "",
        userRole: userInfoData.userRole
      });
    } catch (error) {
      console.error("사용자 정보를 불러오는 중 오류가 발생했습니다:", error);
      toast({
        description: "사용자 정보를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 설정 불러오기
  const loadSettings = async (userId: string) => {
    if (loading) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/agency/settings?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const settings = data.data;
        setMasterType(settings.masterType);
        setDefaultCommissionRate(settings.settings?.defaultCommissionRate || 0);
        
        // 본부구조 설정
        if (settings.masterType === "HEADQUARTERS" && settings.settings.headquarters?.levels) {
          const levels = [...settings.settings.headquarters.levels];
          // 첫 번째 레벨의 이름을 마스터 이름으로 설정
          if (levels.length > 0 && selectedTeamMaster) {
            levels[0].name = selectedTeamMaster.displayName;
          }
          setHeadquartersLevels(levels);
        } else if (settings.masterType === "HEADQUARTERS") {
          // 기본값 설정
          setHeadquartersLevels([
            { name: selectedTeamMaster?.displayName || "본부마스터", level: 1, commissionRate: 5 },
            { name: "대리점", level: 2, commissionRate: 3 },
            { name: "멤버", level: 3, commissionRate: 1 }
          ]);
        }
        
        // 네트워크 설정
        if ((settings.masterType === "NETWORK" || settings.masterType === "BINARY_NETWORK") && settings.settings.network) {
          if (settings.settings.network.levels) {
            const levels = [...settings.settings.network.levels];
            // 첫 번째 레벨의 이름을 마스터 이름으로 설정
            if (levels.length > 0 && selectedTeamMaster) {
              levels[0].name = selectedTeamMaster.displayName;
            }
            setNetworkLevels(levels);
          } else {
            // 기본값 설정
            setNetworkLevels([
              { name: selectedTeamMaster?.displayName || "본부마스터", level: 1, commissionRate: 5 },
              { name: "2단계", level: 2, commissionRate: 3 },
              { name: "3단계", level: 3, commissionRate: 1 }
            ]);
          }
          
          // 중간관리자 설정
          if (settings.settings.network.middleManagers) {
            setNetworkMiddleManagers(settings.settings.network.middleManagers);
          } else {
            // 기본값 설정
            setNetworkMiddleManagers([{
              id: "mm1",
              enabled: false,
              name: "매니져 1",
              commissionRate: 3,
              conditions: {
                memberCount: false,
                chargeAmount: false,
                usageAmount: false
              },
              thresholds: {
                memberCount: 10,
                chargeAmount: 100000,
                usageAmount: 50000
              },
              duplicateDistribution: ""
            }]);
          }
        }
        
        // 네트워크 바이너리 설정
        if (settings.masterType === "BINARY_NETWORK" && settings.settings.binaryNetwork) {
          if (settings.settings.binaryNetwork.requireBothLegs !== undefined) {
            setRequireBothLegs(settings.settings.binaryNetwork.requireBothLegs);
          } else {
            setRequireBothLegs(false);
          }
        }
      }
    } catch (error) {
      console.error("설정을 불러오는 중 오류가 발생했습니다:", error);
      toast({
        description: "설정을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 설정 저장
  const saveSettings = async () => {
    try {
      // 수수료 합계 검증
      let totalCommission = 0;
      
      if (masterType === "HEADQUARTERS") {
        // 본부구조 수수료 계산 (모든 레벨)
        totalCommission = headquartersLevels.reduce((sum, level) => sum + level.commissionRate, 0);
      } else if (masterType === "NETWORK" || masterType === "BINARY_NETWORK") {
        // 네트워크 수수료 계산 (모든 레벨)
        totalCommission = networkLevels.reduce((sum, level) => sum + level.commissionRate, 0);
        
        // 중간관리자 수수료 추가
        totalCommission += networkMiddleManagers
          .filter(manager => manager.enabled)
          .reduce((sum, manager) => sum + manager.commissionRate, 0);
      }
      
      // 수수료 합계가 100%를 초과하는지 검증
      if (Math.abs(totalCommission - 100) > 0.1) {
        toast({
          description: "모든 단계의 수수료 합계가 100%여야 합니다.",
          variant: "destructive",
          duration: 2000,
        });
        return;
      }
      
      if (!selectedTeamMaster?.id) {
        toast({
          description: "팀마스터가 선택되지 않았습니다.",
          variant: "destructive",
          duration: 1500,
        });
        return;
      }
      
      setLoading(true);
      
      // 기본 설정 객체 생성
      const baseSettings = {
        defaultCommissionRate: defaultCommissionRate
      };
      
      // 마스터 타입에 따른 설정 추가
      let typeSpecificSettings = {};
      
      if (masterType === "HEADQUARTERS") {
        typeSpecificSettings = {
          headquarters: {
            levels: headquartersLevels
          }
        };
      } else if (masterType === "NETWORK") {
        typeSpecificSettings = {
          network: {
            levels: networkLevels,
            middleManagers: networkMiddleManagers
          }
        };
      } else if (masterType === "BINARY_NETWORK") {
        typeSpecificSettings = {
          network: {
            levels: networkLevels,
            middleManagers: networkMiddleManagers
          },
          binaryNetwork: {
            requireBothLegs
          }
        };
      }
      
      // 팀마스터 설정 저장
      const settings = {
        userId: selectedTeamMaster.id,
        masterType,
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
          description: "설정이 저장되었습니다.",
          variant: "default",
          duration: 1500,
        });
        
        // 설정 다시 불러오기
        loadSettings(selectedTeamMaster.id);
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
  
  // 마스터 타입 이름 가져오기
  const getMasterTypeName = (type: string) => {
    switch (type) {
      case "HEADQUARTERS": return "본부구조";
      case "NETWORK": return "네트워크";
      case "BINARY_NETWORK": return "네트워크 바이너리";
      default: return "알 수 없음";
    }
  };
  
  
  // 중간관리자 추가
  const addMiddleManager = () => {
    const newManager: MiddleManager = {
      id: `mm${networkMiddleManagers.length + 1}`,
      enabled: false,
      name: `매니져${networkMiddleManagers.length + 1}`,
      commissionRate: 3,
      conditions: {
        memberCount: false,
        chargeAmount: false,
        usageAmount: false
      },
      thresholds: {
        memberCount: 10,
        chargeAmount: 100000,
        usageAmount: 50000
      },
      duplicateDistribution: ""
    };
    setNetworkMiddleManagers([...networkMiddleManagers, newManager]);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>영업본부 구조설정</CardTitle>
        <CardDescription>
          영업본부 단계 / 지급비율 / 방식 설정
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 관리자인 경우 팀마스터 검색 */}
        {isAdmin && (
          <div className="mb-6">
            <Label htmlFor="team-master-search"></Label>
            <UserSearchInput
              onSelect={(user) => {
                if (user) {
                  // 팀마스터 유저롤인 경우에만 선택 가능
                  if (user.userRole === USER_ROLE.TEAM_MASTER) {
                    setSelectedTeamMaster({
                      id: user.id,
                      username: user.username || "",
                      email: user.email || "",
                      displayName: user.displayName,
                      userRole: user.userRole
                    });
                  } else {
                    toast({
                      description: "본부마스터 권한을 가진 사용자만 선택할 수 있습니다.",
                      variant: "destructive",
                      duration: 1500,
                    });
                  }
                } else {
                  setSelectedTeamMaster(null);
                }
              }}
              selectedUser={selectedTeamMaster ? {
                id: selectedTeamMaster.id,
                username: selectedTeamMaster.username || "",
                email: selectedTeamMaster.email || "",
                displayName: selectedTeamMaster.displayName,
                userRole: selectedTeamMaster.userRole
              } : null}
              placeholder="본부마스터 검색..."
              disabled={loading}
            />
          </div>
        )}

        <Separator className="border mb-6"/>
        
        {/* 사용자 정보 */}
        {selectedTeamMaster && (
          <div className="mb-6 p-3 border rounded-md bg-muted/50">
            {/* <h3 className="text-base mb-2">팀마스터 정보</h3> */}
            <IdCard className="h-6 w-6 text-muted-foreground mb-2" />
            <div className="grid grid-cols-10 gap-0 items-center">
              <div className="col-span-4 justify-items-start">
                <p className="text-base font-medium">{selectedTeamMaster.displayName}</p>
              </div>
              <div className="col-span-3 justify-items-end">
                <p className="text-xs font-medium text-muted-foreground">{USER_ROLE_NAME[selectedTeamMaster.userRole as keyof typeof USER_ROLE_NAME] || "알 수 없음"}</p>
              </div>
              <div className="col-span-2 justify-items-center">
                <p className="text-xs font-medium text-muted-foreground">{getMasterTypeName(masterType)}</p>
              </div>
              <div className="col-span-1 justify-items-start">
                <p className="text-xs font-medium text-muted-foreground"> {defaultCommissionRate}%</p>
              </div>
            </div>
          </div>
        )}
        
        {!masterType ? (
          <div className="flex flex-col text-sm items-center justify-center p-8 border rounded-md">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">본부마스터 멤버가 아닙니다.</p>
            <p className="text-muted-foreground text-sm">회원권한을 확인하세요</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 마스터 타입에 따른 설정 */}
            {masterType === "HEADQUARTERS" && (
              <div className="space-y-4">
                {/* <h3 className="text-lg font-medium">본부구조 설정</h3> */}
                <HeadquartersLevelSettings
                  levels={headquartersLevels}
                  setLevels={setHeadquartersLevels}
                  loading={loading}
                  remainingCommissionRate={remainingCommissionRate}
                />
              </div>
            )}
            
            {(masterType === "NETWORK" || masterType === "BINARY_NETWORK") && (
              <div className="space-y-4">
                {/* <h3 className="text-lg font-medium">네트워크 설정</h3> */}
                <NetworkLevelSettings
                  levels={networkLevels}
                  setLevels={setNetworkLevels}
                  loading={loading}
                  remainingCommissionRate={remainingCommissionRate}
                />
                
                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium"># 매니져 설정</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addMiddleManager}
                      disabled={loading}
                    >
                      +
                    </Button>
                  </div>
                  
                  <NetworkMiddleManagerSettings
                    managers={networkMiddleManagers}
                    setManagers={setNetworkMiddleManagers}
                    loading={loading}
                  />
                </div>
                
                {/* 네트워크 바이너리 설정 */}
                {/* {masterType === "BINARY_NETWORK" && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="require-both-legs"
                        checked={requireBothLegs}
                        onChange={(e) => setRequireBothLegs(e.target.checked)}
                        disabled={loading}
                      />
                      <Label htmlFor="require-both-legs" className="text-xs">
                        하위회원 2명이 충족될 때만 추가 회원 등록 가능
                      </Label>
                    </div>
                  </div>
                )} */}
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                onClick={saveSettings}
                disabled={loading || !selectedTeamMaster}
              >
                {/* {loading ? "저장 중..." : "설정 저장"} */}
                {loading ? "..." : <Save className="h-4 w-4" /> }
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
