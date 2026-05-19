"use client"; 

import LoadingButton from "@/components/LoadingButton";
import { PasswordInput } from "@/components/PasswordInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { signUp } from "./actions";
import { toast } from "@/components/ui/use-toast";
import { logActivity } from "@/lib/activity-logger/client";
import { useTranslations } from "next-intl";

export default function SignUpForm() {
  const addcoinUser = 2;
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const tAuth = useTranslations("Auth");

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      referredBy: "",
    },
  });

  async function onSubmit(values: SignUpValues) {
    setError(undefined);

    // 시도 정보 저장 (로그로 기록하지 않음)
    const baseInfo = {
      type: 'auth',
      username: values.username,
      details: {
        action: 'signup',
        target: values.referredBy
      }
    };

    startTransition(async () => {
      const { error } = await signUp(values);
      if (error) {
        setError(error);
        // 실패 로그
        logActivity({
          ...baseInfo,
          event: 'signup_failure',
          details: {
            ...baseInfo.details,
            result: 'failure',
            error: error
          }
        });
      } else {
        // 성공 시 로그 기록 후 리다이렉트
        await logActivity({
          ...baseInfo,
          event: 'signup_success',
          details: {
            ...baseInfo.details,
            result: 'success'
          }
        });

        toast({
          description: `추천가입 선물 ${addcoinUser}MS코인이 지급되었습니다`,
        });

        // 로그 기록 완료 후 리다이렉트
        window.location.href = "/";
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 text-xs">
        {error && <p className="text-xs text-center text-destructive pt-4">{error}</p>}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder={tAuth("emailPlaceholder")} type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder={tAuth("usernamePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PasswordInput placeholder={tAuth("passwordPlaceholder")} {...field} />
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
                <PasswordInput placeholder={tAuth("confirmPasswordPlaceholder")} {...field} />
              </FormControl>
              {form.watch("password") !== field.value && (
                <p className="text-destructive">{tAuth("passwordsDoNotMatch")}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referredBy"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder={tAuth("referredByPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton loading={isPending} type="submit" className="w-full">
          {tAuth("signupButton")}
        </LoadingButton>
      </form>
    </Form>
  );
}
