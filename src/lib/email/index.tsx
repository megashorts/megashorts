import "server-only";

import { EmailVerificationTemplate } from "./templates/email-verification";
import { ResetPasswordTemplate } from "./templates/reset-password";
import { render } from "@react-email/render";
import { getEmailSender } from "../../lib/constants";
import { createTransport, type TransportOptions } from "nodemailer";
import type { ComponentProps } from "react";

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

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

const transporter = createTransport(smtpConfig as TransportOptions);

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
    const info = await transporter.sendMail({
      from: getEmailSender(),
      to,
      subject,
      html: body,
    });

    console.log('Email sent successfully:', info);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// export const sendMail = async <T extends EmailTemplate>(
//   to: string,
//   template: T,
//   props: PropsMap[NoInfer<T>],
// ) => {
//   if (env.MOCK_SEND_EMAIL) {
//     logger.info("📨 Email sent to:", to, "with template:", template, "and props:", props);
//     return;
//   }

//   const { subject, body } = getEmailTemplate(template, props);

//   return transporter.sendMail({ from: getEmailSender(), to, subject, html: body });
// };