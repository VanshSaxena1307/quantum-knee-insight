import { cn } from "@/lib/utils";

export const PIPELINE_STAGES = [
  { key: "ingest", name: "MRI / DICOM ingestion", detail: "pydicom · SimpleITK" },
  { key: "preprocess", name: "Preprocessing", detail: "orientation · z-score · 128×128" },
  { key: "extract", name: "ResNet18 features", detail: "512-D embedding" },
  { key: "compress", name: "PCA / Linear bottleneck", detail: "512 → 4–8 D" },
  { key: "encode", name: "Angle encoding", detail: "RY(x) per qubit" },
  { key: "vqc", name: "4-qubit VQC", detail: "CNOT entanglement · depth ≤ 3" },
  { key: "explain", name: "Grad-CAM + SHAP", detail: "attribution" },
  { key: "benchmark", name: "Classical vs hybrid benchmark", detail: "ROC-AUC · F1" },
] as const;

export function PipelineDiagram({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {PIPELINE_STAGES.map((stage, i) => (
        <li
          key={stage.key}
          className="relative rounded-lg border border-border/70 bg-card/70 p-4 backdrop-blur-sm"
        >
          <span className="label-caps">Stage {String(i + 1).padStart(2, "0")}</span>
          <p className="mt-1 text-sm font-semibold leading-snug">{stage.name}</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{stage.detail}</p>
        </li>
      ))}
    </ol>
  );
}
