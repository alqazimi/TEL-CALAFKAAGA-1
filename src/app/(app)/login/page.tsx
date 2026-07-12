"use client";

import { isApiProvider } from "@/data/provider";
import ApiLoginForm from "./api-login-form";
import ConvexLoginForm from "./login-form.convex";

export default function LoginPage() {
  if (isApiProvider()) return <ApiLoginForm />;
  return <ConvexLoginForm />;
}
