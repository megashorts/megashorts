"use client";

import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { logActivity } from "@/lib/activity-logger/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/LoadingButton";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionStatus: string;
}

export default function CancelSubscriptionDialog({
  open,
  onOpenChange,
  subscriptionStatus,
}: CancelSubscriptionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const session = useSession();

  const getStatusMessage = () => {
    switch (subscriptionStatus) {
      case "active":
        return (
          <>
            현재 구독이 활성화되어 있습니다. <br /> 정말 구독을 취소하시겠습니까?
          </>
        );
      case "cancelled":
        return "이미 구독이 취소되었습니다.";
      case "inactive":
      default:
        return "현재 구독 중이 아닙니다.";
    }
  };

  const handleCancel = async () => {
    if (subscriptionStatus !== "active") return;

    // 기본 로그 정보 (시도-결과 세트 패턴)
    const baseLogInfo = {
      type: 'payment',
      username: session?.user?.username,
      details: {
        action: 'subscription_cancel',
        subscriptionStatus: subscriptionStatus,
        userId: session?.user?.id
      }
    };

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/subscription/cancel", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || "구독 취소 중 오류가 발생했습니다.";
        throw new Error(errorMessage);
      }

      // 성공 로그 기록
      logActivity({
        ...baseLogInfo,
        event: 'subscription_cancel_success',
        details: {
          ...baseLogInfo.details,
          result: 'success'
        }
      });

      toast({
        description: "구독이 성공적으로 취소되었습니다."
      });
      onOpenChange(false);
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      // 실패 로그 기록
      logActivity({
        ...baseLogInfo,
        event: 'subscription_cancel_failure',
        details: {
          ...baseLogInfo.details,
          result: 'failure',
          error: error instanceof Error ? error.message : "구독 취소 실패"
        }
      });

      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "구독 취소 실패"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full min-x-[150px] max-w-[80%] md:max-w-[30%] rounded-lg h-auto">
        <DialogHeader>
          <DialogTitle>구독 취소</DialogTitle>
        </DialogHeader>
        <p className="py-4">{getStatusMessage()}</p>
        <DialogFooter className="flex flex-wrap justify-between gap-2 w-full">
          {subscriptionStatus === "active" ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                구독 유지
              </Button>
              <LoadingButton
                loading={isLoading}
                onClick={handleCancel}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                구독 취소
              </LoadingButton>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>확인</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
