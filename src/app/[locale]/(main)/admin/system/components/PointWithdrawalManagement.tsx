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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    { value: 'all', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  // 기간 옵션
  const periodOptions = [
    { value: 'all', label: 'All' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
  ];

  // 출금 신청 내역 조회 함수
  const fetchWithdrawalRequests = async () => {
    setIsLoading(true);

    try {
      // 실제 API 엔드포인트 호출
      const response = await fetch(`/api/points/admin/withdrawals?status=${selectedStatus}&period=${selectedPeriod}&search=${searchQuery}&page=${currentPage}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setWithdrawalRequests(data.withdrawals);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('Failed to load withdrawal requests:', data.error);
        toast({
          title: "Fetch Failed",
          description: data.error || "Failed to load withdrawal requests.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to load withdrawal requests error:', error);
      toast({
        title: "Fetch Error",
        description: "A server connection issue occurred. Please try again in a moment.",
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
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Approved Successfully",
          description: "The withdrawal request has been approved.",
        });
        setIsApproveModalOpen(false);
        fetchWithdrawalRequests(); // 목록 새로고침
      } else {
        console.error('Failed to approve withdrawal request:', data.error);
        toast({
          title: "Approval Failed",
          description: data.error || "Failed to approve the withdrawal request.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Approve withdrawal request error:', error);
      toast({
        title: "Approval Error",
        description: "A server connection issue occurred. Please try again in a moment.",
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
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Rejected Successfully",
          description: "The withdrawal request has been rejected.",
        });
        setIsRejectModalOpen(false);
        fetchWithdrawalRequests(); // 목록 새로고침
      } else {
        console.error('Failed to reject withdrawal request:', data.error);
        toast({
          title: "Rejection Failed",
          description: data.error || "Failed to reject the withdrawal request.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Reject withdrawal request error:', error);
      toast({
        title: "Rejection Error",
        description: "A server connection issue occurred. Please try again in a moment.",
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
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Memo Saved",
          description: "Admin memo has been saved.",
        });
        setIsMemoModalOpen(false);
        fetchWithdrawalRequests(); // 목록 새로고침
      } else {
        console.error('Failed to save memo:', data.error);
        toast({
          title: "Save Memo Failed",
          description: data.error || "Failed to save the memo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Save memo error:', error);
      toast({
        title: "Save Memo Error",
        description: "A server connection issue occurred. Please try again in a moment.",
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
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // 사용자 역할에 따른 텍스트
  const getUserRoleText = (role: number) => {
    if (role >= 40) return 'Uploader';
    if (role >= 20) return 'Agency Member';
    return 'Member';
  };

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>Point Withdrawal Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/4">
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
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
              <label className="text-sm font-medium mb-1 block">Period</label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Period" />
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
              <label className="text-sm font-medium mb-1 block">Search</label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search by username, account number, etc."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 출금 신청 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full rounded-lg sm:hidden" />
              <Skeleton className="h-[400px] rounded-lg hidden sm:block" />
            </div>
          ) : withdrawalRequests.length > 0 ? (
            <>
              {/* 모바일 화면용 카드 리스트 */}
              <div className="sm:hidden space-y-3">
                {withdrawalRequests.map((request) => {
                  const isPending = request.status === 'PENDING';
                  return (
                    <div key={request.id} className="p-3 border rounded-lg bg-card space-y-2 shadow-xs">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 min-w-0">
                          <p className="font-semibold truncate text-sm">{request.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">@{request.username}</p>
                        </div>
                        <div>{getStatusBadge(request.status)}</div>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center text-[11px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">{getUserRoleText(request.userRole)}</Badge>
                        <span>Req: {new Date(request.requestedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t text-[11px] items-center">
                        <div>
                          <span className="text-muted-foreground">Amount: </span>
                          <span className="font-semibold text-sm">{formatNumber(request.amount)} P</span>
                        </div>

                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openViewInfoModal(request)}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {isPending && (
                            <>
                              <Button
                                variant="default"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openApproveModal(request)}
                                title="Approve"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openRejectModal(request)}
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openMemoModal(request)}
                            title="Admin Memo"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 데스크탑 화면용 테이블 */}
              <div className="hidden sm:block border rounded-md w-full overflow-x-auto">
                <Table className="min-w-[800px] table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Applicant</TableHead>
                      <TableHead className="w-[120px] hidden md:table-cell">Role</TableHead>
                      <TableHead className="w-[120px]">Amount</TableHead>
                      <TableHead className="w-[140px]">Requested At</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="w-[140px] hidden lg:table-cell">Processed At</TableHead>
                      <TableHead className="w-[160px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawalRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium max-w-[190px]" title={`${request.displayName} (@${request.username})`}>
                          <div className="truncate font-semibold">{request.displayName}</div>
                          <div className="text-xs text-muted-foreground truncate">@{request.username}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{getUserRoleText(request.userRole)}</TableCell>
                        <TableCell className="text-sm font-medium">{formatNumber(request.amount)} P</TableCell>
                        <TableCell className="text-sm">{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {request.processedAt ? new Date(request.processedAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openViewInfoModal(request)}
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openApproveModal(request)}
                                  title="Approve"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openRejectModal(request)}
                                  title="Reject"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openMemoModal(request)}
                              title="Admin Memo"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="h-[200px] bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">No withdrawal requests found.</p>
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
                  Prev
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
                  Next
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
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription>
              Approve the withdrawal request and enter processing details.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                <p><span className="font-semibold">Applicant:</span> {selectedRequest.displayName} (@{selectedRequest.username})</p>
                <p><span className="font-semibold">Requested Amount:</span> {formatNumber(selectedRequest.amount)} P</p>
                <p><span className="font-semibold">Requested At:</span> {new Date(selectedRequest.requestedAt).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Actual Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter actual payment amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchangeRate">Exchange Rate</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="Enter exchange rate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminMemo">Admin Memo</Label>
                <Textarea
                  id="adminMemo"
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  placeholder="Enter admin memo"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
            <Button onClick={approveWithdrawal}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 거부 모달 */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Reject the withdrawal request and enter the reason.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                <p><span className="font-semibold">Applicant:</span> {selectedRequest.displayName} (@{selectedRequest.username})</p>
                <p><span className="font-semibold">Requested Amount:</span> {formatNumber(selectedRequest.amount)} P</p>
                <p><span className="font-semibold">Requested At:</span> {new Date(selectedRequest.requestedAt).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectReason">Reason for Rejection</Label>
                <Textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter the reason for rejection"
                />
                <p className="text-xs text-muted-foreground">
                  The rejection reason will be sent to the applicant.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminMemo">Admin Memo</Label>
                <Textarea
                  id="adminMemo"
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  placeholder="Enter admin memo"
                />
                <p className="text-xs text-muted-foreground">
                  Admin memo is for internal use only.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={rejectWithdrawal}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메모 모달 */}
      <Dialog open={isMemoModalOpen} onOpenChange={setIsMemoModalOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Admin Memo</DialogTitle>
            <DialogDescription>
              Enter internal admin memo.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                <p><span className="font-semibold">Applicant:</span> {selectedRequest.displayName} (@{selectedRequest.username})</p>
                <p><span className="font-semibold">Requested Amount:</span> {formatNumber(selectedRequest.amount)} P</p>
                <p><span className="font-semibold">Status:</span> {
                  selectedRequest.status === 'PENDING' ? 'Pending' :
                  selectedRequest.status === 'APPROVED' ? 'Approved' :
                  selectedRequest.status === 'REJECTED' ? 'Rejected' : 'Unknown'
                }</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminMemo">Admin Memo</Label>
                <Textarea
                  id="adminMemo"
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  placeholder="Enter admin memo"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMemoModalOpen(false)}>Cancel</Button>
            <Button onClick={saveMemo}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상세 정보 모달 */}
      <Dialog open={isViewInfoModalOpen} onOpenChange={setIsViewInfoModalOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Request Info</h3>
                <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                  <p><span className="font-semibold">Request ID:</span> {selectedRequest.id}</p>
                  <p><span className="font-semibold">Applicant:</span> {selectedRequest.displayName} (@{selectedRequest.username})</p>
                  <p><span className="font-semibold">Role:</span> {getUserRoleText(selectedRequest.userRole)}</p>
                  <p><span className="font-semibold">Requested Amount:</span> {formatNumber(selectedRequest.amount)} P</p>
                  <p><span className="font-semibold">Requested At:</span> {new Date(selectedRequest.requestedAt).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Status:</span> {
                    selectedRequest.status === 'PENDING' ? 'Pending' :
                    selectedRequest.status === 'APPROVED' ? 'Approved' :
                    selectedRequest.status === 'REJECTED' ? 'Rejected' : 'Unknown'
                  }</p>
                  {selectedRequest.processedAt && (
                    <p><span className="font-semibold">Processed At:</span> {new Date(selectedRequest.processedAt).toLocaleDateString()}</p>
                  )}
                  {selectedRequest.reason && (
                    <p><span className="font-semibold">Reason:</span> {selectedRequest.reason}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Bank Account Info</h3>
                <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                  <p><span className="font-semibold">Account Holder:</span> {selectedRequest.bankInfo.accountHolder}</p>
                  <p><span className="font-semibold">Country:</span> {
                    selectedRequest.bankInfo.country === 'KOREAN' ? 'South Korea' :
                    selectedRequest.bankInfo.country === 'ENGLISH' ? 'United States' :
                    selectedRequest.bankInfo.country === 'CHINESE' ? 'China' :
                    selectedRequest.bankInfo.country === 'JAPANESE' ? 'Japan' :
                    selectedRequest.bankInfo.country === 'THAI' ? 'Thailand' :
                    selectedRequest.bankInfo.country === 'SPANISH' ? 'Spain' :
                    selectedRequest.bankInfo.country === 'INDONESIAN' ? 'Indonesia' :
                    selectedRequest.bankInfo.country === 'VIETNAMESE' ? 'Vietnam' :
                    selectedRequest.bankInfo.country
                  }</p>
                  <p><span className="font-semibold">Bank Name:</span> {selectedRequest.bankInfo.bankName}</p>
                  <p><span className="font-semibold">Account Number:</span> {selectedRequest.bankInfo.accountNumber}</p>
                  {selectedRequest.bankInfo.swiftCode && (
                    <p><span className="font-semibold">SWIFT Code:</span> {selectedRequest.bankInfo.swiftCode}</p>
                  )}
                  {selectedRequest.bankInfo.address && (
                    <p><span className="font-semibold">Address:</span> {selectedRequest.bankInfo.address}</p>
                  )}
                  {selectedRequest.bankInfo.phoneNumber && (
                    <p><span className="font-semibold">Phone Number:</span> {selectedRequest.bankInfo.phoneNumber}</p>
                  )}
                  {selectedRequest.bankInfo.paypalInfo && (
                    <p><span className="font-semibold">PayPal Info:</span> {selectedRequest.bankInfo.paypalInfo}</p>
                  )}
                </div>
              </div>

              {selectedRequest.memo && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Admin Memo</h3>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p>{selectedRequest.memo}</p>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'APPROVED' && selectedRequest.paymentAmount && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Payment Details</h3>
                  <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                    <p><span className="font-semibold">Payment Amount:</span> {formatNumber(selectedRequest.paymentAmount)}</p>
                    {selectedRequest.exchangeRate && (
                      <p><span className="font-semibold">Exchange Rate:</span> {selectedRequest.exchangeRate}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewInfoModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
