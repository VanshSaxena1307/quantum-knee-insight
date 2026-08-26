/**
 * Centralised, typed data access for the HQML platform.
 * Every frontend read/write goes through this module — no scattered raw fetches.
 * All access is additionally constrained server-side by RLS.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  AppRole,
  AuditLog,
  Benchmark,
  Dataset,
  Experiment,
  Explanation,
  FeatureCompression,
  FeatureExtraction,
  Prediction,
  PreprocessingRun,
  Profile,
  QuantumModel,
  ResultMode,
  Study,
  StudyFile,
  SystemSetting,
  TrainingRun,
} from "@/types/hqml";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

/* ------------------------------- audit ---------------------------------- */

export async function logAudit(
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const userId = await currentUserId();
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      resource_type: resourceType ?? null,
      resource_id: resourceId ?? null,
      metadata: metadata as never,
    });
  } catch {
    // Audit logging must never block the user-facing action.
  }
}

export async function listAuditLogs(search = "", limit = 100): Promise<AuditLog[]> {
  let q = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (search.trim()) q = q.ilike("action", `%${search.trim()}%`);
  return unwrap(await q) as AuditLog[];
}

/* ------------------------------ profiles -------------------------------- */

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw new Error(error.message);
  await logAudit("profile.update", "profile", userId);
}

export async function getRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.role as AppRole);
}

export interface TeamMember extends Profile {
  roles: AppRole[];
}

export async function listTeam(): Promise<TeamMember[]> {
  const profiles = unwrap(
    await supabase.from("profiles").select("*").order("created_at", { ascending: true }),
  ) as Profile[];
  const roles = unwrap(await supabase.from("user_roles").select("user_id, role")) as {
    user_id: string;
    role: AppRole;
  }[];
  return profiles.map((p) => ({ ...p, roles: roles.filter((r) => r.user_id === p.id).map((r) => r.role) }));
}

export async function setUserRole(userId: string, role: AppRole): Promise<void> {
  const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (delErr) throw new Error(delErr.message);
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error) throw new Error(error.message);
  await logAudit("admin.role.change", "user", userId, { role });
}

/* ------------------------------ datasets -------------------------------- */

export async function listDatasets(): Promise<Dataset[]> {
  return unwrap(
    await supabase.from("datasets").select("*").order("created_at", { ascending: false }),
  ) as Dataset[];
}

/* ------------------------------- studies -------------------------------- */

export async function listStudies(limit = 50): Promise<Study[]> {
  return unwrap(
    await supabase.from("studies").select("*").order("created_at", { ascending: false }).limit(limit),
  ) as Study[];
}

export async function getStudy(id: string): Promise<Study | null> {
  const { data, error } = await supabase.from("studies").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Study | null;
}

export interface NewStudyInput {
  patient_reference: string;
  dataset_id: string | null;
  study_uid?: string | null;
  acquisition_date?: string | null;
  notes?: string | null;
  mode: ResultMode;
}

export async function createStudy(input: NewStudyInput): Promise<Study> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("studies")
    .insert({ ...input, created_by: userId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await logAudit("study.create", "study", data.id, { mode: input.mode });
  return data as Study;
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 160);
}

export async function uploadStudyFile(studyId: string, file: File): Promise<StudyFile> {
  const userId = await currentUserId();
  const safe = sanitizeFileName(file.name);
  const path = `${userId}/${studyId}/${Date.now()}_${safe}`;
  const { error: upErr } = await supabase.storage.from("mri-studies").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);

  const { data, error } = await supabase
    .from("study_files")
    .insert({
      study_id: studyId,
      file_name: safe,
      storage_path: path,
      mime_type: file.type || null,
      file_size: file.size,
      file_type: safe.split(".").slice(1).join(".").toLowerCase() || null,
      upload_status: "uploaded",
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await logAudit("study.file.upload", "study", studyId, { file_name: safe, bytes: file.size });
  return data as StudyFile;
}

export async function finalizeStudyUpload(studyId: string, fileCount: number): Promise<void> {
  const { error } = await supabase
    .from("studies")
    .update({ file_count: fileCount, status: fileCount > 0 ? "uploaded" : "empty" })
    .eq("id", studyId);
  if (error) throw new Error(error.message);
}

export async function listStudyFiles(studyId: string): Promise<StudyFile[]> {
  return unwrap(
    await supabase
      .from("study_files")
      .select("*")
      .eq("study_id", studyId)
      .order("created_at", { ascending: true }),
  ) as StudyFile[];
}

/** Private buckets only — access is always through a short-lived signed URL. */
export async function signedUrl(bucket: string, path: string, expiresIn = 300): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/* --------------------------- pipeline records --------------------------- */

export async function listPreprocessingRuns(studyId: string): Promise<PreprocessingRun[]> {
  return unwrap(
    await supabase
      .from("preprocessing_runs")
      .select("*")
      .eq("study_id", studyId)
      .order("created_at", { ascending: false }),
  ) as PreprocessingRun[];
}

export async function createPreprocessingRun(
  studyId: string,
  patch: Partial<PreprocessingRun>,
): Promise<PreprocessingRun> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("preprocessing_runs")
    .insert({ study_id: studyId, created_by: userId, ...patch })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await logAudit("preprocessing.start", "study", studyId);
  return data as PreprocessingRun;
}

