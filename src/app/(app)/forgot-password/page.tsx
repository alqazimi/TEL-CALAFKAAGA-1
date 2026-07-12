"use client";

import { isApiProvider } from "@/data/provider";
import ApiForgotPasswordForm from "./api-forgot-password-form";
import ConvexForgotPasswordForm from "./forgot-password-form.convex";

export default function ForgotPasswordPage() {
  if (isApiProvider()) return <ApiForgotPasswordForm />;
  return <ConvexForgotPasswordForm />;
}
