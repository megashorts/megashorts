"use client";

import { InquiryStatus, InquiryType } from "@prisma/client";
import { format } from "date-fns";
import { CheckCircle, Link2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { InquiryMessage } from "./types";
import InquiryTypeIcon from "./InquiryTypeIcon";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface InquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: InquiryType;
  messages: InquiryMessage[];
  status: InquiryStatus;
  onStatusChange: (status: InquiryStatus) => void;
  currentUser?: { displayName: string };
  onSubmit: (content: string, respondedBy?: string) => void;
  isAdmin?: boolean;
  postId?: string;
}

export default function InquiryDialog({
  isOpen,
  onClose,
  title,
  type,
  messages: initialMessages,
  status,
  onStatusChange,
  onSubmit,
  currentUser,
  isAdmin = true,
  postId,
}: InquiryDialogProps) {
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState(initialMessages);

  useEffect(() => {
    setLocalMessages(initialMessages);
  }, [initialMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, localMessages]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    const newMessage = {
      content,
      isAdmin: false,
      createdAt: new Date(),
    };
    
    setLocalMessages(prev => [...prev, newMessage]);
    setContent("");
    await onSubmit(content, currentUser?.displayName);  // displayName 추가
    setTimeout(scrollToBottom, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[350px] sm:max-w-[700px] h-[80vh] flex flex-col p-3 rounded-lg">
        <DialogHeader className="flex-none">
          <div className="flex items-center gap-2">
            <InquiryTypeIcon type={type} className="h-5 w-5" />
            <DialogTitle className="text-base">{title}</DialogTitle>
            {postId && (
              <Link href={`/posts/${postId}`} className="hover:text-primary">
                <Link2 className="h-4 w-4" />
              </Link>
            )}
            <span className={`led-indicator ${
              status === 'PENDING' ? 'led-yellow' :
              status === 'IN_PROGRESS' ? 'led-blue' :
              'led-green'
            }`}></span>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-muted/30 rounded-md my-2">
          {localMessages.map((message, index) => {
            const isAdminMessage = !!message.respondedBy;
            
            return (
              <div
                key={index}
                className={`flex flex-col ${
                  isAdmin ? 
                    (isAdminMessage ? "items-start" : "items-end") :
                    (isAdminMessage ? "items-end" : "items-start")
                }`}
              >
                <div
                  className={`max-w-[85%] p-2 rounded-lg shadow-xs ${
                    isAdmin ?
                      (isAdminMessage ? "bg-black text-white" : "bg-white text-black") :
                      (isAdminMessage ? "bg-white text-black" : "bg-black text-white")
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div className="mt-1 text-xs opacity-70 flex items-center gap-2">
                    {message.respondedBy && (
                      <>
                        <span>{message.respondedBy}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{format(message.createdAt, "yyyy.MM.dd HH:mm")}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className="messages-end" />
        </div>
        <div className="flex-none flex gap-2">
          <Textarea
            placeholder="내용을 작성하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 resize-none text-sm"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button size="icon" className="h-8 w-8" onClick={handleSubmit}>
              <Send className="h-3 w-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="h-8 w-8" variant="outline">
                  <CheckCircle className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[120px]">
                {isAdmin ? (
                  <>
                    <DropdownMenuItem 
                      onClick={() => {
                        onStatusChange("PENDING");
                        onClose();
                      }}
                      className="gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      대기중
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        onStatusChange("IN_PROGRESS");
                        onClose();
                      }}
                      className="gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      진행중
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        onStatusChange("CLOSED");
                        onClose();
                      }}
                      className="gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      완료
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      onStatusChange("CLOSED");
                      onClose();
                    }}
                    className="gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    완료
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}