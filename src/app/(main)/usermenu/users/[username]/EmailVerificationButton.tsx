"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EmailVerificationButtonProps {
  email: string;
  isVerified: boolean;
}

export default function EmailVerificationButton({ email, isVerified }: EmailVerificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'codeSent' | 'verified'>('initial');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState(email);

  const handleSendVerificationCode = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 인증 코드 전송 API 호출
      const response = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStep('codeSent');
      } else {
        setError(data.error || '인증 코드 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error('인증 코드 전송 오류:', err);
      setError('인증 코드 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 인증 코드 확인 및 이메일 업데이트 API 호출
      const response = await fetch('/api/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, code: verificationCode }),
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // 인증 성공 시 사용자 정보 업데이트
        if (email !== newEmail) {
          // 이메일이 변경된 경우 사용자 정보 업데이트
          const updateResponse = await fetch('/api/users/update-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newEmail }),
          });
          
          if (!updateResponse.ok) {
            throw new Error(`사용자 정보 업데이트 실패: ${updateResponse.status} ${updateResponse.statusText}`);
          }
          
          // 페이지 새로고침을 통해 변경된 정보 반영
          window.location.reload();
        }
        
        setStep('verified');
      } else {
        setError(data.error || '인증 코드 확인에 실패했습니다.');
      }
    } catch (err) {
      console.error('인증 코드 확인 오류:', err);
      setError('인증 코드 확인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // 모달이 닫힐 때 상태 초기화
    setTimeout(() => {
      setStep('initial');
      setVerificationCode('');
      setError(null);
      setNewEmail(email);
    }, 300);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="ml-2"
        onClick={() => setIsOpen(true)}
      >
        {isVerified ? "이메일 변경" : "이메일 인증"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>
              {isVerified ? "이메일 변경" : "이메일 인증"}
            </DialogTitle>
            <DialogDescription>
              {isVerified 
                ? "이메일을 변경하려면 새 이메일 주소를 입력하고 인증해주세요." 
                : "포인트 출금 신청을 위해서는 이메일 인증이 필요합니다."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'initial' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일 주소</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="이메일 주소를 입력하세요"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  인증 코드를 받을 이메일 주소를 입력해주세요.
                </p>
              </div>
            </div>
          )}

          {step === 'codeSent' && (
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertTitle>인증 코드 전송 완료</AlertTitle>
                <AlertDescription>
                  {newEmail}로 인증 코드가 전송되었습니다. 이메일을 확인해주세요.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="verificationCode">인증 코드</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="인증 코드 6자리를 입력하세요"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  이메일로 받은 6자리 인증 코드를 입력해주세요.
                </p>
              </div>
            </div>
          )}

          {step === 'verified' && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700">인증 완료</AlertTitle>
                <AlertDescription className="text-green-600">
                  이메일 인증이 성공적으로 완료되었습니다.
                </AlertDescription>
              </Alert>
              
              <p className="text-sm text-muted-foreground">
                이제 포인트 출금 신청이 가능합니다.
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            {step === 'initial' && (
              <Button
                type="submit"
                disabled={!newEmail || isSubmitting}
                onClick={handleSendVerificationCode}
              >
                {isSubmitting ? "처리 중..." : "인증 코드 전송"}
              </Button>
            )}

            {step === 'codeSent' && (
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => setStep('initial')}
                  disabled={isSubmitting}
                >
                  이전
                </Button>
                <Button
                  type="submit"
                  disabled={!verificationCode || isSubmitting}
                  onClick={handleVerifyCode}
                >
                  {isSubmitting ? "처리 중..." : "인증 확인"}
                </Button>
              </div>
            )}

            {step === 'verified' && (
              <Button onClick={handleClose}>
                완료
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
