"use client";

import { isApiProvider } from "@/data/provider";
import ApiRegisterForm from "./api-register-form";
import ConvexRegisterForm from "./register-form.convex";

export default function RegisterPage() {
  if (isApiProvider()) return <ApiRegisterForm />;
  return <ConvexRegisterForm />;
}
