"use client";

import { InquiryStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";

interface StatusLedButtonProps {
  status?: InquiryStatus;
  onChange: (status: InquiryStatus | undefined) => void;
}

export default function StatusLedButton({ status, onChange }: StatusLedButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Filter className="h-5 w-5" />
          {status && (
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
              status === 'PENDING' ? 'bg-yellow-400' :
              status === 'IN_PROGRESS' ? 'bg-blue-500' :
              'bg-green-500'
            }`} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[150px]">
        <DropdownMenuItem onClick={() => onChange(undefined)} className="gap-3">
          <span className="w-2 h-2" />
          전체
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("PENDING")} className="gap-3">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          대기중
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("IN_PROGRESS")} className="gap-3">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          진행중
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("CLOSED")} className="gap-3">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          완료
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
