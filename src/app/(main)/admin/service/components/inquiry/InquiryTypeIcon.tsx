"use client";

import { InquiryType } from "@prisma/client";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface InquiryTypeIconProps {
  type: InquiryType;
  className?: string;
}

export default function InquiryTypeIcon({ type, className }: InquiryTypeIconProps) {
  const config = {
    REPORT: {
      icon: <AlertTriangle className={`text-red-500 table-cell-icon ${className} w-4 h-4`} />,
      label: "신고",
    },
    INQUIRY: {
      icon: <HelpCircle className={`text-blue-500 table-cell-icon ${className} w-4 h-4`} />,
      label: "문의",
    },
  };

  const { icon, label } = config[type];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">{icon}</div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
