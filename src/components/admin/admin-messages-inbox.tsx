"use client";

import { isApiProvider } from "@/data/provider";
import { Id } from "../../../convex/_generated/dataModel";
import { ApiAdminMessagesInbox } from "./admin-messages-inbox.api";
import { ConvexAdminMessagesInbox } from "./admin-messages-inbox.convex";

interface AdminMessagesInboxProps {
  onOpenUser: (profileId: Id<"profiles">) => void;
}

export function AdminMessagesInbox(props: AdminMessagesInboxProps) {
  return isApiProvider() ? (
    <ApiAdminMessagesInbox {...props} />
  ) : (
    <ConvexAdminMessagesInbox {...props} />
  );
}
