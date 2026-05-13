"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/SessionProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { QRCodeSVG } from "qrcode.react";

interface ReferralLinkModalProps {
  username: string;
}

export default function ReferralLinkModal({ username }: ReferralLinkModalProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  
  // 추천인 링크 생성
  useEffect(() => {
    if (open && username) {
      // 현재 도메인 기반으로 링크 생성
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}/signup?referrer=${encodeURIComponent(username)}`);
    }
  }, [open, username]);
  
  // 링크 복사
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        description: "링크가 클립보드에 복사되었습니다.",
        duration: 1500,
      });
    } catch (error) {
      console.error("클립보드 복사 실패:", error);
      toast({
        description: "링크 복사에 실패했습니다.",
        variant: "destructive",
        duration: 1500,
      });
    }
  };
  
  // 공유하기
  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "회원가입 추천 링크",
          text: "이 링크를 통해 가입하시면 저를 추천인으로 등록됩니다.",
          url: referralLink,
        });
      } catch (error) {
        console.error("공유 실패:", error);
      }
    } else {
      copyToClipboard();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Share2 className="w-4 h-4 mr-2" />
          추천인 링크
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full md:min-w-[450px] max-w-[90%] md:max-w-[30%] rounded-lg h-auto">
        <DialogHeader>
          <DialogTitle>추천인 링크 및 QR 코드</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <QRCodeSVG value={referralLink} size={200} />
            <p className="text-sm text-muted-foreground">
              이 QR 코드를 스캔하면 회원가입 시 추천인으로 등록됩니다.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="referralLink">추천인 링크</Label>
            <div className="flex space-x-2">
              <Input
                id="referralLink"
                value={referralLink}
                readOnly
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              이 링크를 공유하면 회원가입 시 추천인으로 등록됩니다.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={shareLink}>
              <Share2 className="w-4 h-4 mr-2" />
              공유하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
