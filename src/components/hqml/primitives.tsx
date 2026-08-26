import { AlertTriangle, Atom, Database, Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResultMode } from "@/types/hqml";

/* ------------------------------ mode badge ------------------------------- */

const MODE_COPY: Record<ResultMode, { label: string; hint: string; className: string }> = {
  real: {
    label: "Real ML",
    hint: "Produced by the live ML service against real inputs.",
    className: "border-success/40 bg-success/10 text-success",
  },
  simulation: {
    label: "Simulation",
    hint: "Produced by a quantum simulator run, not quantum hardware.",
    className: "border-quantum/40 bg-quantum/10 text-quantum",
  },
  demo: {
    label: "Demo data",
    hint: "Clearly-synthetic demo record. Not a measured result.",
    className: "border-warning/50 bg-warning/15 text-warning-foreground",
  },
};

export function ModeBadge({ mode, className }: { mode: ResultMode; className?: string }) {
  const copy = MODE_COPY[mode];
  return (
    <Badge
      variant="outline"
      title={copy.hint}
      className={cn("font-mono text-[10px] tracking-widest uppercase", copy.className, className)}
    >
      {copy.label}
    </Badge>
  );
}

/* ------------------------------ disclaimers ------------------------------ */

export function ClinicalDisclaimer({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm",
        className,
      )}
    >
      <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
      <p className="text-foreground/85">
        <strong className="font-semibold">Research / decision-support output only.</strong> This
        prediction is experimental and must not be used as a substitute for professional medical
        diagnosis.
      </p>
    </div>
  );
}

export function QuantumDisclaimer({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn("flex gap-3 rounded-lg border border-quantum/30 bg-quantum/5 p-4 text-sm", className)}
    >
      <Atom aria-hidden className="mt-0.5 size-4 shrink-0 text-quantum" />
      <p className="text-foreground/85">
        <strong className="font-semibold">Quantum advantage is not assumed.</strong> The platform
        experimentally evaluates whether a compact hybrid quantum-classical model can be competitive
        with classical baselines.
      </p>
    </div>
  );
}

export function BarrenPlateauNotice({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn("flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm", className)}
    >
      <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
      <p className="text-foreground/85">
        Deeper circuits and higher qubit counts increase simulation cost superlinearly and raise the
        risk of <strong className="font-semibold">barren plateaus</strong> (vanishing gradients). Depth
        is intentionally capped at 3 and qubits at 8 for this prototype.
      </p>
    </div>
  );
}

/* ------------------------------ page header ------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="label-caps mb-1">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/* -------------------------------- states -------------------------------- */

export function EmptyState({
  icon: Icon = Database,
  title,
  description,
  action,
}: {
  icon?: typeof Database;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-3 p-10 text-center">
      <span className="rounded-full border border-border bg-muted p-3">
        <Icon aria-hidden className="size-5 text-muted-foreground" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

export function NotMeasured({ label = "Not measured yet" }: { label?: string }) {
  return <span className="font-mono text-xs text-muted-foreground">{label}</span>;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="panel flex flex-col items-start gap-3 border-destructive/30 p-6">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle aria-hidden className="size-4" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent/10"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
      <div>{children}</div>
    </div>
  );
}

/* -------------------------------- metrics -------------------------------- */

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: typeof Database;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="label-caps">{label}</p>
        {Icon ? <Icon aria-hidden className="size-4 text-accent" /> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function pct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

export function ms(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  if (v < 1000) return `${v} ms`;
  return `${(v / 1000).toFixed(1)} s`;
}
