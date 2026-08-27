import { Link, useRouter } from "@tanstack/react-router";
import {
  Activity,
  Atom,
  BarChart3,
  Beaker,
  Brain,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Layers,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useDemoMode } from "@/hooks/useDemoMode";
import { cn } from "@/lib/utils";
import { ROLE_LABEL } from "@/types/hqml";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/studies", label: "MRI Studies", icon: Layers },
  { to: "/models", label: "Quantum Models", icon: Atom },
  { to: "/experiments", label: "Experiments", icon: FlaskConical },
  { to: "/training", label: "Training Runs", icon: Brain },
  { to: "/predictions", label: "Predictions", icon: Activity },
  { to: "/benchmarks", label: "Benchmarks", icon: BarChart3 },
  { to: "/admin", label: "Administration", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, role, hasAtLeast, signOut } = useAuth();
  const { demoMode, toggle } = useDemoMode();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => (n.to === "/admin" ? hasAtLeast("admin") : true));

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "surface-quantum fixed inset-y-0 left-0 z-40 flex w-64 flex-col text-primary-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
          <Beaker aria-hidden className="size-5" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">HQML Platform</p>
            <p className="truncate text-[11px] opacity-70">Knee abnormality research</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              activeProps={{ className: "bg-white/15 text-primary-foreground" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/75 transition-colors hover:bg-white/10 hover:text-primary-foreground"
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{profile?.full_name ?? profile?.email ?? "Account"}</p>
              <p className="text-[11px] opacity-70">{ROLE_LABEL[role]}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Sign out"
              className="text-primary-foreground hover:bg-white/10"
              onClick={async () => {
                await signOut();
                void router.navigate({ to: "/auth" });
              }}
            >
              <LogOut aria-hidden className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {open ? (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:px-8">
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu aria-hidden className="size-4" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[10px] tracking-widest uppercase",
                demoMode
                  ? "border-warning/50 bg-warning/15 text-warning-foreground"
                  : "border-success/40 bg-success/10 text-success",
              )}
            >
              {demoMode ? "Demo mode" : "Real ML mode"}
            </Badge>
            {hasAtLeast("admin") ? (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="hidden sm:inline">Demo</span>
                <Switch
                  checked={demoMode}
                  onCheckedChange={(v) => toggle.mutate(v)}
                  aria-label="Toggle demo mode"
                />
              </label>
            ) : null}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 md:px-8">{children}</main>

        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground md:px-8">
          Research decision-support only — not a medical device and not for clinical diagnosis.
        </footer>
      </div>
    </div>
  );
}
