import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Atom, BarChart3, FlaskConical, Layers } from "lucide-react";

import { PipelineDiagram } from "@/components/hqml/PipelineDiagram";
import {
  ClinicalDisclaimer,
  EmptyState,
  ErrorState,
  ModeBadge,
  PageHeader,
  QuantumDisclaimer,
  StatCard,
  pct,
} from "@/components/hqml/primitives";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemoMode } from "@/hooks/useDemoMode";
import { mlHealth, quantumHealth } from "@/lib/ml.functions";
import {
  listBenchmarks,
  listModels,
  listPredictions,
  listStudies,
  listTrainingRuns,
} from "@/services/hqmlService";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Research dashboard — HQML" },
      {
        name: "description",
        content:
          "Overview of MRI studies, quantum models, training runs and benchmark results across the HQML pipeline.",
      },
      { property: "og:title", content: "Research dashboard — HQML" },
      { property: "og:description", content: "Pipeline status and latest hybrid quantum results." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { demoMode } = useDemoMode();
  const studies = useQuery({ queryKey: ["studies"], queryFn: () => listStudies(200) });
  const models = useQuery({ queryKey: ["models"], queryFn: listModels });
  const runs = useQuery({ queryKey: ["training-runs"], queryFn: () => listTrainingRuns(50) });
  const preds = useQuery({ queryKey: ["predictions"], queryFn: () => listPredictions(50) });
  const marks = useQuery({ queryKey: ["benchmarks"], queryFn: () => listBenchmarks() });
  const ml = useQuery({ queryKey: ["ml-health"], queryFn: () => mlHealth(), retry: false });
  const qm = useQuery({ queryKey: ["quantum-health"], queryFn: () => quantumHealth(), retry: false });

  const best = [...(marks.data ?? [])].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))[0];
  const loading = studies.isLoading || models.isLoading;

  if (studies.isError) {
    return <ErrorState message={(studies.error as Error).message} onRetry={() => void studies.refetch()} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Hybrid quantum ML research console"
        description="Every record carries an explicit provenance mode so demo material is never confused with measured results."
        actions={<ModeBadge mode={demoMode ? "demo" : "real"} />}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="MRI studies" value={studies.data?.length ?? 0} icon={Layers} />
          <StatCard label="Quantum models" value={models.data?.length ?? 0} icon={Atom} />
          <StatCard label="Training runs" value={runs.data?.length ?? 0} icon={FlaskConical} />
          <StatCard
            label="Best benchmark accuracy"
            value={pct(best?.accuracy)}
            hint={best ? `${best.model_name} (${best.mode})` : "No benchmark recorded"}
            icon={BarChart3}
          />
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold">ML service</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {ml.data?.available
              ? `Reachable in ${ml.data.latency_ms} ms.`
              : (ml.data?.error ?? "Probing the FastAPI ML service…")}
          </p>
          <Badge variant="outline" className="mt-3 font-mono text-[10px] uppercase">
            {ml.data?.available ? "online" : "offline"}
          </Badge>
        </div>
        <div className="panel p-5">
          <h2 className="text-sm font-semibold">Quantum backend</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {qm.data?.available
              ? `Simulator responding in ${qm.data.latency_ms} ms.`
              : (qm.data?.error ?? "Probing the quantum simulator…")}
          </p>
          <Badge variant="outline" className="mt-3 font-mono text-[10px] uppercase">
            {qm.data?.available ? "simulator ready" : "unavailable"}
          </Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pipeline</h2>
        <PipelineDiagram />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent predictions</h2>
          <Link to="/predictions" className="text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        {(preds.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Activity}
            title="No predictions yet"
            description="Run inference from a study detail page once the ML service is configured."
          />
        ) : (
          <div className="panel divide-y divide-border">
            {preds.data?.slice(0, 5).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.predicted_class}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()} · abnormal {pct(p.abnormal_probability)}
                  </p>
                </div>
                <ModeBadge mode={p.mode} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ClinicalDisclaimer />
        <QuantumDisclaimer />
      </div>
    </>
  );
}
