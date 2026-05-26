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
import { useTranslations } from "next-intl";

interface ReferralLinkModalProps {
  username: string;
}

export default function ReferralLinkModal({ username }: ReferralLinkModalProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const tUserMenu = useTranslations('UserMenu');
  const tCommon = useTranslations('Common');
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
        description: tUserMenu('referralCopySuccess'),
        duration: 1500,
      });
    } catch (error) {
      console.error("Copy failed:", error);
      toast({
        description: tUserMenu('referralCopyFailed'),
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
          title: tUserMenu('referralShareTitle'),
          text: tUserMenu('referralShareText'),
          url: referralLink,
        });
      } catch (error) {
        console.error("Share failed:", error);
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
          {tUserMenu('referralLinkButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full md:min-w-[450px] max-w-[90%] md:max-w-[30%] rounded-lg h-auto">
        <DialogHeader>
          <DialogTitle>{tUserMenu('referralLinkTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <QRCodeSVG value={referralLink} size={200} />
            <p className="text-sm text-muted-foreground">
              {tUserMenu('referralQrDesc')}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="referralLink">{tUserMenu('referralLinkButton')}</Label>
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
              {tUserMenu('referralLinkDesc')}
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={shareLink}>
              <Share2 className="w-4 h-4 mr-2" />
              {tCommon('share')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
