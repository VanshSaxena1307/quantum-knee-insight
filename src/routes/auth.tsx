import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Beaker } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HQML Research Console" },
      {
        name: "description",
        content:
          "Sign in to the HQML hybrid quantum machine learning console for knee MRI abnormality research.",
      },
      { property: "og:title", content: "Sign in — HQML Research Console" },
      {
        property: "og:description",
        content: "Access the hybrid quantum-classical knee MRI research workspace.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void router.navigate({ to: "/dashboard" });
    });
  }, [router]);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    void router.navigate({ to: "/dashboard" });
  }

  async function signUp() {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { full_name: fullName, institution },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. If confirmation is required, check your inbox.");
    const { data } = await supabase.auth.getSession();
    if (data.session) void router.navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="surface-quantum hidden flex-col justify-between p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <Beaker aria-hidden className="size-5" />
          <span className="font-semibold">HQML Platform</span>
        </div>
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            Hybrid quantum-classical knee MRI abnormality research
          </h1>
          <p className="text-sm opacity-80">
            Preprocess MRI studies, extract and compress deep features, train variational quantum
            classifiers on simulators, and benchmark them honestly against classical baselines.
          </p>
        </div>
        <p className="text-xs opacity-70">
          Research decision-support only. Not a medical device.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="panel w-full max-w-md p-6">
          <h2 className="text-lg font-semibold">Research console access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The first registered account becomes Admin; later accounts start as Researcher.
          </p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy} onClick={() => void signIn()}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst">Institution</Label>
                <Input
                  id="inst"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email2">Email</Label>
                <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password2">Password</Label>
                <Input
                  id="password2"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy} onClick={() => void signUp()}>
                {busy ? "Creating account…" : "Create account"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
