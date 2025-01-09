"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setError(undefined);

    startTransition(async () => {
      const { error } = await resetPassword(token, values);
      if (error) setError(error);
    });
  }

  return (
    <div className="w-full h-screen flex flex-col justify-center justify-center">
      <div className="flex-none h-[12%] md:h-[15%] flex items-center justify-center text-2xl">
        새 비밀번호 설정
      </div>
      <div className="mt-2 w-[70%] h-[2px] bg-muted mx-auto md:w-[80%]" />
      <div className="space-y-2 md:space-y-5 flex-1 flex flex-col justify-center">
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
    </div>
  );
}