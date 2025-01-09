"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/PasswordInput";
import LoadingButton from "@/components/LoadingButton";
import {
  userPasswordChangeSchema,
  type UserPasswordChangeValues,
} from "@/lib/validation";
import { toast } from "@/components/ui/use-toast";

interface UserPasswordResetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserPasswordReset({
  open,
  onOpenChange,
}: UserPasswordResetProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UserPasswordChangeValues>({
    resolver: zodResolver(userPasswordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function onSubmit(values: UserPasswordChangeValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        description: "비밀번호가 성공적으로 변경되었습니다."
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "비밀번호 변경 실패"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full min-x-[150px] max-w-[80%] md:max-w-[30%] rounded-lg h-auto">
        <DialogHeader>
          <DialogTitle>비밀번호 변경</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput placeholder="현재 비밀번호" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
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
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput placeholder="새 비밀번호 확인" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LoadingButton
              type="submit"
              loading={isLoading}
              className="w-full"
            >
              비밀번호 변경
            </LoadingButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
