import { z } from "zod";
import { Language, CategoryType, PostStatus } from "@prisma/client";

const requiredString = z.string().trim().min(1, "Required");

// form input rule setting
export const signUpSchema = z.object({
  email: requiredString.email("Invalid email address"),
  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Only letters, numbers, - and _ allowed",
  ),
  password: requiredString.min(8, "Must be at least 8 characters"),
  confirmPassword : requiredString.min(8, "Must be at least 8 characters"),
  referredBy : z.string().optional(),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  title: z.string().optional().default("Untitled Post"),
  content: requiredString,
  thumbnailId: z.string().url("Invalid URL").optional(),
  categoryIds: z.array(z.nativeEnum(CategoryType)).optional().default([]),
  status: z.nativeEnum(PostStatus).optional().default("PUBLISHED"),
});

export const updateUserProfileSchema = z.object({
  displayName: requiredString,
  bio: z.string().max(1000, "Must be at most 1000 characters"),
  myLanguage: z.nativeEnum(Language),
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

export const createCommentSchema = z.object({
  content: requiredString,
});


// for post making sysytem by self
export const postSchema = z.object({
  id: z.string().optional(),  // 포스트 ID 추가 (수정 시 사용)
  title: z.string().min(1, "제목을 입력해주세요"),
  titleI18n: z.record(z.string()).optional(),
  titleOriginal: z.string().optional(),
  content: z.string().min(1, "내용을 입력해주세요"),
  contentI18n: z.record(z.string()).optional(),
  thumbnailId: z.string().url().optional(),
  ageLimit: z.number().int().min(0).max(18).default(15),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  postLanguage: z.nativeEnum(Language),
  featured: z.boolean().default(false),
  priority: z.number().int().min(1).max(10).default(5),
  categories: z.array(z.nativeEnum(CategoryType)).min(1, "카테고리를 선택해주세요"),
  videos: z.array(z.object({
    id: z.string().optional(),  // 비디오 ID도 추가 (수정 시 사용)
    sequence: z.number().int().min(1),
    isPremium: z.boolean().default(false),
    filename: z.string(),
    subtitle: z.array(z.nativeEnum(Language)).optional().default([]) 
  })).min(1, "최소 1개의 비디오가 필요합니다")  // optional 제거하고 min 조건 추가
});

export type PostFormData = z.infer<typeof postSchema>;

// export type PostValues = z.infer<typeof postSchema>;

export const videoSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 100 * 1024 * 1024, "파일 크기는 100MB를 초과할 수 없습니다")
    .refine(
      file => ["video/mp4", "video/webm"].includes(file.type),
      "MP4 또는 WebM 형식만 지원합니다"
    ),
  language: z.nativeEnum(Language),
  isPremium: z.boolean().default(false)
});

export const subtitleSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 1 * 1024 * 1024, "자막 파일은 1MB를 초과할 수 없습니다")
    .refine(
      file => file.name.endsWith(".vtt") || file.name.endsWith(".srt"),
      "VTT 또는 SRT 형식만 지원합니다"
    ),
  language: z.nativeEnum(Language),
  videoId: z.string()
});

// 비밀번호 재설정 요청을 위한 스키마
export const resetPasswordRequestSchema = z.object({
  email: requiredString.email("유효하지 않은 이메일 주소입니다"),
});

export type ResetPasswordRequestValues = z.infer<typeof resetPasswordRequestSchema>;

// 새 비밀번호 설정을 위한 스키마
export const resetPasswordSchema = z.object({
  password: requiredString.min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  confirmPassword: requiredString.min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;


export const userPasswordChangeSchema = z.object({
  currentPassword: requiredString.min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  newPassword: requiredString.min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  confirmNewPassword: requiredString.min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "새 비밀번호가 일치하지 않습니다",
  path: ["confirmNewPassword"],
});

export type UserPasswordChangeValues = z.infer<typeof userPasswordChangeSchema>;