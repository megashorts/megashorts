"use server";

import prisma from "@/lib/prisma";
import { resetPasswordRequestSchema, resetPasswordSchema } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { sendMail, EmailTemplate } from "@/lib/email";

// 랜덤 토큰 생성 함수
function generateToken(length: number): string {
  return randomBytes(length).toString('hex');
}

// 비밀번호 재설정 요청
export async function requestPasswordReset(
  email: string
): Promise<{ error?: string }> {
  try {
    const { email: validatedEmail } = resetPasswordRequestSchema.parse({ email });

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: validatedEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      return {
        error: "등록되지 않은 이메일입니다",
      };
    }

    // 구글 로그인 사용자 체크
    if (user.googleId) {
      return {
        error: "구글 계정으로 로그인한 사용자는 비밀번호 재설정이 불가능합니다. 구글 로그인을 이용해주세요.",
      };
    }

    // 네이버 로그인 사용자 체크
    if (user.naverId) {
      return {
        error: "네이버 계정으로 로그인한 사용자는 비밀번호 재설정이 불가능합니다. 네이버 로그인을 이용해주세요.",
      };
    }

    // 카카오 로그인 사용자 체크
    if (user.kakaoId) {
      return {
        error: "카카오 계정으로 로그인한 사용자는 비밀번호 재설정이 불가능합니다. 카카오 로그인을 이용해주세요.",
      };
    }

    // 32바이트(64자 hex 문자열) 토큰 생성
    const token = generateToken(32);
    
    // 토큰 해시화
    const token_hash = createHash("sha256").update(token).digest("hex");
    
    // 만료 시간 설정 (1시간)
    const expires_at = new Date(Date.now() + 1000 * 60 * 60);

    // 기존 토큰 삭제 후 새 토큰 저장
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { user_id: user.id }
      }),
      prisma.passwordResetToken.create({
        data: {
          user_id: user.id,
          token_hash,
          expires_at
        }
      })
    ]);

    // 이메일 발송
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      throw new Error("NEXT_PUBLIC_BASE_URL is not set");
    }
    
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password/${token}`;
    await sendMail(email, EmailTemplate.PasswordReset, { link: resetLink });

    return {};
  } catch (error) {
    console.error(error);
    return {
      error: "비밀번호 재설정 요청 중 오류가 발생했습니다",
    };
  }
}

// 새 비밀번호로 재설정
export async function resetPassword(
  token: string,
  values: { password: string; confirmPassword: string }
): Promise<{ error?: string }> {
  try {
    const { password } = resetPasswordSchema.parse(values);

    // 토큰 해시화
    const token_hash = createHash("sha256").update(token).digest("hex");
    
    // 토큰 검증
    const storedToken = await prisma.passwordResetToken.findUnique({
      where: { token_hash }
    });

    if (!storedToken || storedToken.expires_at < new Date()) {
      return {
        error: "유효하지 않거나 만료된 토큰입니다",
      };
    }

    // 비밀번호 해시화
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      outputLen: 32,
    });

    // 비밀번호 업데이트 및 토큰 삭제
    await prisma.$transaction([
      prisma.user.update({
        where: { id: storedToken.user_id },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.delete({
        where: { token_hash }
      })
    ]);

    return redirect("/login");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: "비밀번호 재설정 중 오류가 발생했습니다",
    };
  }
}

// "use server";

// import prisma from "@/lib/prisma";
// import { resetPasswordRequestSchema, resetPasswordSchema } from "@/lib/validation";
// import { hash } from "@node-rs/argon2";
// import { isRedirectError } from "next/dist/client/components/redirect";
// import { redirect } from "next/navigation";

// export async function requestPasswordReset(
//   email: string
// ): Promise<{ error?: string }> {
//   try {
//     const { email: validatedEmail } = resetPasswordRequestSchema.parse({ email });

//     const user = await prisma.user.findFirst({
//       where: {
//         email: {
//           equals: validatedEmail,
//           mode: "insensitive",
//         },
//       },
//     });

//     if (!user) {
//       return {
//         error: "등록되지 않은 이메일입니다",
//       };
//     }

//     // 구글 로그인 사용자 체크 추가
//     if (user.googleId) {
//         return {
//         error: "구글 계정으로 로그인한 사용자는 비밀번호 재설정이 불가능합니다. 구글 로그인을 이용해주세요.",
//         };
//     }

//     // TODO: 이메일 발송 로직 구현
//     // 실제 이메일 발송 로직은 기존 코드를 그대로 사용

//     return {};
//   } catch (error) {
//     console.error(error);
//     return {
//       error: "비밀번호 재설정 요청 중 오류가 발생했습니다",
//     };
//   }
// }

// export async function resetPassword(
//   token: string,
//   values: { password: string; confirmPassword: string }
// ): Promise<{ error?: string }> {
//   try {
//     const { password } = resetPasswordSchema.parse(values);

//     const passwordHash = await hash(password);

//     // TODO: 토큰 검증 및 비밀번호 업데이트 로직
//     // 실제 토큰 검증 및 비밀번호 업데이트 로직은 기존 코드를 그대로 사용

//     return redirect("/login");
//   } catch (error) {
//     if (isRedirectError(error)) throw error;
//     console.error(error);
//     return {
//       error: "비밀번호 재설정 중 오류가 발생했습니다",
//     };
//   }
// }