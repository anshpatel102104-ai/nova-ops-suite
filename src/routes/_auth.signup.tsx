import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app/onboarding`,
        data: { full_name: fullName, company },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Workspace created. Welcome to Launchpad Nova.");
    navigate({ to: "/app/onboarding" });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Start with Launchpad Nova</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Create your workspace. Free forever — upgrade when you scale.</p>

      <form className="mt-7 space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating workspace…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
