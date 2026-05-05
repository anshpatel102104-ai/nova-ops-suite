import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: ForgotPage,
});

function ForgotPage() {
  const [sent, setSent] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">We'll send you a secure reset link.</p>

      {sent ? (
        <div className="mt-6 nova-card p-4 text-sm">
          Check your inbox for the reset link.
        </div>
      ) : (
        <form
          className="mt-7 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: supabase.auth.resetPasswordForEmail
            setSent(true);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required />
          </div>
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      )}

      <p className="mt-6 text-xs text-muted-foreground text-center">
        <Link to="/login" className="hover:text-primary">← Back to log in</Link>
      </p>
    </div>
  );
}
