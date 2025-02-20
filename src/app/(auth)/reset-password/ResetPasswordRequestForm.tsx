"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { logActivity } from "@/lib/activity-logger/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import LoadingButton from "@/components/LoadingButton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPasswordRequestSchema, ResetPasswordRequestValues } from "@/lib/validation";
import { requestPasswordReset } from "./actions";

export default function ResetPasswordRequestForm() {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResetPasswordRequestValues>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ResetPasswordRequestValues) {
    setError(undefined);
    setSuccess(false);

    const baseInfo = {
      type: 'auth',
      method: 'PASSWORD_RESET',
      details: {
        action: 'request_reset',
        email: values.email
      }
    };

    startTransition(async () => {
      const { error } = await requestPasswordReset(values.email);
      if (error) {
        logActivity({
          ...baseInfo,
          event: 'request_reset_failure',
          details: {
            ...baseInfo.details,
            result: 'failure',
            error
          }
        });
        setError(error);
      } else {
        logActivity({
          ...baseInfo,
          event: 'request_reset_success',
          details: {
            ...baseInfo.details,
            result: 'success'
          }
        });
        setSuccess(true);
        form.reset();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && <p className="text-center text-destructive">{error}</p>}
        {success && (
          <p className="text-sm text-center text-green-500">
            비밀번호 재설정 링크가 전송되었습니다.
          </p>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="가입한 이메일을 입력하세요" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoadingButton loading={isPending} type="submit" className="w-full">
          재설정 링크 받기
        </LoadingButton>

        <div className="text-gray-500 text-xs text-center">
          계정이 있으신가요?{" "}
          <Link className="text-white hover:underline" href="/login">
            로그인
          </Link>
        </div>
      </form>
    </Form>
  );
}
