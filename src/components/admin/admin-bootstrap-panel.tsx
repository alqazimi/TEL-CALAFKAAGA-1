"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Shield, KeyRound } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const REASON_MESSAGES: Record<string, string> = {
  not_authenticated: "Sign in with the bootstrap email account, then return here.",
  admins_exist: "An admin already exists. Ask an existing admin to grant you access.",
  not_configured:
    "Bootstrap is not configured yet. Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_SECRET in your Convex deployment.",
  no_email: "Your account has no email. Register with the bootstrap email address.",
  email_mismatch: "Your account email does not match ADMIN_BOOTSTRAP_EMAIL.",
};

export function AdminBootstrapPanel() {
  const [secret, setSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bootstrapStatus = useQuery(api.admin.getBootstrapStatus);
  const claimFirstAdmin = useMutation(api.admin.claimFirstAdmin);

  if (bootstrapStatus === undefined) {
    return null;
  }

  if (!bootstrapStatus.canClaim) {
    const message =
      REASON_MESSAGES[bootstrapStatus.reason] ?? "You cannot claim admin access.";

    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleClaim = async () => {
    if (!secret.trim()) {
      toast.error("Enter the bootstrap secret.");
      return;
    }

    setSubmitting(true);
    try {
      await claimFirstAdmin({ secret: secret.trim() });
      toast.success("You are now the first admin.");
      setSecret("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to claim admin access.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
        <CardTitle>Claim First Admin</CardTitle>
        <CardDescription>
          No admin exists yet. Enter your bootstrap secret to become the first admin.
          This only works once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bootstrap-secret">Bootstrap Secret</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="bootstrap-secret"
              type="password"
              className="pl-10"
              placeholder="Paste ADMIN_BOOTSTRAP_SECRET"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <Button className="w-full" onClick={() => void handleClaim()} disabled={submitting}>
          {submitting ? "Claiming..." : "Become Admin"}
        </Button>
      </CardContent>
    </Card>
  );
}
