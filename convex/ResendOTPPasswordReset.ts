import { Email } from "@convex-dev/auth/providers/Email";
import {
  generateEmailOtp,
  getResendFromAddress,
  requireResendApiKey,
  sendResendEmail,
} from "./lib/resendOtp";
import {
  buildBrandedEmailHtml,
  buildBrandedEmailText,
} from "./lib/emailTemplate";

/** Reset codes stay valid for 15 minutes. */
const RESET_CODE_MAX_AGE_S = 15 * 60;

export const ResendOTPPasswordReset = Email({
  id: "resend-otp",
  name: "Resend OTP",
  from: getResendFromAddress(),
  maxAge: RESET_CODE_MAX_AGE_S,
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return generateEmailOtp(6);
  },
  async sendVerificationRequest({
    identifier: email,
    provider,
    token,
  }: {
    identifier: string;
    provider: { apiKey?: string };
    token: string;
  }) {
    const apiKey = requireResendApiKey(provider.apiKey ?? process.env.AUTH_RESEND_KEY);
    const emailArgs = {
      title: "Reset your password",
      body: "Use this code to reset your Hel Calafkaaga password. It expires in 15 minutes.",
      preheader: `Your password reset code is ${token}`,
      code: token,
      footerNote: "If you did not request a reset, you can ignore this email.",
    };

    await sendResendEmail({
      apiKey,
      to: email.trim().toLowerCase(),
      subject: "Reset your Hel Calafkaaga password",
      text: buildBrandedEmailText(emailArgs),
      html: buildBrandedEmailHtml(emailArgs),
    });
  },
});
