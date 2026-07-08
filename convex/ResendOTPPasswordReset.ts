import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import {
  generateEmailOtp,
  getResendFromAddress,
  requireResendApiKey,
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
    const resend = new ResendAPI(apiKey);
    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [email],
      subject: "Reset your Hel Calafkaaga password",
      text: `Your Hel Calafkaaga password reset code is: ${token}\n\nThis code expires in 15 minutes. If you did not request a reset, you can ignore this email.`,
    });

    if (error) {
      console.error("Resend password reset error:", error);
      throw new Error("Could not send reset email");
    }
  },
});
