"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import ReferralLinkModal from "./ReferralLinkModal";

interface ReferralLinkButtonProps {
  username: string;
  userRole: number;
}

export default function ReferralLinkButton({ username, userRole }: ReferralLinkButtonProps) {
  // 크리에이터 이상 권한(userRole >= 20)을 가진 사용자에게만 표시
  if (userRole < 20) {
    return null;
  }
  
  return <ReferralLinkModal username={username} />;
}
