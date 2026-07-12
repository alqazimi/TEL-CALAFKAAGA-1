"use client";

import { isApiProvider } from "@/data/provider";
import ApiRegisterDetailsForm from "./api-register-details-form";
import ConvexRegisterDetailsForm from "./register-details-form.convex";

export default function RegisterDetailsPage() {
  if (isApiProvider()) return <ApiRegisterDetailsForm />;
  return <ConvexRegisterDetailsForm />;
}
