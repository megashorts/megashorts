"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { USER_ROLE } from "@/lib/constants";
import { getCurrentStatsPeriod, getRecentStatsPeriods, inferStatsPeriodUnit } from "@/lib/stats-period";
import { useSearchParams } from "next/navigation";
import StatisticsView from "./search/StatisticsView";

const periodUnits = ["weekly", "monthly"] as const;
type AgencyStatsPeriodUnit = (typeof periodUnits)[number];

const unitLabels: Record<AgencyStatsPeriodUnit, string> = {
  weekly: "Week",
  monthly: "Month",
};

interface TeamMasterOption {
  id: string;
  username: string;
  displayName?: string | null;
  email?: string | null;
}

export default function Agencysearch() {
  const { user } = useSession();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const currentUser = user?.id ? { id: user.id, displayName: user.displayName } : undefined;
  const canSelectTeamMaster = Boolean(user?.userRole && user.userRole >= USER_ROLE.OPERATION1);
  const initialPeriod = searchParams.get("period") || getCurrentStatsPeriod("weekly");
  const inferredInitialUnit = inferStatsPeriodUnit(initialPeriod);
  const initialUnit: AgencyStatsPeriodUnit = inferredInitialUnit === "monthly" ? "monthly" : "weekly";
  const normalizedInitialPeriod = inferredInitialUnit === "daily" ? getCurrentStatsPeriod("weekly") : initialPeriod;
  const [loading, setLoading] = useState(false);
  const [periodUnit, setPeriodUnit] = useState<AgencyStatsPeriodUnit>(initialUnit);
  const [period, setPeriod] = useState(normalizedInitialPeriod === "current" ? getCurrentStatsPeriod(initialUnit) : normalizedInitialPeriod);
  const [distributionData, setDistributionData] = useState<any>(null);
  const [statisticsData, setStatisticsData] = useState<any>(null);
  const [teamMasters, setTeamMasters] = useState<TeamMasterOption[]>([]);
  const [targetUserId, setTargetUserId] = useState(searchParams.get("userId") || currentUser?.id || "");

  const periodOptions = useMemo(() => {
    const options = getRecentStatsPeriods(periodUnit, 12, "en");
    return options.some((option) => option.value === period)
      ? options
      : [{ value: period, key: period, label: period }, ...options];
  }, [periodUnit, period]);

  const loadJson = async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to load data.");
    return data.data;
  };

  const loadStatisticsData = async (targetPeriod = period) => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const [cumulative, distribution] = await Promise.all([
        loadJson(`/api/agency/statistics?userId=${targetUserId}&period=all`),
        loadJson(`/api/agency/distributions?userId=${targetUserId}&period=${targetPeriod}`),
      ]);
      setStatisticsData(cumulative);
      setDistributionData(distribution);
    } catch (error) {
      toast({ description: String(error), variant: "destructive", duration: 1800 });
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (unit: AgencyStatsPeriodUnit) => {
    const nextPeriod = getCurrentStatsPeriod(unit);
    setPeriodUnit(unit);
    setPeriod(nextPeriod);
    setDistributionData(null);
    setStatisticsData(null);
  };

  const handleLookup = () => {
    loadStatisticsData();
  };

  const handleTargetChange = (userId: string) => {
    setTargetUserId(userId);
    setDistributionData(null);
    setStatisticsData(null);
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    if (!targetUserId) setTargetUserId(currentUser.id);
  }, [currentUser?.id, targetUserId]);

  useEffect(() => {
    if (!canSelectTeamMaster) return;

    let ignore = false;
    fetch("/api/admin/team-master-list", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (ignore || !data.success || !Array.isArray(data.teamMasters)) return;
        setTeamMasters(data.teamMasters);
        if ((!targetUserId || targetUserId === currentUser?.id) && data.teamMasters[0]?.id) {
          handleTargetChange(data.teamMasters[0].id);
        }
      })
      .catch((error) => {
        if (!ignore) toast({ description: String(error), variant: "destructive", duration: 1800 });
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSelectTeamMaster, currentUser?.id]);

  useEffect(() => {
    if (!targetUserId) return;
    if (!statisticsData) loadStatisticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  const lookupControls = (
    <div className="flex flex-col gap-2 md:flex-row md:items-end">
      <div className="grid grid-cols-2 gap-2 md:w-52">
        {periodUnits.map((unit) => (
          <Button key={unit} variant={periodUnit === unit ? "default" : "outline"} onClick={() => handleUnitChange(unit)}>
            {unitLabels[unit]}
          </Button>
        ))}
      </div>
      <div className="w-full md:max-w-sm">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger>
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleLookup} disabled={loading}>Lookup</Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales System Lookup</CardTitle>
        <CardDescription>Stored worker results for referral structure, point distribution, and sales statistics.</CardDescription>
      </CardHeader>
      <CardContent>
        {canSelectTeamMaster && (
          <div className="mb-2 grid gap-2 md:max-w-md">
            <div className="text-xs font-medium text-muted-foreground">Lookup team master</div>
            <Select value={targetUserId} onValueChange={handleTargetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select team master" />
              </SelectTrigger>
              <SelectContent>
                {teamMasters.map((master) => (
                  <SelectItem key={master.id} value={master.id}>
                    {master.displayName || master.username} ({master.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {!canSelectTeamMaster && (
          <div className="mb-2 rounded-md border bg-muted/30 p-3 text-sm">
            <div className="text-xs font-medium text-muted-foreground">Current team</div>
            <div className="mt-1 font-semibold">{currentUser?.displayName || currentUser?.id || "-"}</div>
          </div>
        )}

        <div className="mt-2 space-y-2">
          {loading && !statisticsData ? <Loading /> : statisticsData ? (
            <StatisticsView data={statisticsData} distributionData={distributionData} controls={lookupControls} />
          ) : <Empty />}
        </div>
      </CardContent>
    </Card>
  );
}

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-64 items-center justify-center rounded-md bg-muted p-4 text-sm text-muted-foreground">
      No stored data available.
    </div>
  );
}
