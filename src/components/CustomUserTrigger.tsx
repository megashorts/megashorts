'use client';

import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

interface UserTriggerProps {
  className?: string;
}

export function UserTrigger({ className }: UserTriggerProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <div className="relative flex items-center justify-center w-9 h-9">
        <Button 
          onClick={toggleSidebar}
          variant="ghost" 
          className={`transition-colors hover:text-primary hover:border-primary rounded-full border-2 border-transparent focus:outline-none focus:ring-0 p-0 ${className}`}
        >
          <UserIcon className="w-5 h-5" />
        </Button>
    </div>
  );
}
