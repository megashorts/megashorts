'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import AgeVerificationModal from '@/components/AgeVerificationModal';
import { useTranslations } from 'next-intl';

interface AuthButtonProps {
  isAuthenticated: boolean;
}

export function AuthButton({ isAuthenticated }: AuthButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const tUserMenu = useTranslations('UserMenu');

  if (isAuthenticated) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => setShowModal(true)}
      >
        {tUserMenu('verifyAgeButton')}
      </Button>

      <AgeVerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
