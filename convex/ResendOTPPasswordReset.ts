import { Email } from "@convex-dev/auth/providers/Email";
import {
  generateEmailOtp,
  getResendFromAddress,
  requireResendApiKey,
  sendResendEmail,
} from "./lib/resendOtp";

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
    await sendResendEmail({
      apiKey,
      to: email.trim().toLowerCase(),
      subject: "Reset your Hel Calafkaaga password",
      text: `Your Hel Calafkaaga password reset code is: ${token}\n\nThis code expires in 15 minutes. If you did not request a reset, you can ignore this email.`,
    });
  },
});
