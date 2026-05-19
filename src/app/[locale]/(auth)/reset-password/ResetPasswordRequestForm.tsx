"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { logActivity } from "@/lib/activity-logger/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@/i18n/routing";
import LoadingButton from "@/components/LoadingButton";
import { useTranslations } from "next-intl";
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
  const tAuth = useTranslations("Auth");

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
            {tAuth("resetLinkSent")}
          </p>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder={tAuth("emailToReset")} type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoadingButton loading={isPending} type="submit" className="w-full">
          {tAuth("getResetLink")}
        </LoadingButton>

        <div className="text-gray-500 text-xs text-center">
          {tAuth("alreadyHaveAccount")} {" "}
          <Link className="text-white hover:underline" href="/login">
            {tAuth("login")}
          </Link>
        </div>
      </form>
    </Form>
  );
}
