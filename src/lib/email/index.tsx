import "server-only";
import { Resend } from 'resend';
import { EmailVerificationTemplate } from "./templates/email-verification";
import { ResetPasswordTemplate } from "./templates/reset-password";
import { render } from "@react-email/render";
import { getEmailSender } from "../../lib/constants";
import type { ComponentProps } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export enum EmailTemplate {
  EmailVerification = "EmailVerification",
  PasswordReset = "PasswordReset",
}

export type PropsMap = {
  [EmailTemplate.EmailVerification]: ComponentProps<typeof EmailVerificationTemplate>;
  [EmailTemplate.PasswordReset]: ComponentProps<typeof ResetPasswordTemplate>;
};

const getEmailTemplate = async <T extends EmailTemplate>(template: T, props: PropsMap[T]) => {
  switch (template) {
    case EmailTemplate.EmailVerification:
      return {
        subject: "Verify your email address",
        body: await render(
          <EmailVerificationTemplate {...(props as PropsMap[EmailTemplate.EmailVerification])} />,
        ),
      };
    case EmailTemplate.PasswordReset:
      return {
        subject: "Reset your password",
        body: await render(
          <ResetPasswordTemplate {...(props as PropsMap[EmailTemplate.PasswordReset])} />,
        ),
      };
    default:
      throw new Error("Invalid email template");
  }
};

export const sendMail = async <T extends EmailTemplate>(
  to: string,
  template: T,
  props: PropsMap[T],
) => {
  if (process.env.MOCK_SEND_EMAIL === 'true') {
    console.log("📨 Email sent to:", to, "with template:", template, "and props:", props);
    return;
  }

  const { subject, body } = await getEmailTemplate(template, props);

  try {
    const data = await resend.emails.send({
      from: getEmailSender(),
      to,
      subject,
      html: body,
    });

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
