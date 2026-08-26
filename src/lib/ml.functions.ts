/**
 * Server functions that proxy the frontend to the independently deployed
 * FastAPI ML service. The service URL and any credentials live in server-side
 * environment variables only — they are never shipped to the browser.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const predictInput = z.object({
  study_id: z.string().uuid(),
  model_id: z.string().uuid().nullable().optional(),
  qubits: z.number().int().min(4).max(8).default(4),
  simulator: z.string().default("default.qubit"),
});

const trainInput = z.object({
  run_name: z.string().min(1),
  dataset_version: z.string().optional(),
  epochs: z.number().int().min(1).max(500),
  batch_size: z.number().int().min(1).max(512),
  learning_rate: z.number(),
  qubits: z.number().int().min(4).max(8),
  depth: z.number().int().min(1).max(3),
  seed: z.number().int(),
});

interface ProxyResult<T> {
  available: boolean;
  latency_ms: number | null;
  data: T | null;
  error: string | null;
}

async function callMl<T>(path: string, init?: RequestInit): Promise<ProxyResult<T>> {
  const base = process.env["ML_SERVICE_URL"];
  if (!base) {
    return {
      available: false,
      latency_ms: null,
      data: null,
      error:
        "ML service is not configured. Set ML_SERVICE_URL to the deployed FastAPI service (see ml-service/README.md).",
    };
  }
  const requestId = crypto.randomUUID();
  const started = Date.now();
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-request-id": requestId,
        ...(process.env["ML_SERVICE_TOKEN"]
          ? { authorization: `Bearer ${process.env["ML_SERVICE_TOKEN"]}` }
          : {}),
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    const latency = Date.now() - started;
    if (!res.ok) {
      return {
        available: false,
        latency_ms: latency,
        data: null,
        error: `ML service returned ${res.status} ${res.statusText}`,
      };
    }
    return { available: true, latency_ms: latency, data: (await res.json()) as T, error: null };
  } catch (err) {
    return {
      available: false,
      latency_ms: Date.now() - started,
      data: null,
      error: err instanceof Error ? err.message : "ML service unreachable",
    };
  }
}

export const mlHealth = createServerFn({ method: "GET" }).handler(async () => callMl("/health"));

export const quantumHealth = createServerFn({ method: "GET" }).handler(async () =>
  callMl("/quantum/health"),
);

export const runPrediction = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => predictInput.parse(data))
  .handler(async ({ data }) => callMl("/predict", { method: "POST", body: JSON.stringify(data) }));

export const runPreprocess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ study_id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => callMl("/preprocess", { method: "POST", body: JSON.stringify(data) }));

export const startTraining = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trainInput.parse(data))
  .handler(async ({ data }) => callMl("/train", { method: "POST", body: JSON.stringify(data) }));

export const runBenchmark = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ experiment_id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => callMl("/benchmark", { method: "POST", body: JSON.stringify(data) }));
