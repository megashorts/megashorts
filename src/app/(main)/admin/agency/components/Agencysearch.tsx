// src/app/(main)/admin/agency/components/Agencysearch.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/SessionProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";

import ReferralStructureView from "./search/ReferralStructureView";
import PointDistributionView from "./search/PointDistributionView";
import StatisticsView from "./search/StatisticsView";

export default function Agencysearch() {
  const { user } = useSession();
  const currentUser = user?.displayName ? { displayName: user.displayName, id: user.id } : undefined;
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("searchTab") || "structure");
  
  // 추천인 구조 데이터
  const [structureData, setStructureData] = useState<any>(null);
  
  // 포인트 분배 내역 데이터
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [week, setWeek] = useState<string>("");
  
  // 통계 데이터
  const [statisticsData, setStatisticsData] = useState<any>(null);
  
  // 추천인 구조 데이터 로드
  const loadStructureData = async () => {
    if (loading || structureData) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/agency/structure?userId=${currentUser?.id}`);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setStructureData(data.data);
      } else {
        throw new Error(data.error || "데이터를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("추천인 구조 데이터를 불러오는 중 오류가 발생했습니다:", error);
      toast({
        description: "추천인 구조 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 포인트 분배 내역 데이터 로드
  const loadDistributionData = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      let url = `/api/agency/distributions?userId=${currentUser?.id}`;
      
      if (year && week) {
        url += `&year=${year}&week=${week}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setDistributionData(data.data);
      } else {
        throw new Error(data.error || "데이터를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("포인트 분배 내역을 불러오는 중 오류가 발생했습니다:", error);
      toast({
        description: "포인트 분배 내역을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 통계 데이터 로드
  const loadStatisticsData = async () => {
    if (loading || statisticsData) return;
    
    try {
      setLoading(true);
      // 실제 API가 구현되면 해당 API를 호출
      // 현재는 더미 데이터 사용
      setStatisticsData({
        totalMembers: 120,
        totalAgencies: 15,
        totalManagers: 5,
        totalPoints: 25000,
        membersByLevel: [
          { level: 1, count: 5 },
          { level: 2, count: 15 },
          { level: 3, count: 100 }
        ],
        pointsByLevel: [
          { level: 1, points: 10000 },
          { level: 2, points: 8000 },
          { level: 3, points: 7000 }
        ]
      });
    } catch (error) {
      console.error("통계 데이터를 불러오는 중 오류가 발생했습니다:", error);
      toast({
        description: "통계 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (currentUser?.id) {
      if (activeTab === "structure" && !structureData && !loading) {
        loadStructureData();
      } else if (activeTab === "distribution" && !loading) {
        loadDistributionData();
      } else if (activeTab === "statistics" && !statisticsData && !loading) {
        loadStatisticsData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentUser?.id]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>영업 시스템 조회</CardTitle>
        <CardDescription>
          영업 구조 및 포인트 분배 내역을 조회합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="structure" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="structure">추천인 구조</TabsTrigger>
            <TabsTrigger value="distribution">포인트 분배 내역</TabsTrigger>
            <TabsTrigger value="statistics">통계</TabsTrigger>
          </TabsList>
          
          {/* 추천인 구조 */}
          <TabsContent value="structure" className="space-y-4 mt-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : structureData ? (
              <ReferralStructureView data={structureData} />
            ) : (
              <div className="flex justify-center items-center h-64">
                <p>추천인 구조 데이터가 없습니다.</p>
              </div>
            )}
          </TabsContent>
          
          {/* 포인트 분배 내역 */}
          <TabsContent value="distribution" className="space-y-4 mt-4">
            <div className="flex space-x-4 mb-4">
              <div className="space-y-2 w-1/3">
                <Label htmlFor="year">연도</Label>
                <Input
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2 w-1/3">
                <Label htmlFor="week">주차</Label>
                <Input
                  id="week"
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-end w-1/3">
                <Button
                  onClick={loadDistributionData}
                  disabled={loading}
                >
                  조회
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : distributionData.length > 0 ? (
              <PointDistributionView data={distributionData} />
            ) : (
              <div className="flex justify-center items-center h-64">
                <p>포인트 분배 내역이 없습니다.</p>
              </div>
            )}
          </TabsContent>
          
          {/* 통계 */}
          <TabsContent value="statistics" className="space-y-4 mt-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : statisticsData ? (
              <StatisticsView data={statisticsData} />
            ) : (
              <div className="flex justify-center items-center h-64">
                <p>통계 데이터가 없습니다.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}