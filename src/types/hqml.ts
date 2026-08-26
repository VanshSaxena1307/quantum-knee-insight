/** Shared domain types for the HQML platform. Mirrors the database schema. */

export type AppRole = "researcher" | "research_lead" | "admin";
export type ResultMode = "real" | "simulation" | "demo";
export type RunStatus = "pending" | "queued" | "running" | "completed" | "failed";
export type ExperimentStatus = "draft" | "queued" | "running" | "completed" | "failed";

export const ROLE_LABEL: Record<AppRole, string> = {
  researcher: "Researcher",
  research_lead: "Research Lead",
  admin: "Admin",
};

/** Role capability matrix — enforced in the database via RLS, mirrored here for UI gating. */
export const ROLE_RANK: Record<AppRole, number> = {
  researcher: 1,
  research_lead: 2,
  admin: 3,
};

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  institution: string | null;
  created_at: string;
  updated_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  source_url: string | null;
  version: string | null;
  modality: string | null;
  total_studies: number | null;
  label_schema: Record<string, unknown> | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

export interface Study {
  id: string;
  patient_reference: string;
  dataset_id: string | null;
  study_uid: string | null;
  modality: string | null;
  body_part: string | null;
  acquisition_date: string | null;
  status: string;
  file_count: number;
  preprocessing_status: string;
  notes: string | null;
  mode: ResultMode;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudyFile {
  id: string;
  study_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  file_type: string | null;
  checksum: string | null;
  upload_status: string;
  created_at: string;
}

export interface PreprocessingRun {
  id: string;
  study_id: string;
  run_id: string | null;
  input_format: string | null;
  target_size: string;
  normalization_method: string | null;
  slices_processed: number | null;
  selected_slices: number[] | null;
  status: RunStatus;
  processing_time_ms: number | null;
  error_message: string | null;
  mode: ResultMode;
  created_at: string;
}

export interface FeatureExtraction {
  id: string;
  study_id: string;
  preprocessing_run_id: string | null;
  model_name: string;
  model_version: string | null;
  feature_dimension: number;
  embedding_path: string | null;
  extraction_time_ms: number | null;
  mode: ResultMode;
  created_at: string;
}

export interface FeatureCompression {
  id: string;
  feature_extraction_id: string;
  method: string;
  input_dimension: number;
  output_dimension: number;
  explained_variance: number | null;
  parameters: Record<string, unknown> | null;
  mode: ResultMode;
  created_at: string;
}

export interface QuantumModel {
  id: string;
  name: string;
  model_type: string;
  framework: string;
  simulator: string;
  qubit_count: number;
  circuit_depth: number;
  encoding_method: string;
  entanglement_method: string;
  optimizer: string;
  learning_rate: number;
  epochs: number;
  batch_size: number;
  status: string;
  version: string;
  mode: ResultMode;
  created_by: string | null;
  created_at: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string | null;
  dataset_id: string | null;
  task: string;
  classical_model: string | null;
  quantum_model: string | null;
  status: ExperimentStatus;
  configuration_json: Record<string, unknown> | null;
  mode: ResultMode;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface EpochMetric {
  epoch: number;
  loss: number;
  accuracy: number;
  val_loss?: number;
  val_accuracy?: number;
}

export interface TrainingRun {
  id: string;
  model_id: string | null;
  dataset_id: string | null;
  experiment_id: string | null;
  run_name: string;
  model_type: string;
  train_samples: number | null;
  val_samples: number | null;
  test_samples: number | null;
  epochs: number | null;
  batch_size: number | null;
  learning_rate: number | null;
  seed: number | null;
  dataset_version: string | null;
  reproducibility_json: Record<string, unknown> | null;
  training_time_ms: number | null;
  status: RunStatus;
  started_at: string | null;
  completed_at: string | null;
  metrics_json: { epochs?: EpochMetric[] } | null;
  error_message: string | null;
  mode: ResultMode;
  created_at: string;
}

export interface Prediction {
  id: string;
  study_id: string;
  model_id: string | null;
  training_run_id: string | null;
  predicted_class: string;
  abnormal_probability: number;
  normal_probability: number;
  confidence: number | null;
  inference_time_ms: number | null;
  model_version: string | null;
  mode: ResultMode;
  created_at: string;
}

export interface FeatureAttribution {
  name: string;
  value: number;
}

export interface Explanation {
  id: string;
  prediction_id: string;
  method: string;
  heatmap_path: string | null;
  attribution_json: Record<string, unknown> | null;
  feature_importance_json: { features?: FeatureAttribution[] } | null;
  explanation_summary: string | null;
  mode: ResultMode;
  created_at: string;
}

export interface Benchmark {
  id: string;
  experiment_id: string | null;
  training_run_id: string | null;
  model_name: string;
  model_type: string;
  accuracy: number | null;
  precision_score: number | null;
  recall: number | null;
  specificity: number | null;
  f1_score: number | null;
  roc_auc: number | null;
  confusion_matrix: { tp: number; fp: number; tn: number; fn: number } | null;
  roc_curve: { fpr: number[]; tpr: number[] } | null;
  inference_time_ms: number | null;
  training_time_ms: number | null;
  mode: ResultMode;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: { value: unknown };
  description: string | null;
  is_public: boolean;
  updated_at: string;
}

/** FastAPI ML-service contracts (mirror ml-service/app/models/schemas.py). */
export interface MlHealth {
  status: "ok" | "degraded";
  service: string;
  version: string;
  torch_available: boolean;
  feature_extractor_loaded: boolean;
}

export interface QuantumHealth {
  status: "ok" | "degraded";
  framework: string;
  simulator: string;
  qubits: number;
  differentiable: boolean;
}

export interface ServiceProbe<T> {
  available: boolean;
  latency_ms: number | null;
  data: T | null;
  error: string | null;
}