export async function updatePreprocessingRun(
  id: string,
  patch: Partial<PreprocessingRun>,
): Promise<void> {
  const { error } = await supabase.from("preprocessing_runs").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listFeatureExtractions(studyId: string): Promise<FeatureExtraction[]> {
  return unwrap(
    await supabase
      .from("feature_extractions")
      .select("*")
      .eq("study_id", studyId)
      .order("created_at", { ascending: false }),
  ) as FeatureExtraction[];
}

export async function listCompressions(extractionIds: string[]): Promise<FeatureCompression[]> {
  if (extractionIds.length === 0) return [];
  return unwrap(
    await supabase.from("feature_compressions").select("*").in("feature_extraction_id", extractionIds),
  ) as FeatureCompression[];
}

/* ------------------------------- models --------------------------------- */

export async function listModels(): Promise<QuantumModel[]> {
  return unwrap(
    await supabase.from("quantum_models").select("*").order("created_at", { ascending: false }),
  ) as QuantumModel[];
}

export async function getModel(id: string): Promise<QuantumModel | null> {
  const { data, error } = await supabase.from("quantum_models").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as QuantumModel | null;
}

export async function createModel(input: Partial<QuantumModel>): Promise<QuantumModel> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("quantum_models")
    .insert({ ...input, created_by: userId } as never)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await logAudit("model.create", "quantum_model", data.id, { name: data.name });
  return data as QuantumModel;
}

/* ---------------------------- predictions ------------------------------- */

export async function listPredictions(limit = 50): Promise<Prediction[]> {
  return unwrap(
    await supabase.from("predictions").select("*").order("created_at", { ascending: false }).limit(limit),
  ) as Prediction[];
}

export async function listStudyPredictions(studyId: string): Promise<Prediction[]> {
  return unwrap(
    await supabase
      .from("predictions")
      .select("*")
      .eq("study_id", studyId)
      .order("created_at", { ascending: false }),
  ) as Prediction[];
}

export async function createPrediction(input: Partial<Prediction>): Promise<Prediction> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("predictions")
    .insert({ ...input, created_by: userId } as never)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await logAudit("prediction.create", "prediction", data.id, { mode: data.mode });
  return data as Prediction;
}

export async function listExplanations(predictionIds: string[]): Promise<Explanation[]> {
  if (predictionIds.length === 0) return [];
  return unwrap(
    await supabase
      .from("explanations")
      .select("*")
      .in("prediction_id", predictionIds)
      .order("created_at", { ascending: false }),
  ) as Explanation[];
}

/* ---------------------- experiments / training --------------------------- */

export async function listExperiments(): Promise<Experiment[]> {
  return unwrap(
    await supabase.from("experiments").select("*").order("created_at", { ascending: false }),
  ) as Experiment[];
}

export async function getExperiment(id: string): Promise<Experiment | null> {
  const { data, error } = await supabase.from("experiments").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Experiment | null;
}

export async function createExperiment(input: Partial<Experiment>): Promise<Experiment> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("experiments")
    .insert({ ...input, created_by: userId } as never)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await logAudit("experiment.create", "experiment", data.id, { name: data.name });
  return data as Experiment;
}

export async function listTrainingRuns(limit = 50): Promise<TrainingRun[]> {
  return unwrap(
    await supabase
      .from("training_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  ) as TrainingRun[];
}

export async function getTrainingRun(id: string): Promise<TrainingRun | null> {
  const { data, error } = await supabase.from("training_runs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as TrainingRun | null;
}

export async function createTrainingRun(input: Partial<TrainingRun>): Promise<TrainingRun> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("training_runs")
    .insert({ ...input, created_by: userId } as never)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await logAudit("training.start", "training_run", data.id, { run_name: data.run_name });
  return data as TrainingRun;
}

export async function updateTrainingRun(id: string, patch: Partial<TrainingRun>): Promise<void> {
  const { error } = await supabase.from("training_runs").update(patch as never).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ----------------------------- benchmarks ------------------------------- */

export async function listBenchmarks(experimentId?: string): Promise<Benchmark[]> {
  let q = supabase.from("benchmarks").select("*").order("created_at", { ascending: false });
  if (experimentId) q = q.eq("experiment_id", experimentId);
  return unwrap(await q) as Benchmark[];
}

/* --------------------------- system settings ---------------------------- */

export async function listSettings(): Promise<SystemSetting[]> {
  return unwrap(await supabase.from("system_settings").select("*").order("key")) as unknown as SystemSetting[];
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from("system_settings")
    .update({ value: { value } as never, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) throw new Error(error.message);
  await logAudit("admin.setting.update", "system_setting", key, { value });
}

/* ------------------------------- exports -------------------------------- */

export function toCsv(rows: Record<string, unknown>[]): string {
  const first = rows[0];
  if (!first) return "";
  const headers = Object.keys(first);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
