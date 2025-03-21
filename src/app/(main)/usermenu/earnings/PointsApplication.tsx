"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils';
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
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<any[]>([]);
  const [userStatus, setUserStatus] = useState<{
    isVerified: boolean;
    availablePoints: number;
    bankInfo: boolean;
  }>({
    isVerified: false,
    availablePoints: 0,
    bankInfo: false,
  });
  
  // 신청 모달 상태
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState<boolean>(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [applicationForm, setApplicationForm] = useState({
    amount: 0,
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    reason: '',
    country: 'KOREAN',
    swiftCode: '',
    address: '',
    phoneNumber: '',
    paypalInfo: ''
  });

  // 업로더인지 영업 멤버인지 확인
  const isUploader = userRole >= 40;

  // 기간 옵션
  const periodOptions = [
    { value: 'all', label: '전체 기간' },
    { value: '2025-Q1', label: '2025년 1분기' },
    { value: '2025-01', label: '2025년 1월' },
    { value: '2025-02', label: '2025년 2월' },
  ];

  // 사용자 상태 조회 함수
  const fetchUserStatus = async () => {
    setIsLoading(true);
    
    try {
      // 사용자 정보 조회 API 호출
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
          bankInfo: !!user.bankInfo
        });
        
        // 은행 정보가 있는 경우 폼에 설정
        if (user.bankInfo) {
          setApplicationForm({
            ...applicationForm,
            bankName: user.bankInfo.bankName || '',
            accountNumber: user.bankInfo.accountNumber || '',
            accountHolder: user.bankInfo.accountHolder || '',
            country: user.bankInfo.country || 'KOREAN',
            swiftCode: user.bankInfo.swiftCode || '',
            address: user.bankInfo.address || '',
            phoneNumber: user.bankInfo.phoneNumber || '',
            paypalInfo: user.bankInfo.paypalInfo || ''
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

  // 지급 내역 조회 함수
  const fetchPaymentHistory = async (period: string) => {
    setIsLoading(true);
    
    try {
      // 지급 내역 조회 API 호출
      const response = await fetch(`/api/points/payments?userId=${userId}&period=${period}`);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentHistory(data.data.payments || []);
      } else {
        console.error('지급 내역 조회 실패:', data.error);
      }
      
      // 지급 신청 내역 조회 API 호출
      const applicationsResponse = await fetch(`/api/points/applications?userId=${userId}&period=${period}`);
      
      if (!applicationsResponse.ok) {
        throw new Error(`API 호출 실패: ${applicationsResponse.status} ${applicationsResponse.statusText}`);
      }
      
      const applicationsData = await applicationsResponse.json();
      
      if (applicationsData.success) {
        setApplicationHistory(applicationsData.data.applications || []);
      } else {
        console.error('지급 신청 내역 조회 실패:', applicationsData.error);
      }
    } catch (error) {
      console.error('지급 내역 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 포인트 신청 제출 함수
  const submitApplication = async () => {
    try {
      // 유효성 검사
      if (applicationForm.amount <= 0) {
        alert('신청 금액은 0보다 커야 합니다.');
        return;
      }
      
      if (applicationForm.amount > userStatus.availablePoints) {
        alert('신청 금액이 사용 가능한 포인트를 초과합니다.');
        return;
      }
      
      if (!applicationForm.bankName || !applicationForm.accountNumber || !applicationForm.accountHolder) {
        alert('은행 정보를 모두 입력해주세요.');
        return;
      }
      
      // 포인트 지급 신청 API 호출
      const response = await fetch('/api/points/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: applicationForm.amount,
          bankInfo: {
            accountHolder: applicationForm.accountHolder,
            country: applicationForm.country,
            bankName: applicationForm.bankName,
            accountNumber: applicationForm.accountNumber,
            swiftCode: applicationForm.swiftCode,
            address: applicationForm.address,
            phoneNumber: applicationForm.phoneNumber,
            paypalInfo: applicationForm.paypalInfo
          },
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
        
        // 상태 갱신
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

  // 인증 정보 제출 함수
  const submitVerification = async () => {
    try {
      // 인증 정보 저장 API 호출
      const response = await fetch(`/api/points/users/${userId}/bank-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankInfo: {
            accountHolder: applicationForm.accountHolder,
            country: applicationForm.country,
            bankName: applicationForm.bankName,
            accountNumber: applicationForm.accountNumber,
            swiftCode: applicationForm.swiftCode,
            address: applicationForm.address,
            phoneNumber: applicationForm.phoneNumber,
            paypalInfo: applicationForm.paypalInfo
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        alert('인증 정보가 저장되었습니다.');
        setIsVerificationModalOpen(false);
        
        // 상태 갱신
        fetchUserStatus();
      } else {
        alert(`인증 정보 저장 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('인증 정보 저장 실패:', error);
      alert('인증 정보 저장 중 오류가 발생했습니다.');
    }
  };

  // 기간 선택 시 호출
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    fetchPaymentHistory(value);
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchUserStatus();
    fetchPaymentHistory(selectedPeriod);
  }, []);

  return (
    <div className="space-y-6">
      {/* 자격 인증 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>자격 인증 정보</CardTitle>
          <CardDescription>
            포인트 지급을 위한 인증 정보를 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 rounded-lg" />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">인증 상태</h3>
                  <p className="text-sm text-muted-foreground">
                    포인트 지급을 위해서는 본인 인증 및 계좌 정보가 필요합니다.
                  </p>
                </div>
                <Badge variant={userStatus.isVerified ? "default" : "destructive"}>
                  {userStatus.isVerified ? "인증 완료" : "미인증"}
                </Badge>
              </div>

              <div className={`p-4 rounded-md border ${userStatus.isVerified ? "border-gray-200 bg-gray-50" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-start">
                  <AlertCircle className={`h-5 w-5 mr-2 ${userStatus.isVerified ? "text-gray-500" : "text-red-500"}`} />
                  <div>
                    <h4 className="font-medium">
                      {userStatus.isVerified 
                        ? "인증이 완료되었습니다" 
                        : "인증이 필요합니다"}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {userStatus.isVerified 
                        ? "포인트 지급 신청이 가능합니다." 
                        : "포인트 지급을 위해 본인 인증 및 계좌 정보를 등록해주세요."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">지급 가능 포인트</h3>
                  <p className="text-sm text-muted-foreground">
                    현재 지급 신청 가능한 포인트 잔액입니다.
                  </p>
                </div>
                <div className="text-xl font-bold">
                  {formatNumber(userStatus.availablePoints)} P
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Dialog open={isVerificationModalOpen} onOpenChange={setIsVerificationModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      인증 정보 입력
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>인증 정보 입력</DialogTitle>
                      <DialogDescription>
                        포인트 지급을 위한 계좌 정보를 입력해주세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountHolder">예금주 <span className="text-red-500">*</span></Label>
                        <Input
                          id="accountHolder"
                          value={applicationForm.accountHolder}
                          onChange={(e) => setApplicationForm({...applicationForm, accountHolder: e.target.value})}
                          placeholder="예금주를 입력하세요"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="country">국가 <span className="text-red-500">*</span></Label>
                        <div className="flex items-center space-x-2">
                          <Select 
                            value={applicationForm.country || 'KOREAN'} 
                            onValueChange={(value) => setApplicationForm({...applicationForm, country: value})}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="국가 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KOREAN">
                                <div className="flex items-center">
                                  <span className="mr-2">🇰🇷</span>
                                  <span>대한민국</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="ENGLISH">
                                <div className="flex items-center">
                                  <span className="mr-2">🇺🇸</span>
                                  <span>미국</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="CHINESE">
                                <div className="flex items-center">
                                  <span className="mr-2">🇨🇳</span>
                                  <span>중국</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="JAPANESE">
                                <div className="flex items-center">
                                  <span className="mr-2">🇯🇵</span>
                                  <span>일본</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="THAI">
                                <div className="flex items-center">
                                  <span className="mr-2">🇹🇭</span>
                                  <span>태국</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="SPANISH">
                                <div className="flex items-center">
                                  <span className="mr-2">🇪🇸</span>
                                  <span>스페인</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="INDONESIAN">
                                <div className="flex items-center">
                                  <span className="mr-2">🇮🇩</span>
                                  <span>인도네시아</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="VIETNAMESE">
                                <div className="flex items-center">
                                  <span className="mr-2">🇻🇳</span>
                                  <span>베트남</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bankName">은행명</Label>
                        <Input
                          id="bankName"
                          value={applicationForm.bankName}
                          onChange={(e) => setApplicationForm({...applicationForm, bankName: e.target.value})}
                          placeholder="은행명을 입력하세요"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">계좌번호</Label>
                        <Input
                          id="accountNumber"
                          value={applicationForm.accountNumber}
                          onChange={(e) => setApplicationForm({...applicationForm, accountNumber: e.target.value})}
                          placeholder="계좌번호를 입력하세요"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="swiftCode">SWIFT 코드</Label>
                        <Input
                          id="swiftCode"
                          value={applicationForm.swiftCode || ''}
                          onChange={(e) => setApplicationForm({...applicationForm, swiftCode: e.target.value})}
                          placeholder="해외 송금시 필요한 SWIFT 코드"
                        />
                        <p className="text-xs text-muted-foreground">
                          해외 은행 계좌인 경우 필요합니다.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">주소</Label>
                        <Textarea
                          id="address"
                          value={applicationForm.address || ''}
                          onChange={(e) => setApplicationForm({...applicationForm, address: e.target.value})}
                          placeholder="주소를 입력하세요"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">전화번호</Label>
                        <Input
                          id="phoneNumber"
                          value={applicationForm.phoneNumber || ''}
                          onChange={(e) => setApplicationForm({...applicationForm, phoneNumber: e.target.value})}
                          placeholder="전화번호를 입력하세요"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="paypalInfo">페이팔 정보</Label>
                        <Input
                          id="paypalInfo"
                          value={applicationForm.paypalInfo || ''}
                          onChange={(e) => setApplicationForm({...applicationForm, paypalInfo: e.target.value})}
                          placeholder="페이팔 이메일 또는 전화번호"
                        />
                        <p className="text-xs text-muted-foreground">
                          페이팔로 받기를 원하는 경우 입력하세요.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsVerificationModalOpen(false)}>취소</Button>
                      <Button onClick={submitVerification}>저장</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isApplicationModalOpen} onOpenChange={setIsApplicationModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => setApplicationForm({...applicationForm, amount: Math.min(10000, userStatus.availablePoints)})}
                      disabled={!userStatus.isVerified || userStatus.availablePoints <= 0}
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
                          <p className="text-sm">{applicationForm.bankName} {applicationForm.accountNumber}</p>
                          <p className="text-sm">예금주: {applicationForm.accountHolder}</p>
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

      {/* 지급 내역 조회 */}
      <Card>
        <CardHeader>
          <CardTitle>지급 내역 조회</CardTitle>
          <CardDescription>
            포인트 지급 내역을 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">조회 기간</label>
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

          {/* 조회 결과 - 지급 내역 */}
          {isLoading ? (
            <Skeleton className="h-[200px] rounded-lg" />
          ) : paymentHistory.length > 0 ? (
            <div className="border rounded-md mb-6">
              <div className="p-3 bg-muted font-medium">지급 내역</div>
              <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
                <div>지급 ID</div>
                <div>지급일</div>
                <div>금액</div>
                <div>상태</div>
              </div>
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="grid grid-cols-4 gap-4 p-4 border-b last:border-0">
                  <div className="text-sm">{payment.id}</div>
                  <div className="text-sm">{payment.date}</div>
                  <div className="text-sm">{formatNumber(payment.amount)} P</div>
                  <div>
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                      {payment.status === 'completed' ? '지급 완료' : '처리 중'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[100px] bg-muted rounded-md flex items-center justify-center mb-6">
              <p className="text-muted-foreground">지급 내역이 없습니다.</p>
            </div>
          )}

          {/* 조회 결과 - 신청 내역 */}
          {isLoading ? (
            <Skeleton className="h-[200px] rounded-lg" />
          ) : applicationHistory.length > 0 ? (
            <div className="border rounded-md">
              <div className="p-3 bg-muted font-medium">신청 내역</div>
              <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
                <div>신청 ID</div>
                <div>신청일</div>
                <div>금액</div>
                <div>상태</div>
              </div>
              {applicationHistory.map((application) => (
                <div key={application.id} className="grid grid-cols-4 gap-4 p-4 border-b last:border-0">
                  <div className="text-sm">{application.id}</div>
                  <div className="text-sm">{application.createdAt}</div>
                  <div className="text-sm">{formatNumber(application.amount)} P</div>
                  <div>
                    <Badge 
                      variant={
                        application.status === 'APPROVED' ? 'default' : 
                        application.status === 'REJECTED' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {application.status === 'APPROVED' ? '승인됨' : 
                       application.status === 'REJECTED' ? '거부됨' : 
                       '처리 중'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[100px] bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">신청 내역이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
