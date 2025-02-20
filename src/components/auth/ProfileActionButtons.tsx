"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserPasswordReset from "./UserPasswordReset";
import CancelSubscriptionDialog from "./CancelSubscriptionDialog";
import DeleteAccountDialog from "./DeleteAccountDialog";

interface ProfileActionButtonsProps {
  subscriptionStatus?: string;
  username: string;
}

export default function ProfileActionButtons({
  subscriptionStatus,
  username,
}: ProfileActionButtonsProps) {
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showCancelSubscription, setShowCancelSubscription] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-4 justify-start md:justify-start">
        <Button
          type="button"
          onClick={() => setShowPasswordReset(true)}
          className="px-4 py-2 text-sm font-medium rounded-md w-full md:w-[120px] flex-1"
        >
          비밀번호 변경
        </Button>
        <Button
          type="button"
          onClick={() => setShowCancelSubscription(true)}
          className="px-4 py-2 text-sm text-black hover:text-white border-gray-50 bg-white font-medium rounded-md w-full md:w-[120px] flex-1"
        >
          구독취소
        </Button>
        <Button
          type="button"
          onClick={() => setShowDeleteAccount(true)}
          className="px-4 py-2 text-sm text-black hover:text-white border-gray-50 bg-white font-medium rounded-md w-full md:w-[120px] flex-1"
        >
          회원탈퇴
        </Button>
      </div>

      <UserPasswordReset
        open={showPasswordReset}
        onOpenChange={setShowPasswordReset}
      />
      <CancelSubscriptionDialog
        open={showCancelSubscription}
        onOpenChange={setShowCancelSubscription}
        subscriptionStatus={subscriptionStatus || "inactive"}
      />
      <DeleteAccountDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
        username={username}
      />
    </>
  );
}
