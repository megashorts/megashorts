'use client';

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface AuthButtonProps {
  isAuthenticated: boolean;
}

export function AuthButton({ isAuthenticated }: AuthButtonProps) {
  if (isAuthenticated) return null;

  return (
    <div className="flex items-center gap-2 p-2 rounded-md">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
            toast({
              description: "결제 사업자 등록시 작동합니다.",
              variant: "default",
              duration: 1500,
            });
          }}
      >
        인증하기
      </Button>
      {/* <span className="text-sm text-red-500 dark:text-red-400">
        성인인증이 필요한 서비스입니다
      </span> */}
    </div>
  );
}