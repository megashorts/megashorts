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
import { loginSchema, LoginValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { login } from "./actions";
import { logActivity } from "@/lib/activity-logger/client";
import { locationManager } from "@/lib/activity-logger/location-manager";
import { useToast } from "@/components/ui/use-toast";

export default function LoginForm() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [loginAttempt, setLoginAttempt] = useState<{
    identifier: string;
  } | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setError(undefined);

    // 로그인 시도 정보 저장
    setLoginAttempt({
      identifier: values.username
    });

    startTransition(async () => {
      try {
        const result = await login(values);
        
        if (result.error) {
          setError(result.error);
          // 로그인 실패 로그
          logActivity({
            type: 'auth',
            event: 'login_failure',
            username: loginAttempt?.identifier || values.username,
            details: {
              action: 'login',
              result: 'failure',
              error: result.error
            }
          });
        }
      } catch (error) {
        // NEXT_REDIRECT는 정상적인 리다이렉션이므로 성공 로그 저장
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
          // 로그인 성공 로그
          logActivity({
            type: 'auth',
            event: 'login_success',
            username: loginAttempt?.identifier || values.username,
            details: {
              action: 'login',
              result: 'success'
            }
          });
        } else {
          console.error('Login error:', error);
          setError("Something went wrong. Please try again.");
        }
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {error && <p className="text-center text-destructive">{error}</p>}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              {/* <FormLabel>Username or Email</FormLabel> */}
              <FormControl>
                <Input placeholder="Username or Email" {...field} />
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
              {/* <FormLabel>Password</FormLabel> */}
              <FormControl>
                <PasswordInput placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton loading={isPending} type="submit" className="w-full">
          Log in
        </LoadingButton>
      </form>
    </Form>
  );
}
