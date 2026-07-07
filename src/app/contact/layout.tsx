import type { Metadata } from "next";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${APP_NAME} — email ${SUPPORT_EMAIL} or WhatsApp for registration help and personal support.`,
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
