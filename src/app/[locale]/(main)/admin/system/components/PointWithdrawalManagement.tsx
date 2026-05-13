"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils';
import { 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  DollarSign,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

export function PointWithdrawalManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // 모달 상태
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState<boolean>(false);
  const [isViewInfoModalOpen, setIsViewInfoModalOpen] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [adminMemo, setAdminMemo] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<string>('');

  // 상태 옵션
  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'PENDING', label: '신청' },
    { value: 'APPROVED', label: '완료' },
    { value: 'REJECTED', label: '실패' },
  ];

  // 기간 옵션
  const periodOptions = [
    { value: 'all', label: '전체 기간' },
    { value: '7days', label: '최근 7일' },
    { value: '30days', label: '최근 30일' },
    { value: '90days', label: '최근 90일' },
  ];

  // 출금 신청 내역 조회 함수
  const fetchWithdrawalRequests = async () => {
    setIsLoading(true);
    
    try {
      // 실제 API 엔드포인트 호출
      const response = await fetch(`/api/points/admin/withdrawals?status=${selectedStatus}&period=${selectedPeriod}&search=${searchQuery}&page=${currentPage}`);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWithdrawalRequests(data.withdrawals);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('출금 신청 내역 조회 실패:', data.error);
        toast({
          title: "조회 실패",
          description: data.error || "출금 신청 내역을 불러오는데 실패했습니다.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('출금 신청 내역 조회 오류:', error);
      toast({
        title: "조회 오류",
        description: "서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 출금 신청 승인 함수
  const approveWithdrawal = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/points/admin/withdrawals/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentAmount: parseFloat(paymentAmount),
          exchangeRate: parseFloat(exchangeRate),
          memo: adminMemo
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "승인 완료",
          description: "출금 신청이 성공적으로 승인되었습니다.",
        });
        setIsApproveModalOpen(false);
        fetchWithdrawalRequests(); // 목록 새로고침
      } else {
        console.error('출금 신청 승인 실패:', data.error);
        toast({
          title: "승인 실패",
          description: data.error || "출금 신청 승인에 실패했습니다.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('출금 신청 승인 오류:', error);
      toast({
        title: "승인 오류",
        description: "서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    }
  };

  // 출금 신청 거부 함수
  const rejectWithdrawal = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/points/admin/withdrawals/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: rejectReason,
          memo: adminMemo
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "거부 완료",
          description: "출금 신청이 거부되었습니다.",
        });
        setIsRejectModalOpen(false);
        fetchWithdrawalRequests(); // 목록 새로고침
      } else {
        console.error('출금 신청 거부 실패:', data.error);
        toast({
          title: "거부 실패",
          description: data.error || "출금 신청 거부에 실패했습니다.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('출금 신청 거부 오류:', error);
      toast({
        title: "거부 오류",
        description: "서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    }
  };

  // 관리자 메모 저장 함수
  const saveMemo = async () => {
    if (!selectedRequest) return;
    
    try {
      const response = await fetch(`/api/points/admin/withdrawals/${selectedRequest.id}/memo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memo: adminMemo
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "메모 저장 완료",
          description: "관리자 메모가 저장되었습니다.",
        });
        setIsMemoModalOpen(false);
        fetchWithdrawalRequests(); // 목록 새로고침
      } else {
        console.error('메모 저장 실패:', data.error);
        toast({
          title: "메모 저장 실패",
          description: data.error || "메모 저장에 실패했습니다.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('메모 저장 오류:', error);
      toast({
        title: "메모 저장 오류",
        description: "서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    }
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    fetchWithdrawalRequests();
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchWithdrawalRequests();
  };

  // 상태 변경 핸들러
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1); // 상태 변경 시 첫 페이지로 이동
    fetchWithdrawalRequests();
  };

  // 기간 변경 핸들러
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setCurrentPage(1); // 기간 변경 시 첫 페이지로 이동
    fetchWithdrawalRequests();
  };

  // 승인 모달 열기
  const openApproveModal = (request: any) => {
    setSelectedRequest(request);
    setPaymentAmount(request.amount.toString());
    setExchangeRate('1');
    setAdminMemo(request.memo || '');
    setIsApproveModalOpen(true);
  };

  // 거부 모달 열기
  const openRejectModal = (request: any) => {
    setSelectedRequest(request);
    setRejectReason('');
    setAdminMemo(request.memo || '');
    setIsRejectModalOpen(true);
  };

  // 메모 모달 열기
  const openMemoModal = (request: any) => {
    setSelectedRequest(request);
    setAdminMemo(request.memo || '');
    setIsMemoModalOpen(true);
  };

  // 상세 정보 모달 열기
  const openViewInfoModal = (request: any) => {
    setSelectedRequest(request);
    setIsViewInfoModalOpen(true);
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  // 상태에 따른 배지 색상 및 텍스트
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />신청</Badge>;
      case 'APPROVED':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />완료</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />실패</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  // 사용자 역할에 따른 텍스트
  const getUserRoleText = (role: number) => {
    if (role >= 40) return '업로더';
    if (role >= 20) return '영업 멤버';
    return '일반 회원';
  };

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>포인트 출금 신청 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/4">
              <label className="text-sm font-medium mb-1 block">상태</label>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="text-sm font-medium mb-1 block">기간</label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="기간 선택" />
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
            <div className="w-full md:w-2/4">
              <label className="text-sm font-medium mb-1 block">검색</label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="사용자명, 계좌번호 등으로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit">
                  <Search className="w-4 h-4 mr-2" />
                  검색
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 출금 신청 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>출금 신청 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] rounded-lg" />
          ) : withdrawalRequests.length > 0 ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b">
                <div>신청자</div>
                <div>역할</div>
                <div>금액</div>
                <div>신청일</div>
                <div>상태</div>
                <div>처리일</div>
                <div>관리</div>
              </div>
              {withdrawalRequests.map((request) => (
                <div key={request.id} className="grid grid-cols-7 gap-4 p-4 border-b last:border-0">
                  <div className="text-sm">{request.displayName} (@{request.username})</div>
                  <div className="text-sm">{getUserRoleText(request.userRole)}</div>
                  <div className="text-sm font-medium">{formatNumber(request.amount)} P</div>
                  <div className="text-sm">{new Date(request.requestedAt).toLocaleDateString()}</div>
                  <div>{getStatusBadge(request.status)}</div>
                  <div className="text-sm">
                    {request.processedAt ? new Date(request.processedAt).toLocaleDateString() : '-'}
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openViewInfoModal(request)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    {request.status === 'PENDING' && (
                      <>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => openApproveModal(request)}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => openRejectModal(request)}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openMemoModal(request)}
                    >
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">출금 신청 내역이 없습니다.</p>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 승인 모달 */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>출금 신청 승인</DialogTitle>
            <DialogDescription>
              출금 신청을 승인하고 처리 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">신청자: {selectedRequest.displayName} (@{selectedRequest.username})</p>
                <p className="text-sm">신청 금액: {formatNumber(selectedRequest.amount)} P</p>
                <p className="text-sm">신청일: {new Date(selectedRequest.requestedAt).toLocaleDateString()}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">실제 지급 금액</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="실제 지급 금액을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exchangeRate">적용 환율</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="적용 환율을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminMemo">관리자 메모</Label>
                <Textarea
                  id="adminMemo"
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  placeholder="관리자 메모를 입력하세요"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>취소</Button>
            <Button onClick={approveWithdrawal}>승인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 거부 모달 */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>출금 신청 거부</DialogTitle>
            <DialogDescription>
              출금 신청을 거부하고 사유를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">신청자: {selectedRequest.displayName} (@{selectedRequest.username})</p>
                <p className="text-sm">신청 금액: {formatNumber(selectedRequest.amount)} P</p>
                <p className="text-sm">신청일: {new Date(selectedRequest.requestedAt).toLocaleDateString()}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rejectReason">거부 사유</Label>
                <Textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="거부 사유를 입력하세요"
                />
                <p className="text-xs text-muted-foreground">
                  거부 사유는 신청자에게 전달됩니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminMemo">관리자 메모</Label>
                <Textarea
                  id="adminMemo"
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  placeholder="관리자 메모를 입력하세요"
                />
                <p className="text-xs text-muted-foreground">
                  관리자 메모는 내부용으로만 사용됩니다.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={rejectWithdrawal}>거부</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메모 모달 */}
      <Dialog open={isMemoModalOpen} onOpenChange={setIsMemoModalOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>관리자 메모</DialogTitle>
            <DialogDescription>
              내부 관리용 메모를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">신청자: {selectedRequest.displayName} (@{selectedRequest.username})</p>
                <p className="text-sm">신청 금액: {formatNumber(selectedRequest.amount)} P</p>
                <p className="text-sm">상태: {
                  selectedRequest.status === 'PENDING' ? '신청' :
                  selectedRequest.status === 'APPROVED' ? '완료' :
                  selectedRequest.status === 'REJECTED' ? '실패' : '알 수 없음'
                }</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminMemo">관리자 메모</Label>
                <Textarea
                  id="adminMemo"
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  placeholder="관리자 메모를 입력하세요"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemoModalOpen(false)}>취소</Button>
            <Button onClick={saveMemo}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상세 정보 모달 */}
      <Dialog open={isViewInfoModalOpen} onOpenChange={setIsViewInfoModalOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>출금 신청 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">신청 정보</h3>
                <div className="p-3 bg-muted rounded-md space-y-1">
                  <p className="text-sm">신청 ID: {selectedRequest.id}</p>
                  <p className="text-sm">신청자: {selectedRequest.displayName} (@{selectedRequest.username})</p>
                  <p className="text-sm">역할: {getUserRoleText(selectedRequest.userRole)}</p>
                  <p className="text-sm">신청 금액: {formatNumber(selectedRequest.amount)} P</p>
                  <p className="text-sm">신청일: {new Date(selectedRequest.requestedAt).toLocaleDateString()}</p>
                  <p className="text-sm">상태: {
                    selectedRequest.status === 'PENDING' ? '신청' :
                    selectedRequest.status === 'APPROVED' ? '완료' :
                    selectedRequest.status === 'REJECTED' ? '실패' : '알 수 없음'
                  }</p>
                  {selectedRequest.processedAt && (
                    <p className="text-sm">처리일: {new Date(selectedRequest.processedAt).toLocaleDateString()}</p>
                  )}
                  {selectedRequest.reason && (
                    <p className="text-sm">사유: {selectedRequest.reason}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">계좌 정보</h3>
                <div className="p-3 bg-muted rounded-md space-y-1">
                  <p className="text-sm">예금주: {selectedRequest.bankInfo.accountHolder}</p>
                  <p className="text-sm">국가: {
                    selectedRequest.bankInfo.country === 'KOREAN' ? '대한민국' :
                    selectedRequest.bankInfo.country === 'ENGLISH' ? '미국' :
                    selectedRequest.bankInfo.country === 'CHINESE' ? '중국' :
                    selectedRequest.bankInfo.country === 'JAPANESE' ? '일본' :
                    selectedRequest.bankInfo.country === 'THAI' ? '태국' :
                    selectedRequest.bankInfo.country === 'SPANISH' ? '스페인' :
                    selectedRequest.bankInfo.country === 'INDONESIAN' ? '인도네시아' :
                    selectedRequest.bankInfo.country === 'VIETNAMESE' ? '베트남' :
                    selectedRequest.bankInfo.country
                  }</p>
                  <p className="text-sm">은행명: {selectedRequest.bankInfo.bankName}</p>
                  <p className="text-sm">계좌번호: {selectedRequest.bankInfo.accountNumber}</p>
                  {selectedRequest.bankInfo.swiftCode && (
                    <p className="text-sm">SWIFT 코드: {selectedRequest.bankInfo.swiftCode}</p>
                  )}
                  {selectedRequest.bankInfo.address && (
                    <p className="text-sm">주소: {selectedRequest.bankInfo.address}</p>
                  )}
                  {selectedRequest.bankInfo.phoneNumber && (
                    <p className="text-sm">전화번호: {selectedRequest.bankInfo.phoneNumber}</p>
                  )}
                  {selectedRequest.bankInfo.paypalInfo && (
                    <p className="text-sm">페이팔 정보: {selectedRequest.bankInfo.paypalInfo}</p>
                  )}
                </div>
              </div>
              
              {selectedRequest.memo && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">관리자 메모</h3>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">{selectedRequest.memo}</p>
                  </div>
                </div>
              )}
              
              {selectedRequest.status === 'APPROVED' && selectedRequest.paymentAmount && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">지급 정보</h3>
                  <div className="p-3 bg-muted rounded-md space-y-1">
                    <p className="text-sm">지급 금액: {formatNumber(selectedRequest.paymentAmount)}</p>
                    {selectedRequest.exchangeRate && (
                      <p className="text-sm">적용 환율: {selectedRequest.exchangeRate}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewInfoModalOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
