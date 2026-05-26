// src/app/(main)/usermenu/earnings/PointsApplication.tsx

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatNumberFull } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import LanguageFlag from '@/components/LanguageFlag';
import { useToast } from '@/components/ui/use-toast';

interface PointsApplicationProps {
  userId: string;
  userRole: number;
}

export default function PointsApplication({ userId, userRole }: PointsApplicationProps) {
  const t = useTranslations('Earnings');
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [records, setRecords] = useState<any[]>([]);

  const [userStatus, setUserStatus] = useState<{
    isVerified: boolean;
    availablePoints: number;
    minWithdrawPoint: number;
    creatorInfo: any;
  }>({
    isVerified: false,
    availablePoints: 0,
    minWithdrawPoint: 0,
    creatorInfo: null,
  });
  
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState<boolean>(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [applicationForm, setApplicationForm] = useState({
    amount: 0,
    reason: '',
  });
  const [creatorInfoForm, setCreatorInfoForm] = useState({
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    country: 'KR',
    swiftCode: '',
    paypalEmail: '',
    phoneNumber: '',
    address: '',
  });

  const isUploader = userRole >= 40;

  const periodOptions = [
    { value: 'all', label: t('allPeriods') },
    { value: '7days', label: t('last7Days') },
    { value: '30days', label: t('last30Days') },
    { value: '90days', label: t('last90Days') },
  ];

  const fetchUserStatus = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/points/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const user = data.data;
        
        setUserStatus({
          isVerified: user.emailVerified || false,
          availablePoints: user.points || 0,
          minWithdrawPoint: Number(user.minWithdrawPoint || 0),
          creatorInfo: user.creatorInfo
        });
        
        if (user.creatorInfo) {
          setCreatorInfoForm({
            accountHolder: user.creatorInfo.accountHolder || '',
            bankName: user.creatorInfo.bankName || '',
            accountNumber: user.creatorInfo.accountNumber || '',
            country: user.creatorInfo.country || 'KR',
            swiftCode: user.creatorInfo.swiftCode || '',
            paypalEmail: user.creatorInfo.paypalEmail || '',
            phoneNumber: user.creatorInfo.phoneNumber || '',
            address: user.creatorInfo.address || '',
          });
        }
      } else {
        console.error('Failed to load user status:', data.error);
      }
    } catch (error) {
      console.error('User status request error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStartDateForPeriod = (period: string): number => {
    const now = new Date();
    if (period === '7days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.getTime();
    }
    if (period === '30days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d.getTime();
    }
    if (period === '90days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return d.getTime();
    }
    return 0;
  };

  const fetchPaymentHistory = async (period: string) => {
    setIsLoading(true);

    try {
      const paymentsResponse = await fetch(`/api/points/payments?userId=${userId}&period=${period}`);
      if (!paymentsResponse.ok) {
        throw new Error(`API call failed: ${paymentsResponse.status} ${paymentsResponse.statusText}`);
      }
      const paymentsData = await paymentsResponse.json();

      const paymentsArr = paymentsData.success
        ? (paymentsData.data?.payments || paymentsData.withdrawals || [])
        : [];

      const applicationsResponse = await fetch(`/api/points/applications?userId=${userId}&period=${period}`);
      if (!applicationsResponse.ok) {
        throw new Error(`API call failed: ${applicationsResponse.status} ${applicationsResponse.statusText}`);
      }
      const applicationsData = await applicationsResponse.json();
      const applicationsArr = applicationsData.success
        ? (applicationsData.data?.applications || [])
        : [];

      const normalizedPayments = paymentsArr.map((p: any) => ({
        id: String(p.id ?? p._id ?? ''),
        date: p.date || p.paidAt || p.updatedAt || p.createdAt || '',
        amount: Number(p.amount ?? p.points ?? 0),
        status: p.status ?? 'completed',
        type: 'PAYMENT' as const,
        raw: p,
      }));

      const normalizedApplications = applicationsArr.map((a: any) => ({
        id: String(a.id ?? a._id ?? ''),
        date: a.createdAt || a.date || a.requestedAt || '',
        amount: Number(a.amount ?? a.points ?? 0),
        status: a.status ?? 'PENDING',
        type: 'APPLICATION' as const,
        raw: a,
      }));

      let combined = [...normalizedPayments, ...normalizedApplications];
      combined.sort((a, b) => {
        const ta = Date.parse(a.date || '') || 0;
        const tb = Date.parse(b.date || '') || 0;
        return tb - ta;
      });

      if (period !== 'all') {
        const startTs = getStartDateForPeriod(period);
        combined = combined.filter((r) => {
          const t = Date.parse(r.date || '');
          return !isNaN(t) && t >= startTs;
        });
      }

      setRecords(combined);
    } catch (error) {
      console.error('Payment/application history request error:', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitApplication = async () => {
    try {
      const amount = Number(applicationForm.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast({ description: t('amountGreaterThanZero'), variant: 'destructive', duration: 1800 });
        return;
      }

      if (amount < userStatus.minWithdrawPoint) {
        toast({
          description: t('minimumWithdrawalRequired', { points: formatNumber(userStatus.minWithdrawPoint) }),
          variant: 'destructive',
          duration: 2200,
        });
        return;
      }
      
      if (amount > userStatus.availablePoints) {
        toast({ description: t('amountExceedsAvailable'), variant: 'destructive', duration: 1800 });
        return;
      }

      if (!userStatus.isVerified) {
        toast({ description: t('emailVerificationRequired'), variant: 'destructive', duration: 1800 });
        return;
      }
      
      if (!userStatus.creatorInfo || !userStatus.creatorInfo.idCheck) {
        toast({ description: isUploader ? t('creatorInfoVerificationRequired') : t('payoutInfoVerificationRequired'), variant: 'destructive', duration: 1800 });
        return;
      }
      
      const response = await fetch('/api/points/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: applicationForm.amount,
          reason: applicationForm.reason
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({ description: t('applicationSubmitted'), duration: 1800 });
        setIsApplicationModalOpen(false);
        
        fetchUserStatus();
        fetchPaymentHistory(selectedPeriod);
      } else {
        toast({ description: t('applicationFailedWithError', { error: data.error }), variant: 'destructive', duration: 2200 });
      }
    } catch (error) {
      console.error('Point application request error:', error);
      toast({ description: t('applicationError'), variant: 'destructive', duration: 2200 });
    }
  };

  const submitCreatorInfo = async () => {
    try {
      if (!creatorInfoForm.accountHolder || !creatorInfoForm.bankName || !creatorInfoForm.accountNumber) {
        alert(t('requiredFieldsMissing'));
        return;
      }
      
      const response = await fetch(`/api/creator-info/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creatorInfoForm),
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        alert(isUploader ? t('creatorInfoSaved') : t('payoutInfoSaved'));
        setIsVerificationModalOpen(false);
        fetchUserStatus();
      } else {
        alert(isUploader ? t('creatorInfoSaveFailedWithError', { error: data.error }) : t('payoutInfoSaveFailedWithError', { error: data.error }));
      }
    } catch (error) {
      console.error('Payout info save request error:', error);
      alert(isUploader ? t('creatorInfoSaveError') : t('payoutInfoSaveError'));
    }
  };

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    fetchPaymentHistory(value);
  };

  useEffect(() => {
    fetchUserStatus();
    fetchPaymentHistory(selectedPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusLabel = (rec: any) => {
    if (rec.type === 'PAYMENT') {
      return rec.status === 'completed' ? t('paymentCompleted') : t('processing');
    } else {
      if (rec.status === 'APPROVED') return t('approved');
      if (rec.status === 'REJECTED') return t('rejected');
      return t('processing');
    }
  };
  const getBadgeVariant = (rec: any) => {
    if (rec.type === 'PAYMENT') {
      return rec.status === 'completed' ? 'default' : 'secondary';
    } else {
      if (rec.status === 'APPROVED') return 'default';
      if (rec.status === 'REJECTED') return 'destructive';
      return 'secondary';
    }
  };

  return (
    <div className="space-y-2">
      <Card>
        <CardHeader>
          <CardTitle>{isUploader ? t('creatorInfoCheck') : t('payoutInfoCheck')}</CardTitle>
          <CardDescription>
            {isUploader ? t('creatorInfoCheckDescription') : t('payoutInfoCheckDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 rounded-lg" />
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Badge variant={userStatus.isVerified ? "secondary" : "destructive"}>
                    {userStatus.isVerified ? t('emailVerified') : t('emailNotVerified')}
                  </Badge>
                  <Badge variant={userStatus.creatorInfo?.bankName ? "secondary" : "destructive"}>
                    {userStatus.creatorInfo?.bankName ? t('payoutInfoRegistered') : t('payoutInfoNotRegistered')}
                  </Badge>
                  <Badge variant={userStatus.creatorInfo?.idCheck ? "secondary" : "destructive"}>
                    {userStatus.creatorInfo?.idCheck ? t('identitySubmitted') : t('identityNotSubmitted')}
                  </Badge>
                </div>
              </div>

              <div className={`p-4 rounded-md border ${(userStatus.isVerified && userStatus.creatorInfo?.idCheck) ? "border-gray-200 bg-gray-20" : "border-red-200 bg-red-60"}`}>
                <div className="flex items-start">
                  <AlertCircle className={`h-5 w-5 mr-2 ${(userStatus.isVerified && userStatus.creatorInfo?.idCheck) ? "text-gray-500" : "text-red-500"}`} />
                  <div>
                    <h4 className="font-medium">
                      {(userStatus.isVerified && userStatus.creatorInfo?.idCheck)
                        ? t('verifiedCanApply')
                        : t('verificationRequired')}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(userStatus.isVerified && userStatus.creatorInfo?.idCheck)
                        ? (
                            <>
                              {t('bank')}: {creatorInfoForm.bankName}&nbsp;&nbsp;
                              {t('accountHolder')}: {creatorInfoForm.accountHolder}&nbsp;&nbsp;
                              {t('accountNumber')}: {creatorInfoForm.accountNumber}
                            </>
                          ) 
                        : t('sendIdentityDocuments')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div>
                  <h3 className="text-lg font-medium text-muted-foreground">{t('myPoints')}</h3>
                </div>
                <div className="text-xl font-bold ml-2">
                  {formatNumberFull(userStatus.availablePoints)} p
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Dialog open={isVerificationModalOpen} onOpenChange={setIsVerificationModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      {userStatus.creatorInfo?.bankName 
                        ? t('editPayoutInfo')
                        : t('enterPayoutInfo')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('enterPayoutInfo')}</DialogTitle>
                      <DialogDescription>
                        {t('sendIdentityDocumentsShort')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="accountHolder">{t('accountHolder')} <span className="text-red-500">*</span></Label>
                        <Input
                          id="accountHolder"
                          value={creatorInfoForm.accountHolder}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, accountHolder: e.target.value})}
                          placeholder={t('accountHolderPlaceholder')}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">{t('country')} <span className="text-red-500">*</span></Label>
                        <Select 
                          value={creatorInfoForm.country} 
                          onValueChange={(value) => setCreatorInfoForm({...creatorInfoForm, country: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectCountry')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KR"><span className="inline-flex items-center gap-1"><LanguageFlag language="KR" className="h-4 w-4" />{t('countryKR')}</span></SelectItem>
                            <SelectItem value="US"><span className="inline-flex items-center gap-1"><LanguageFlag language="US" className="h-4 w-4" />{t('countryUS')}</span></SelectItem>
                            <SelectItem value="CN"><span className="inline-flex items-center gap-1"><LanguageFlag language="CN" className="h-4 w-4" />{t('countryCN')}</span></SelectItem>
                            <SelectItem value="JP"><span className="inline-flex items-center gap-1"><LanguageFlag language="JP" className="h-4 w-4" />{t('countryJP')}</span></SelectItem>
                            <SelectItem value="TH"><span className="inline-flex items-center gap-1"><LanguageFlag language="TH" className="h-4 w-4" />{t('countryTH')}</span></SelectItem>
                            <SelectItem value="ES"><span className="inline-flex items-center gap-1"><LanguageFlag language="ES" className="h-4 w-4" />{t('countryES')}</span></SelectItem>
                            <SelectItem value="ID"><span className="inline-flex items-center gap-1"><LanguageFlag language="ID" className="h-4 w-4" />{t('countryID')}</span></SelectItem>
                            <SelectItem value="VN"><span className="inline-flex items-center gap-1"><LanguageFlag language="VN" className="h-4 w-4" />{t('countryVN')}</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankName">{t('bankName')} <span className="text-red-500">*</span></Label>
                        <Input
                          id="bankName"
                          value={creatorInfoForm.bankName}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, bankName: e.target.value})}
                          placeholder={t('bankNamePlaceholder')}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">{t('accountNumber')} <span className="text-red-500">*</span></Label>
                        <Input
                          id="accountNumber"
                          value={creatorInfoForm.accountNumber}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, accountNumber: e.target.value})}
                          placeholder={t('accountNumberPlaceholder')}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="swiftCode">{t('swiftCode')}</Label>
                        <Input
                          id="swiftCode"
                          value={creatorInfoForm.swiftCode}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, swiftCode: e.target.value})}
                          placeholder={t('swiftCodePlaceholder')}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('swiftCodeHelp')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paypalEmail">{t('paypalEmail')}</Label>
                        <Input
                          id="paypalEmail"
                          type="email"
                          value={creatorInfoForm.paypalEmail}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, paypalEmail: e.target.value})}
                          placeholder={t('paypalEmailPlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">{t('phoneNumber')}</Label>
                        <Input
                          id="phoneNumber"
                          value={creatorInfoForm.phoneNumber}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, phoneNumber: e.target.value})}
                          placeholder={t('phoneNumberPlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">{t('address')}</Label>
                        <Textarea
                          id="address"
                          value={creatorInfoForm.address}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, address: e.target.value})}
                          placeholder={t('addressPlaceholder')}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsVerificationModalOpen(false)}>{t('cancel')}</Button>
                      <Button onClick={submitCreatorInfo}>{t('save')}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isApplicationModalOpen} onOpenChange={setIsApplicationModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => setApplicationForm({...applicationForm, amount: Math.min(Math.max(userStatus.minWithdrawPoint, 1), userStatus.availablePoints)})}
                      disabled={!userStatus.isVerified || !userStatus.creatorInfo?.idCheck || userStatus.availablePoints <= 0}
                    >
                      {t('applyPoints')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('applyPoints')}</DialogTitle>
                      <DialogDescription>
                        {t('applyPointsDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="amount">{t('applicationAmount')}</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={applicationForm.amount}
                          onChange={(e) => setApplicationForm({...applicationForm, amount: Math.min(Number(e.target.value), userStatus.availablePoints)})}
                          max={userStatus.availablePoints}
                          min={userStatus.minWithdrawPoint || 1}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{t('availablePoints', { points: formatNumber(userStatus.availablePoints) })}</span>
                          <span>{t('minimumWithdrawalPoints', { points: formatNumber(userStatus.minWithdrawPoint) })}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('bankInfo')}</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm">{userStatus.creatorInfo?.bankName} {userStatus.creatorInfo?.accountNumber}</p>
                          <p className="text-sm">{t('accountHolder')}: {userStatus.creatorInfo?.accountHolder}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">{t('applicationReason')}</Label>
                        <Textarea
                          id="reason"
                          value={applicationForm.reason}
                          onChange={(e) => setApplicationForm({...applicationForm, reason: e.target.value})}
                          placeholder={t('applicationReasonPlaceholder')}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsApplicationModalOpen(false)}>{t('cancel')}</Button>
                      <Button onClick={submitApplication}>{t('apply')}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('transactionHistory')}</CardTitle>
          <CardDescription>
            {t('transactionHistoryDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex flex-col gap-2 md:flex-row">
            <div className="w-full md:w-1/3">
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectPeriod')} />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => fetchPaymentHistory(selectedPeriod)}>
                {t('search')}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-[200px] rounded-lg" />
          ) : records.length > 0 ? (
            <div className="overflow-hidden rounded-md border">
              <div className="hidden grid-cols-[minmax(0,1.7fr)_150px_110px_90px_90px] gap-2 border-b bg-muted p-3 text-sm font-medium md:grid">
                <div>{t('transactionId')}</div>
                <div>{t('date')}</div>
                <div className="text-right">{t('amount')}</div>
                <div className="text-center">{t('type')}</div>
                <div className="text-center">{t('status')}</div>
              </div>

              {records.map((rec) => (
                <div key={`${rec.type}-${rec.id}`} className="grid gap-2 border-b p-3 text-sm last:border-0 md:grid-cols-[minmax(0,1.7fr)_150px_110px_90px_90px] md:items-center">
                  <div className="min-w-0 truncate font-medium" title={rec.id}>{rec.id}</div>
                  <div className="flex justify-between md:block">
                    <span className="text-muted-foreground md:hidden">{t('date')}</span>
                    <span className="truncate" title={rec.date}>{rec.date}</span>
                  </div>
                  <div className="flex justify-between md:block md:text-right">
                    <span className="text-muted-foreground md:hidden">{t('amount')}</span>
                    <span>{formatNumber(rec.amount)} P</span>
                  </div>
                  <div className="flex justify-between md:block md:text-center">
                    <span className="text-muted-foreground md:hidden">{t('type')}</span>
                    <span>{rec.type === 'PAYMENT' ? t('payment') : t('application')}</span>
                  </div>
                  <div className="flex justify-between md:block md:text-center">
                    <span className="text-muted-foreground md:hidden">{t('status')}</span>
                    <Badge variant={getBadgeVariant(rec)}>
                      {getStatusLabel(rec)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[100px] bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">{t('noTransactions')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
