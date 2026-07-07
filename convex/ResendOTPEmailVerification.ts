import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import {
  generateEmailOtp,
  getResendFromAddress,
  requireResendApiKey,
} from "./lib/resendOtp";

export const ResendOTPEmailVerification = Resend({
  id: "resend-otp-verify",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return generateEmailOtp();
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const apiKey = requireResendApiKey(provider.apiKey);
    const resend = new ResendAPI(apiKey);
    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [email],
      subject: "Verify your Calaf email",
      text: `Your Calaf verification code is: ${token}\n\nEnter this code to finish creating your account.`,
    });

    if (error) {
      console.error("Resend verification error:", error);
      throw new Error("Could not send verification email");
    }
  },
});
