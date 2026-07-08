import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import {
  generateEmailOtp,
  getResendFromAddress,
  requireResendApiKey,
} from "./lib/resendOtp";

export const ResendOTPPasswordReset = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return generateEmailOtp(6);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const apiKey = requireResendApiKey(provider.apiKey);
    const resend = new ResendAPI(apiKey);
    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [email],
      subject: "Reset your Hel Calafkaaga password",
      text: `Your Hel Calafkaaga password reset code is: ${token}\n\nThis 6-digit code expires soon. If you did not request a reset, you can ignore this email.`,
    });

    if (error) {
      console.error("Resend password reset error:", error);
      throw new Error("Could not send reset email");
    }
  },
});
