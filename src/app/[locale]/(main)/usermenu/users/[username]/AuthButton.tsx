'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import AgeVerificationModal from '@/components/AgeVerificationModal';

interface AuthButtonProps {
  isAuthenticated: boolean;
}

export function AuthButton({ isAuthenticated }: AuthButtonProps) {
  const [showModal, setShowModal] = useState(false);

  if (isAuthenticated) return null;

  return (
    <>
      <div className="flex items-center gap-2 p-2 rounded-md">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowModal(true)}
        >
          인증하기
        </Button>
      </div>

      <AgeVerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}