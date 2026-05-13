"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { logActivity } from "@/lib/activity-logger/client";
import { zodResolver } from "@hookform/resolvers/zod";
import LoadingButton from "@/components/LoadingButton";
import { PasswordInput } from "@/components/PasswordInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { resetPasswordSchema, ResetPasswordValues } from "@/lib/validation";
import { resetPassword } from "../actions";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setError(undefined);

    const baseInfo = {
      type: 'auth',
      method: 'PASSWORD_RESET',
      details: {
        action: 'reset_password'
      }
    };

    startTransition(async () => {
      const { error, success } = await resetPassword(token, values);
      if (error) {
        logActivity({
          ...baseInfo,
          event: 'reset_password_failure',
          details: {
            ...baseInfo.details,
            result: 'failure',
            error
          }
        });
        setError(error);
      } else if (success) {
        logActivity({
          ...baseInfo,
          event: 'reset_password_success',
          details: {
            ...baseInfo.details,
            result: 'success'
          }
        });
        router.push('/login');
      }
    });
  }

  return (
    <div>
    <div className="text-2xl text-center mb-6">
      새 비밀번호 설정
    </div>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && <p className="text-center text-destructive">{error}</p>}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PasswordInput placeholder="새 비밀번호" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PasswordInput placeholder="새 비밀번호 확인" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoadingButton loading={isPending} type="submit" className="w-full">
          비밀번호 변경
        </LoadingButton>
      </form>
    </Form>
  </div>
  );
}
