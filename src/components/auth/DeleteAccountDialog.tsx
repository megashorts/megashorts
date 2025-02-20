"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingButton from "@/components/LoadingButton";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { logActivity } from "@/lib/activity-logger/client";
interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

export default function DeleteAccountDialog({
  open,
  onOpenChange,
  username,
}: DeleteAccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode] = useState(
    Math.floor(1000 + Math.random() * 9000).toString()
  );
  const [inputCode, setInputCode] = useState("");
  const router = useRouter();

  const validateAndDelete = async () => {
    // 입력값이 없는 경우
    if (!inputCode.trim()) {
      toast({
        variant: "destructive",
        description: "인증번호를 입력해주세요"
      });
      return;
    }

    // 입력값이 일치하지 않는 경우
    if (inputCode !== verificationCode) {
      toast({
        variant: "destructive",
        description: "인증번호가 일치하지 않습니다"
      });
      setInputCode(""); // 입력값 초기화
      return;
    }

    // 인증번호가 일치하는 경우 회원탈퇴 진행
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "계정 삭제 중 오류가 발생했습니다");
      }

      // 성공 로그 기록
      logActivity({
        type: 'auth',
        event: 'delete_account_success',
        username,
        details: {
          action: 'delete_account',
          result: 'success'
        }
      });

      toast({
        description: "계정이 성공적으로 삭제되었습니다"
      });
      
      // 세션 스토리지와 로컬 스토리지 초기화
      sessionStorage.clear();
      localStorage.clear();
      
      // 루트 페이지로 이동하고 새로고침
      window.location.href = "/";
    } catch (error) {
      // 실패 로그 기록
      logActivity({
        type: 'auth',
        event: 'delete_account_failure',
        username,
        details: {
          action: 'delete_account',
          result: 'failure',
          error: error instanceof Error ? error.message : "계정 삭제 실패"
        }
      });

      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "계정 삭제 실패"
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full min-x-[150px] max-w-[80%] md:max-w-[30%] rounded-lg h-auto">
        <DialogHeader>
          <DialogTitle>회원 탈퇴</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm text-center text-muted-foreground">
          <p>국제적인 개인정보 관리지침 준수로</p>
          <p>탈퇴시 모든 관련 정보가 일괄 삭제됩니다.</p>
          <p className="text-sm text-center text-white text-muted-foreground">
            확인용 인증번호를 입력하세요 : <strong>{verificationCode}</strong>
          </p>
          <Input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="인증번호 4자리 입력"
            maxLength={4}
          />
        </div>
        <DialogFooter className="flex flex-wrap justify-between gap-2 w-full">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <LoadingButton
            loading={isLoading}
            onClick={validateAndDelete}
            variant="destructive"
          >
            탈퇴하기
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
