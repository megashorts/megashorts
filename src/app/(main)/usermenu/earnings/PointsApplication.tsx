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

interface PointsApplicationProps {
  userId: string;
  userRole: number; // 40: 업로더, 20: 영업 멤버
}

export default function PointsApplication({ userId, userRole }: PointsApplicationProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 통합된 거래 목록 (지급 + 신청 합친 것)
  const [records, setRecords] = useState<any[]>([]);

  const [userStatus, setUserStatus] = useState<{
    isVerified: boolean;
    availablePoints: number;
    creatorInfo: any;
  }>({
    isVerified: false,
    availablePoints: 0,
    creatorInfo: null,
  });
  
  // 신청 모달 상태
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

  // 업로더인지 영업 멤버인지 확인
  const isUploader = userRole >= 40;

  // 기간 옵션 (프론트에서 정의)
  const periodOptions = [
    { value: 'all', label: '전체 기간' },
    { value: '7days', label: '최근 7일' },
    { value: '30days', label: '최근 30일' },
    { value: '90days', label: '최근 90일' },
  ];

  // ----------------------------
  // 유저 상태 조회 (기존 코드 유지)
  // ----------------------------
  const fetchUserStatus = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/points/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const user = data.data;
        
        setUserStatus({
          isVerified: user.emailVerified || false,
          availablePoints: user.points || 0,
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
        console.error('사용자 정보 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------
  // Helper: 기간 -> 시작일 계산 (클라이언트 필터링용)
  // ----------------------------
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
    // 'all' 또는 기본
    return 0;
  };

  // ----------------------------
  // 지급/신청 조회 및 통합 (중요 변경 부분)
  // - 기존처럼 백엔드의 두 API를 호출하되, 클라이언트에서 정규화/병합/필터링/정렬
  // ----------------------------
  const fetchPaymentHistory = async (period: string) => {
    setIsLoading(true);

    try {
      // 1) 지급 API 호출 (백엔드가 period를 지원하면 쿼리로 전달)
      const paymentsResponse = await fetch(`/api/points/payments?userId=${userId}&period=${period}`);
      if (!paymentsResponse.ok) {
        throw new Error(`API 호출 실패: ${paymentsResponse.status} ${paymentsResponse.statusText}`);
      }
      const paymentsData = await paymentsResponse.json();

      // 백엔드 응답 구조가 서비스마다 달라서 안전하게 접근
      const paymentsArr = paymentsData.success
        ? (paymentsData.data?.payments || paymentsData.withdrawals || [])
        : [];

      // 2) 신청 API 호출
      const applicationsResponse = await fetch(`/api/points/applications?userId=${userId}&period=${period}`);
      if (!applicationsResponse.ok) {
        throw new Error(`API 호출 실패: ${applicationsResponse.status} ${applicationsResponse.statusText}`);
      }
      const applicationsData = await applicationsResponse.json();
      const applicationsArr = applicationsData.success
        ? (applicationsData.data?.applications || [])
        : [];

      // 3) 정규화(normalize) - 두 타입을 같은 shape으로 맞춤
      const normalizedPayments = paymentsArr.map((p: any) => ({
        id: String(p.id ?? p._id ?? ''),
        // 가능한 date 필드들을 순서대로 사용
        date: p.date || p.paidAt || p.updatedAt || p.createdAt || '',
        amount: Number(p.amount ?? p.points ?? 0),
        status: p.status ?? 'completed', // 지급은 'completed' 등
        type: 'PAYMENT' as const,
        raw: p,
      }));

      const normalizedApplications = applicationsArr.map((a: any) => ({
        id: String(a.id ?? a._id ?? ''),
        date: a.createdAt || a.date || a.requestedAt || '',
        amount: Number(a.amount ?? a.points ?? 0),
        status: a.status ?? 'PENDING', // 신청은 'PENDING' 등
        type: 'APPLICATION' as const,
        raw: a,
      }));

      // 4) 합치고 날짜 기준 내림차순 정렬
      let combined = [...normalizedPayments, ...normalizedApplications];
      combined.sort((a, b) => {
        const ta = Date.parse(a.date || '') || 0;
        const tb = Date.parse(b.date || '') || 0;
        return tb - ta; // 최신이 위로
      });

      // 5) 클라이언트에서 period 필터링 (백엔드가 처리하지 않아도 동작하도록)
      if (period !== 'all') {
        const startTs = getStartDateForPeriod(period);
        combined = combined.filter((r) => {
          const t = Date.parse(r.date || '');
          return !isNaN(t) && t >= startTs;
        });
      }

      // 6) 상태 저장
      setRecords(combined);
    } catch (error) {
      console.error('지급/신청 통합 조회 오류:', error);
      setRecords([]); // 실패 시 빈 배열
    } finally {
      setIsLoading(false);
    }
  };

  // 포인트 신청 제출 (기존)
  const submitApplication = async () => {
    try {
      if (applicationForm.amount <= 0) {
        alert('신청 금액은 0보다 커야 합니다.');
        return;
      }
      
      if (applicationForm.amount > userStatus.availablePoints) {
        alert('신청 금액이 사용 가능한 포인트를 초과합니다.');
        return;
      }
      
      if (!userStatus.creatorInfo || !userStatus.creatorInfo.idCheck) {
        alert('포인트 지급을 위한 정보 제출이나 확인이 완료되지 않았습니다.');
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
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        alert('포인트 신청이 완료되었습니다.');
        setIsApplicationModalOpen(false);
        
        // 갱신: 유저 상태 + 통합 레코드 재조회
        fetchUserStatus();
        fetchPaymentHistory(selectedPeriod);
      } else {
        alert(`포인트 신청 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('포인트 신청 실패:', error);
      alert('포인트 신청 중 오류가 발생했습니다.');
    }
  };

  // CreatorInfo 저장 (기존)
  const submitCreatorInfo = async () => {
    try {
      if (!creatorInfoForm.accountHolder || !creatorInfoForm.bankName || !creatorInfoForm.accountNumber) {
        alert('필수 정보를 모두 입력해주세요.');
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
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        alert('크리에이터 정보가 저장되었습니다.');
        setIsVerificationModalOpen(false);
        fetchUserStatus();
      } else {
        alert(`크리에이터 정보 저장 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('크리에이터 정보 저장 실패:', error);
      alert('크리에이터 정보 저장 중 오류가 발생했습니다.');
    }
  };

  // 기간 선택 시
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    fetchPaymentHistory(value);
  };

  // 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchUserStatus();
    fetchPaymentHistory(selectedPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------
  // UI 렌더 관련 헬퍼: 상태 라벨/배지 variant
  // ----------------------------
  const getStatusLabel = (rec: any) => {
    if (rec.type === 'PAYMENT') {
      return rec.status === 'completed' ? '지급 완료' : '처리 중';
    } else {
      // APPLICATION
      if (rec.status === 'APPROVED') return '승인됨';
      if (rec.status === 'REJECTED') return '거부됨';
      return '처리 중';
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
    <div className="space-y-6">
      {/* 자격 인증 정보 (기존 UI 유지) */}
      <Card>
        <CardHeader>
          <CardTitle>크리에이터 정보 확인</CardTitle>
          <CardDescription>
            포인트 지급을 위해서는 이메일 인증, 크리에이터 정보 등록, 신분정보 확인이 필요합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 rounded-lg" />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Badge variant={userStatus.isVerified ? "secondary" : "destructive"}>
                    {userStatus.isVerified ? "이메일 인증 완료" : "이메일 미인증"}
                  </Badge>
                  <Badge variant={userStatus.creatorInfo?.bankName ? "secondary" : "destructive"}>
                    {userStatus.creatorInfo?.bankName ? "크리에이터 정보 등록 완료" : "크리에이터 정보 미등록"}
                  </Badge>
                  <Badge variant={userStatus.creatorInfo?.idCheck ? "secondary" : "destructive"}>
                    {userStatus.creatorInfo?.idCheck ? "신분확인정보 제출 확인" : "신분확인정보 제출 미확인"}
                  </Badge>
                </div>
              </div>

              <div className={`p-4 rounded-md border ${(userStatus.isVerified && userStatus.creatorInfo?.idCheck) ? "border-gray-200 bg-gray-20" : "border-red-200 bg-red-60"}`}>
                <div className="flex items-start">
                  <AlertCircle className={`h-5 w-5 mr-2 ${(userStatus.isVerified && userStatus.creatorInfo?.idCheck) ? "text-gray-500" : "text-red-500"}`} />
                  <div>
                    <h4 className="font-medium">
                      {(userStatus.isVerified && userStatus.creatorInfo?.idCheck)
                        ? "인증완료. 포인트 지급 신청이 가능합니다." 
                        : "인증이 필요합니다"}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(userStatus.isVerified && userStatus.creatorInfo?.idCheck)
                        ? (
                            <>
                              은행: {creatorInfoForm.bankName}&nbsp;&nbsp; 
                              예금주: {creatorInfoForm.accountHolder}&nbsp;&nbsp; 
                              계좌번호: {creatorInfoForm.accountNumber}
                            </>
                          ) 
                        : "국가별 인증서류(신분증, 거주증명 등)를 hello@megashorts.com으로 발송하세요. 확인 후 처리됩니다."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div>
                  <h3 className="text-lg font-medium text-muted-foreground">🎁 나의 포인트 </h3>
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
                        ? "크리에이터 정보 수정" 
                        : "크리에이터 정보 입력"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>크리에이터 정보 입력</DialogTitle>
                      <DialogDescription>
                        국가별 인증서류(신분증)를 hello@megashorts.com으로 발송하세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* ... 폼 (기존 코드 유지) */}
                      <div className="space-y-2">
                        <Label htmlFor="accountHolder">예금주 <span className="text-red-500">*</span></Label>
                        <Input
                          id="accountHolder"
                          value={creatorInfoForm.accountHolder}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, accountHolder: e.target.value})}
                          placeholder="예금주를 입력하세요"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">국가 <span className="text-red-500">*</span></Label>
                        <Select 
                          value={creatorInfoForm.country} 
                          onValueChange={(value) => setCreatorInfoForm({...creatorInfoForm, country: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="국가 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KR">🇰🇷 대한민국</SelectItem>
                            <SelectItem value="US">🇺🇸 미국</SelectItem>
                            <SelectItem value="CN">🇨🇳 중국</SelectItem>
                            <SelectItem value="JP">🇯🇵 일본</SelectItem>
                            <SelectItem value="TH">🇹🇭 태국</SelectItem>
                            <SelectItem value="ES">🇪🇸 스페인</SelectItem>
                            <SelectItem value="ID">🇮🇩 인도네시아</SelectItem>
                            <SelectItem value="VN">🇻🇳 베트남</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankName">은행명 <span className="text-red-500">*</span></Label>
                        <Input
                          id="bankName"
                          value={creatorInfoForm.bankName}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, bankName: e.target.value})}
                          placeholder="은행명을 입력하세요"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">계좌번호 <span className="text-red-500">*</span></Label>
                        <Input
                          id="accountNumber"
                          value={creatorInfoForm.accountNumber}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, accountNumber: e.target.value})}
                          placeholder="계좌번호를 입력하세요"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="swiftCode">SWIFT 코드</Label>
                        <Input
                          id="swiftCode"
                          value={creatorInfoForm.swiftCode}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, swiftCode: e.target.value})}
                          placeholder="해외 송금시 필요한 SWIFT 코드"
                        />
                        <p className="text-xs text-muted-foreground">
                          해외 은행 계좌인 경우 필요합니다.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paypalEmail">페이팔 이메일</Label>
                        <Input
                          id="paypalEmail"
                          type="email"
                          value={creatorInfoForm.paypalEmail}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, paypalEmail: e.target.value})}
                          placeholder="페이팔 이메일 주소"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">전화번호</Label>
                        <Input
                          id="phoneNumber"
                          value={creatorInfoForm.phoneNumber}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, phoneNumber: e.target.value})}
                          placeholder="전화번호를 입력하세요"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">주소</Label>
                        <Textarea
                          id="address"
                          value={creatorInfoForm.address}
                          onChange={(e) => setCreatorInfoForm({...creatorInfoForm, address: e.target.value})}
                          placeholder="주소를 입력하세요"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsVerificationModalOpen(false)}>취소</Button>
                      <Button onClick={submitCreatorInfo}>저장</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isApplicationModalOpen} onOpenChange={setIsApplicationModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => setApplicationForm({...applicationForm, amount: Math.min(10000, userStatus.availablePoints)})}
                      disabled={!userStatus.isVerified || !userStatus.creatorInfo?.idCheck || userStatus.availablePoints <= 0}
                    >
                      포인트 지급 신청
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>포인트 지급 신청</DialogTitle>
                      <DialogDescription>
                        신청할 포인트 금액과 계좌 정보를 확인해주세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">신청 금액 (포인트)</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={applicationForm.amount}
                          onChange={(e) => setApplicationForm({...applicationForm, amount: Math.min(Number(e.target.value), userStatus.availablePoints)})}
                          max={userStatus.availablePoints}
                          min={1}
                        />
                        <p className="text-xs text-muted-foreground">
                          사용 가능한 포인트: {formatNumber(userStatus.availablePoints)} P
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>계좌 정보</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm">{userStatus.creatorInfo?.bankName} {userStatus.creatorInfo?.accountNumber}</p>
                          <p className="text-sm">예금주: {userStatus.creatorInfo?.accountHolder}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">신청 사유 (선택사항)</Label>
                        <Textarea
                          id="reason"
                          value={applicationForm.reason}
                          onChange={(e) => setApplicationForm({...applicationForm, reason: e.target.value})}
                          placeholder="신청 사유를 입력하세요"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsApplicationModalOpen(false)}>취소</Button>
                      <Button onClick={submitApplication}>신청</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- 지급/신청 통합 조회 (단일 테이블) ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>거래 내역</CardTitle>
          <CardDescription>
            포인트 신청 및 지급 기록을 함께 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/3">
              {/* <label className="text-sm font-medium mb-1 block">조회 기간</label> */}
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="조회 기간 선택" />
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
                조회
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-[200px] rounded-lg" />
          ) : records.length > 0 ? (
            <div className="border rounded-md">
              {/* <div className="p-3 bg-muted font-medium">거래 내역</div> */}
              <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b bg-muted">
                <div>거래 ID</div>
                <div>날짜</div>
                <div>금액</div>
                <div>유형</div>
                <div>상태</div>
              </div>

              {records.map((rec) => (
                <div key={`${rec.type}-${rec.id}`} className="grid grid-cols-5 gap-4 p-4 border-b last:border-0 items-center">
                  <div className="text-sm">{rec.id}</div>
                  <div className="text-sm">{rec.date}</div>
                  <div className="text-sm">{formatNumber(rec.amount)} P</div>
                  <div className="text-sm">{rec.type === 'PAYMENT' ? '지급' : '신청'}</div>
                  <div>
                    <Badge variant={getBadgeVariant(rec)}>
                      {getStatusLabel(rec)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[100px] bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">거래 내역이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
