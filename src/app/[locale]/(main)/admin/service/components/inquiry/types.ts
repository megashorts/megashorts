import { InquiryStatus, InquiryType } from "@prisma/client";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface InquiryFilter {
  status?: InquiryStatus;
  date?: Date;
  username?: string;
}

export interface InquiryMessage {
  content: string;
  isAdmin: boolean;
  createdAt: Date;
  respondedBy?: string;
  isSystem?: boolean;
}

export interface InquiryData {
  id: string;
  title: string;
  content: string;
  type: InquiryType;
  status: InquiryStatus;
  createdAt: Date;
  respondedAt?: Date;
  adminResponse?: string;
  respondedBy?: string;
  postId?: string;
  postTitle?: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
  messages?: InquiryMessage[];
}

export interface InquiryResponse {
  inquiries: InquiryData[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface InquiryUpdateResponse extends InquiryData {
  messages?: InquiryMessage[];
}

export interface SessionResponse {
  user?: {
    name?: string;
    email?: string;
  };
}
