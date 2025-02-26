"use client";

import { useState, useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { InquiryStatus } from "@prisma/client";
import { useInView } from "react-intersection-observer";
import { InquiryData, InquiryMessage, InquiryUpdateResponse } from "@/app/(main)/admin/service/components/inquiry/types";
import InquiryDialog from "@/app/(main)/admin/service/components/inquiry/InquiryDialog";
import kyInstance from "@/lib/ky";
import { useSession } from "@/components/SessionProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import InquiryTypeIcon from "@/app/(main)/admin/service/components/inquiry/InquiryTypeIcon";
import "@/app/(main)/admin/service/components/inquiry/styles.css"

interface AdminMessage {
  content: string;
  createdAt: string;
  respondedBy: string | null;
  isSystem?: boolean;
  isAdmin: boolean;
}

interface InfiniteInquiryResponse {
  inquiries: InquiryData[];
  nextCursor: string | null;
}

export default function UserInquiryList() {
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryData | null>(null);
  const { ref, inView } = useInView();
  const { user } = useSession();
  const currentUser = user?.displayName ? { displayName: user.displayName } : undefined;
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<InfiniteInquiryResponse>({
    queryKey: ["user-inquiries", user?.username],
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams();
      if (pageParam) searchParams.set("cursor", pageParam as string);
      
      return kyInstance
        .get(`/api/admin/inquiry`, {
          searchParams,
        })
        .json<InfiniteInquiryResponse>();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user?.username,
  });

  const { mutate: updateStatus } = useMutation<
    InquiryUpdateResponse,
    Error,
    { id: string; status: InquiryStatus }
  >({
    mutationFn: async ({ id, status }) => {
      return kyInstance
        .patch(`/api/admin/inquiry/${id}/status`, {
          json: { status }
        })
        .json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-inquiries", user?.username] });
    },
  });

  const { mutate: addResponse } = useMutation<
    InquiryUpdateResponse,
    Error,
    { id: string; content: string },
    { previousInquiry: InquiryData | null }  // context 타입 추가
  >({
    mutationFn: async ({ id, content }) => {
      return kyInstance
        .post(`/api/admin/inquiry/${id}/response`, {
          json: { 
            content,
            isUserResponse: true
          }
        })
        .json();
    },
    onMutate: async ({ id, content }) => {
      // 이전 데이터 백업
      const previousInquiry = selectedInquiry;

      if (selectedInquiry) {
        // 새 메시지 생성
        const newMessage = {
          content,
          isAdmin: false,
          createdAt: new Date(),
        };

        // 기존 메시지에 새 메시지 추가
        const updatedMessages = getMessages(selectedInquiry);
        updatedMessages.push(newMessage);

        // 선택된 inquiry 업데이트
        const updatedInquiry = {
          ...selectedInquiry,
          adminResponse: JSON.stringify(updatedMessages)
        };

        // 상태 업데이트
        setSelectedInquiry(updatedInquiry);
      }

      return { previousInquiry };
    },
    onError: (err, variables, context) => {
      // 에러 시 이전 상태로 복원
      if (context?.previousInquiry) {
        setSelectedInquiry(context.previousInquiry);
      }
    },
    onSettled: () => {
      // 완료 후 데이터 리프레시
      queryClient.invalidateQueries({ queryKey: ["user-inquiries", user?.username] });
    },
  });

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
            isAdmin: true,  // 관리자 응답은 항상 true
            createdAt: new Date(msg.createdAt),
            respondedBy: msg.respondedBy ?? undefined,
            isSystem: msg.isSystem,
          }))
        );
      } catch (e) {
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

  const handleSubmit = async (content: string) => {
    if (!selectedInquiry || !content.trim()) return;
    await addResponse({ 
      id: selectedInquiry.id, 
      content,
    });
  };

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="grid gap-2">
          {(data as InfiniteData<InfiniteInquiryResponse>)?.pages.map((page) =>
            page.inquiries.map((inquiry: InquiryData) => (
              <div
                key={inquiry.id}
                onClick={() => {
                  setSelectedInquiry(inquiry);
                  queryClient.invalidateQueries({ queryKey: ["user-inquiries"] });
                }}
                className="min-h-[56px] p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
              >
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-2">
                    <InquiryTypeIcon type={inquiry.type} className="h-5 w-5" />
                    <h3 className="text-sm font-medium">{inquiry.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground min-w-[60px] text-right">
                      {inquiry.respondedBy || ''}
                    </span>
                    <span className={`led-indicator ${
                      inquiry.status === 'PENDING' ? 'led-yellow' :
                      inquiry.status === 'IN_PROGRESS' ? 'led-blue' :
                      'led-green'
                    }`}></span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={ref} />

          {/* 더 불러올 항목이 없을 때 메시지 표시 */}
          {!hasNextPage && data && data.pages.length > 0 && data.pages[0].inquiries.length > 0 && (
            <div className="text-center py-2 text-muted-foreground text-sm">
              모든 문의를 불러왔습니다
            </div>
          )}

          {data && data.pages.length > 0 && data.pages[0].inquiries.length === 0 && (
            <div className="text-center py-2 text-muted-foreground text-sm">
              문의 내역이 없습니다
            </div>
          )}

        </div>

        {selectedInquiry && (
          <InquiryDialog
            isOpen={!!selectedInquiry}
            onClose={() => setSelectedInquiry(null)}
            title={selectedInquiry.title}
            type={selectedInquiry.type}
            messages={getMessages(selectedInquiry)}
            status={selectedInquiry.status}
            onStatusChange={(status) => {
              if (status === "CLOSED") {
                updateStatus({ 
                  id: selectedInquiry.id, 
                  status,
                });
              }
            }}
            onSubmit={handleSubmit}
            currentUser={currentUser}
            isAdmin={false}
            postId={selectedInquiry.postId}
          />
        )}
      </div>
    </TooltipProvider>
  );
}