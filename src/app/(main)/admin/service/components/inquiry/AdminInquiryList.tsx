"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InquiryStatus } from "@prisma/client";
import { format } from "date-fns";
import { Search, AlertCircle, Clock, Calendar as CalendarIcon, UserCircle2, MessageSquare } from "lucide-react";
import "./styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import kyInstance from "@/lib/ky";
import { DateRange, InquiryData, InquiryFilter, InquiryMessage, InquiryResponse, InquiryUpdateResponse } from "./types";
import InquiryDialog from "./InquiryDialog";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import StatusLedButton from "./StatusLedButton";
import DateFilterButton from "./DateFilterButton";
import InquiryTypeIcon from "./InquiryTypeIcon";
import { useSession } from "@/components/SessionProvider";

const ITEMS_PER_PAGE = 10;

interface AdminMessage {
  content: string;
  createdAt: string;
  respondedBy: string | null;
  isSystem?: boolean;
}

export default function AdminInquiryList({ isAdmin = true }: { isAdmin?: boolean }) {
  const [filter, setFilter] = useState<InquiryFilter & { dateRange?: DateRange }>({});
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [username, setUsername] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryData | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { user } = useSession();
  const currentUser = user?.displayName ? { displayName: user.displayName } : undefined;

  const queryKey = ["admin-inquiries", filter, page];

  const {
    data,
    isLoading,
  } = useQuery<InquiryResponse>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filter.status) searchParams.set("status", filter.status);
      
      // 날짜 범위 전달 방식 수정
      if (filter.dateRange) {
        searchParams.set("startDate", filter.dateRange.start.toISOString());
        searchParams.set("endDate", filter.dateRange.end.toISOString());
      } else if (filter.date) {
        // 기존 date 필드 호환성 유지
        searchParams.set("date", filter.date.toISOString());
      }
      
      if (filter.username) searchParams.set("username", filter.username);
      searchParams.set("page", page.toString());
      searchParams.set("limit", ITEMS_PER_PAGE.toString());
  
      return kyInstance
        .get("/api/admin/inquiry", {
          searchParams,
        })
        .json();
    },
  });

  const updateCache = (updatedInquiry: InquiryData) => {
    // Update list cache
    queryClient.setQueryData<InquiryResponse>(queryKey, (old) => {
      if (!old) return old;

      const newInquiries = old.inquiries.map(inquiry => 
        inquiry.id === updatedInquiry.id ? {
          ...updatedInquiry,
          user: inquiry.user,
          // respondedBy: undefined,
        } : inquiry
      );

      return {
        ...old,
        inquiries: newInquiries,
      };
    });

    // Update selected inquiry
    if (selectedInquiry?.id === updatedInquiry.id) {
      setSelectedInquiry({
        ...updatedInquiry,
        user: selectedInquiry.user,
        // respondedBy: undefined,
      });
    }
  };

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: InquiryStatus;
    }): Promise<InquiryUpdateResponse> => {
      const response = await kyInstance
        .patch(`/api/admin/inquiry/${id}/status`, { 
          json: { 
            status,
            // status가 CLOSED일 때만 respondedBy 추가
            ...(status === "CLOSED" && currentUser?.displayName ? {
              respondedBy: currentUser.displayName
            } : {})
          } 
        })
        .json<InquiryUpdateResponse>();
      return response;
    },
    onSuccess: (response) => {
      updateCache(response);
    },
  });

  const { mutate: addResponse } = useMutation({
    mutationFn: async ({ 
      id, 
      content,
      respondedBy 
    }: { 
      id: string; 
      content: string;
      respondedBy?: string;
    }): Promise<InquiryUpdateResponse> => {
      const response = await kyInstance
        .post(`/api/admin/inquiry/${id}/response`, { 
          json: { 
            content,
            respondedBy  // handleSubmit에서 전달받은 respondedBy 사용
          } 
        })
        .json<InquiryUpdateResponse>();
      return response;
    },
    onSuccess: (response) => {
      updateCache(response);
    },
  });

  const handleStatusChange = (status: InquiryStatus | undefined) => {
    setFilter((prev) => ({
      ...prev,
      status,
    }));
    setPage(1);
  };

  const handleDateChange = (dateRange: DateRange | undefined) => {
    if (!dateRange) {
      // dateRange가 undefined이면 날짜 필터 제거
      setDate(undefined);
      setFilter(prev => {
        const { dateRange, date, ...rest } = prev;  // dateRange와 date 필드 제거
        return rest;
      });
      setPage(1);
      return;
    }
    
    setDate(dateRange.end);  // 표시용으로는 마지막 날짜 사용
    setFilter(prev => ({
      ...prev,
      dateRange
    }));
    
    setPage(1);
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter((prev) => ({
      ...prev,
      username: username || undefined,
    }));
    setPage(1);
  };

  const getMessages = (inquiry: InquiryData): InquiryMessage[] => {
    const messages: InquiryMessage[] = [
      {
        content: inquiry.content,
        isAdmin: false,
        createdAt: inquiry.createdAt,
      },
    ];

    if (inquiry.adminResponse) {
      try {
        const adminMessages: AdminMessage[] = JSON.parse(inquiry.adminResponse);
        messages.push(
          ...adminMessages.map(msg => ({
            content: msg.content,
            isAdmin: true,
            createdAt: new Date(msg.createdAt),
            respondedBy: msg.respondedBy ?? undefined,
            isSystem: msg.isSystem,
          }))
        );
      } catch (e) {
        // Fallback for old format
        if (inquiry.adminResponse) {
          messages.push({
            content: inquiry.adminResponse,
            isAdmin: true,
            createdAt: inquiry.respondedAt || inquiry.createdAt,
            respondedBy: undefined,
          });
        }
      }
    }

    return messages;
  };

  const handleSubmit = async (content: string) => {  // respondedBy 파라미터 제거
    if (!selectedInquiry || !content.trim()) return;
    if (!user?.displayName) {
      console.error('User displayName is required');
      return;
    }
    await addResponse({ 
      id: selectedInquiry.id, 
      content,
      respondedBy: user.displayName  // 현재 로그인한 사용자의 displayName 사용
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-4 items-center icon-group justify-between">
        <div className="flex gap-4 items-center">
          <StatusLedButton
            status={filter.status}
            onChange={handleStatusChange}
          />
          <DateFilterButton
            date={date}
            onSelect={handleDateChange}
          />
        </div>
        <form onSubmit={handleUsernameSubmit} className="flex gap-1">
          <Input
            placeholder="사용자 검색"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-[100px] h-8 text-sm text-center"
          />
          <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 sm:ml-2">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="rounded-md border">
        <Table className="inquiry-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px] px-3">
              <AlertCircle className="w-4 h-4" />
            </TableHead>
            <TableHead className="w-auto">
              <MessageSquare className="w-4 h-4" />
            </TableHead>
            <TableHead className="w-[100px]">
              <div className="flex justify-end">
                <UserCircle2 className="w-4 h-4" />
              </div>
            </TableHead>
            <TableHead className="w-[10px]">
              <div className="flex justify-end">
                <Clock className="w-4 h-4" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
          <TableBody>
            {!data?.inquiries || data.inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  문의 내역이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              data.inquiries.map((inquiry) => (
                <TableRow
                  key={inquiry.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedInquiry(inquiry);
                    // queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
                  }}
                >
                <TableCell className="pl-3">
                  <InquiryTypeIcon type={inquiry.type} className="table-cell-icon" />
                </TableCell>
                <TableCell>
                  <div className="text-sm truncate pl-0 ">
                    {inquiry.postId ? (
                      <>
                        {inquiry.postTitle} / {inquiry.title}
                      </>
                    ) : (
                      inquiry.title
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-muted-foreground truncate text-end">
                    {inquiry.user.displayName}
                  </div>
                </TableCell>
                <TableCell className="pr-3 text-end">
                  <div className="inline-flex items-center justify-center">
                    <span className={`led-indicator ${
                      inquiry.status === 'PENDING' ? 'led-yellow' :
                      inquiry.status === 'IN_PROGRESS' ? 'led-blue' :
                      'led-green'
                    }`}></span>
                  </div>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.inquiries && data.inquiries.length > 0 && data.totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(pageNum)}
              className="w-8 h-8 p-0"
            >
              {pageNum}
            </Button>
          ))}
        </div>
      )}

      {selectedInquiry && (
        <InquiryDialog
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          title={selectedInquiry.title}
          type={selectedInquiry.type}
          messages={getMessages(selectedInquiry)}
          status={selectedInquiry.status}
          onStatusChange={(status) => {
            updateStatus({ 
              id: selectedInquiry.id, 
              status,
            });
          }}
          onSubmit={handleSubmit}
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
