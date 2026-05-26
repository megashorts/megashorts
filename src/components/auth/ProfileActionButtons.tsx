"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserPasswordReset from "./UserPasswordReset";
import CancelSubscriptionDialog from "./CancelSubscriptionDialog";
import DeleteAccountDialog from "./DeleteAccountDialog";
import { useTranslations } from "next-intl";

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
  const tProfile = useTranslations('Profile');

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <Button
          type="button"
          onClick={() => setShowPasswordReset(true)}
          className="w-full h-auto min-h-10 px-3 py-2 text-[13px] sm:text-sm leading-tight whitespace-normal break-words"
        >
          {tProfile('changePassword')}
        </Button>
        <Button
          type="button"
          onClick={() => setShowCancelSubscription(true)}
          className="w-full h-auto min-h-10 px-3 py-2 text-[13px] sm:text-sm leading-tight whitespace-normal break-words text-black hover:text-white border-gray-50 bg-white"
        >
          {tProfile('cancelSubscription')}
        </Button>
        <Button
          type="button"
          onClick={() => setShowDeleteAccount(true)}
          className="w-full h-auto min-h-10 px-3 py-2 text-[13px] sm:text-sm leading-tight whitespace-normal break-words text-black hover:text-white border-gray-50 bg-white"
        >
          {tProfile('deleteAccount')}
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
