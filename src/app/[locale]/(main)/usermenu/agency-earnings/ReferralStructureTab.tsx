"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/app/[locale]/(main)/admin/service/components/LoadingSpinner";
import ReferralStructureView from "../../admin/agency/components/search/ReferralStructureView";
import { useToast } from "@/components/ui/use-toast";

interface ReferralStructureTabProps {
  userId: string;
}

export default function ReferralStructureTab({ userId }: ReferralStructureTabProps) {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    fetch(`/api/agency/structure?userId=${userId}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (ignore) return;
        if (!result.success) throw new Error(result.error || "Failed to load referral structure");
        setData(result.data);
      })
      .catch((error) => {
        if (!ignore) toast({ description: String(error), variant: "destructive", duration: 1800 });
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [toast, userId]);

  if (loading) return <LoadingSpinner />;
  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border text-sm text-muted-foreground">
        No stored referral structure.
      </div>
    );
  }

  return <ReferralStructureView data={data} />;
}
