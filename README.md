# Quantum Knee Insight

HQML — Hybrid Quantum Machine Learning Knee Abnormality Detection Platform

Master Build Prompt for Lovable.ai (single-pass, full-stack)

Build a complete, working, production-quality full-stack web application — not a static UI prototype. Implement frontend, Supabase backend (auth, database, storage, RLS, edge functions), the FastAPI ML-service architecture, and a clearly labeled Demo/Simulation Mode, end to end, in this single generation. Do not stop at the frontend. Do not leave buttons non-functional. Do not fabricate results.

Execution rule: Do not pause to ask clarifying questions ("should I add auth?", "should I build the backend?" etc.) — the answer to all of them is yes. Where you make an implementation decision not specified below, choose the most reasonable option and proceed. Build the entire project in this one pass, then run a final consistency check (routes ↔ API endpoints ↔ DB tables ↔ storage paths ↔ TypeScript/Pydantic types ↔ RLS policies) and fix mismatches before finishing.

1. Product Context

A healthcare/med-tech research and decision-support platform demonstrating a hybrid classical + quantum ML pipeline for knee MRI abnormality detection:

MRI/DICOM → Preprocessing → ResNet18 CNN (512D) → PCA/Linear bottleneck (4–8D)
→ Angle Encoding → 4-Qubit Variational Quantum Classifier → ACL abnormality
probability → Grad-CAM + SHAP explanation → Classical-vs-Hybrid benchmark


Prototype task: ACL Abnormality/Tear vs Normal (binary). The RSNA dataset supports 12 abnormality labels — multi-label classification is explicitly future work, never presented as implemented.

Data source (reference only, not bundled): RSNA Knee Abnormality Detection Dataset — https://www.kaggle.com/competitions/rsna-knee-abnormality-detection/data. Seed it as a research_reference_dataset record; do not imply the raw dataset ships with the app.

Non-negotiable positioning: This is a research/decision-support prototype, not a diagnostic tool, and it does not assume quantum advantage. The core research question, shown prominently: "Can a compact hybrid quantum-classical model provide competitive diagnostic performance against strong classical baselines?" Use language like "experimental," "research benchmark," "observed performance," "no quantum advantage assumed." Never claim superiority, never say "diagnosis confirmed" or "you have ACL tear" — use "predicted class," "abnormality probability," "experimental result."

2. Tech Stack

Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui + Lucide + React Router + TanStack Query + Recharts + React Hook Form + Zod.

Backend: Supabase (Auth, Postgres, RLS, Storage, Edge Functions). All computational ML/quantum work is architected as a separate, independently deployable FastAPI service in ml-service/ — recommended stack: Python 3.11, FastAPI, Uvicorn, PyTorch, torchvision, scikit-learn, pydicom, SimpleITK, MONAI, Albumentations, PennyLane (primary quantum framework, default.qubit simulator) with an optional Qiskit Aer adapter, SHAP.

Visual identity: "Medical imaging research lab + quantum computing dashboard" — deep navy sidebar, clinical white/light main area, muted blue, cyan/teal accents, subtle quantum-inspired gradients, clean cards with fine borders, minimal glass effects, strong typographic hierarchy, small-caps technical labels. Professional enough for researchers/academics/judges; avoid generic SaaS-template or neon/cyberpunk looks.

3. Project Structure

/src (components, pages, layouts, hooks, lib, services, types, utils, integrations)
/supabase (migrations, functions/{create-study,process-study,predict-study,get-experiment,benchmark-models,health}, seed)
/ml-service/app (main.py, config.py, api/, models/, preprocessing/, classical/, quantum/, explainability/, benchmarking/, inference/, training/, utils/) + tests/, requirements.txt, Dockerfile, README.md
/docs (architecture.md, api.md, ml-pipeline.md, quantum-pipeline.md, deployment.md, research-methodology.md)
.env.example, README.md, docker-compose.yml


4. Auth & Roles

Supabase email/password auth, session persistence, protected routes, password reset. Roles stored in profiles, enforced via RLS (never frontend-only):

Researcher: upload studies, run preprocessing/inference, view predictions/explanations/experiments/benchmarks.

Research Lead: + create experiments, train models, compare models, manage datasets.

Admin: + manage users/datasets/models, view system health, config, audit logs.

5. Database Schema (Postgres, with RLS + indexes)

Create all tables below with sensible types, FKs, timestamps, and indexes on created_by, status, created_at/timestamps, and FK columns (esp. predictions.study_id, training_runs.status, benchmarks.experiment_id, audit_logs.user_id+created_at).

Table Key Fields profiles id, full_name, email, avatar_url, role, institution, timestamps datasets id, name, description, source, version, modality, total_studies, label_schema, status — seed RSNA as research_reference_dataset studies id, patient_reference (anonymized), dataset_id, study_uid, modality, body_part, acquisition_date, status, file_count, preprocessing_status, created_by study_files id, study_id, file_name, storage_path, mime_type, file_size, file_type, checksum, upload_status preprocessing_runs id, study_id, run_id, input_format, target_size (default 128×128), normalization_method, slices_processed, selected_slices, status, processing_time_ms, error_message feature_extractions id, study_id, preprocessing_run_id, model_name (default ResNet18), model_version, feature_dimension (default 512), embedding_path, extraction_time_ms feature_compressions id, feature_extraction_id, method (PCA/Linear), input_dimension, output_dimension (4–8), explained_variance (real value only, never hardcoded), parameters quantum_models id, name, framework, simulator, qubit_count (default 4, options 4/6/8), circuit_depth (≤3), encoding_method (Angle), entanglement_method (CNOT), optimizer, learning_rate, epochs, status, version training_runs id, model_id, dataset_id, run_name, model_type, train/val/test_samples, epochs, batch_size, learning_rate, training_time_ms, status, started_at, completed_at, metrics_json, error_message predictions id, study_id, model_id, training_run_id, predicted_class, abnormal_probability, normal_probability, confidence, inference_time_ms, model_version, mode (real/simulation/demo) explanations id, prediction_id, method (Grad-CAM/SHAP), heatmap_path, attribution_json, feature_importance_json, explanation_summary benchmarks id, experiment_id, model_name, model_type, accuracy, precision, recall, specificity, f1_score, roc_auc, inference_time_ms, training_time_ms experiments id, name, description, dataset_id, task (default ACL Abnormality vs Normal), classical_model, quantum_model, status (Draft/Queued/Running/Completed/Failed), configuration_json, created_by, completed_at audit_logs user_id, action, resource_type, resource_id, metadata, created_at system_settings ML service URL, default model, simulator, max upload size, allowed file types, demo mode flag, feature dimension, quantum qubits — never expose secrets to frontend

6. Storage Buckets (private, RLS + signed URLs — never public)

mri-studies, preprocessed-images, embeddings, explanations, model-artifacts.

7. Routes

/login /signup /forgot-password
/dashboard
/studies /studies/new /studies/:id /studies/:id/preprocessing /studies/:id/prediction /studies/:id/explainability
/models /models/:id
/training /training/new /training/:id
/experiments /experiments/:id
/benchmarking
/datasets
/research
/system
/admin
/settings


Enforce role-based route protection.

8. App Shell

Dark navy sidebar: Overview (Dashboard) · Clinical Research (MRI Studies, Predictions, Explainability) · Quantum ML (Models, Training, Experiments, Benchmarking) · Data (Datasets) · System (Research Analytics, System Health, Admin). Footer: user profile, role, settings, logout.

9. Key Pages & Workflows

Landing page: Hero "Hybrid Quantum Intelligence for Medical Imaging," subtitle, CTAs ("Enter Research Console" / "Explore Architecture"), pipeline visual, sections for Problem/Solution/Architecture/Key Features/Why Hybrid/Research Question/Feasibility/Future Expansion, and the safety disclaimer.

Dashboard ("HQML Research Console"): KPI cards (Studies, Predictions, Hybrid Models, Experiments, Best ROC-AUC, Qubits); Hybrid-vs-Classical performance chart using real DB values (label clearly as Demo/Simulation Data if no real experiment exists); Pipeline Status (8 stages with status/duration/model/last run); Recent Studies table.

Study ingestion (/studies/new): drag/drop DICOM/.dcm/ZIP upload, validation, progress, metadata, anonymization notice. Creates a study record; does not fake a prediction.

Study detail: overview + MRI viewer (slice nav, zoom/pan, window/level) showing the real processed slice — never a fabricated placeholder image passed off as the scan.

Preprocessing: visible step-by-step pipeline (parse → orientation → normalize → resize to 128×128 → slice selection → tensor) with real timings/dimensions/errors.

ML pipeline modules: ResNet18 feature extraction (512D, cached/loaded once, not re-downloaded per call); PCA/Linear bottleneck (512D→4–8D) with real explained variance.

Quantum ML: modular PennyLane circuit (circuit.py, encoding.py, vqc.py, simulator.py, qiskit_adapter.py) — genuinely parameterized angle encoding + CNOT entanglement + expectation-value measurement, PyTorch-integrated where feasible. VQC config UI: backend, qubits (4/6/8), encoding, entanglement, depth (1–3), optimizer, LR, epochs, batch size, with a barren-plateau/cost warning.

Training (/training/new): wizard — dataset → task → feature extractor → compression → quantum model → training config → benchmark baseline → confirm/start. Training monitor shows real epoch/loss/accuracy charts; if the ML service is unavailable, show a clear "ML service unavailable" state with retry / switch to demo mode (never silently fall back to fake numbers).

Prediction workflow: "Run Hybrid Prediction" → live pipeline checklist (preprocessing → extraction → compression → encoding → VQC → explanation) → result card (predicted class, probability, confidence) using actual model output, never hardcoded. Visible disclaimer on every prediction page (see §10).

Explainability (/studies/:id/explainability): Grad-CAM panel (original slice, heatmap, overlay, opacity slider) with the caption "Highlighted regions indicate image areas contributing to the model prediction. They are not a clinical interpretation." SHAP panel: horizontal bar chart of quantum feature attributions — never fabricated values.

Quantum circuit visualizer: render the actual configured circuit (qubits, depth, encoding, entanglement, simulator, parameters).

Model detail, Experiments, Benchmarking: classical-vs-hybrid comparison table/charts (Accuracy, Precision, Recall, Specificity, F1, ROC-AUC, train/inference time) sourced from real DB rows; if nothing measured yet, show "No measured benchmark available" rather than inventing numbers. Include the quantum-advantage disclaimer (§10).

Datasets page: RSNA dataset info, clearly separating "dataset capability" (12 labels) from "currently implemented prototype" (ACL vs Normal).

Research Analytics (/research): performance trends, qubit-count comparison, compression-method comparison, classical-vs-quantum summary, explainability coverage, experiment success/failure counts.

System Health (/system): frontend/DB/storage/ML-service/quantum-simulator status, API latency; ML health at GET /health, quantum health at GET /quantum/health.

Admin (/admin): users/roles, storage usage, ML/quantum service status, searchable audit logs.

Settings: user profile settings; research defaults (model, simulator, qubits, feature dimension); admin-only system settings gated by role.

Methodology & References pages: pipeline explanation, feasibility notes (barren plateaus, simulator limits, compute), and citations (RSNA dataset, Bien et al. PLOS Medicine, PennyLane docs, Qiskit docs, VQC literature, angle-encoding literature, Selvaraju et al. Grad-CAM, Lundberg & Lee SHAP) — do not fabricate citation metadata.

10. Cross-Cutting Rules

Clinical/quantum disclaimers (every prediction & benchmark page):

"Research / decision-support output only. This prediction is experimental and must not be used as a substitute for professional medical diagnosis." "Quantum advantage is not assumed. The platform experimentally evaluates whether a compact hybrid quantum-classical model can be competitive with classical baselines."

No-fake-data rule: Never invent accuracy/sensitivity/specificity/ROC-AUC/quantum-advantage/diagnostic claims. Unmeasured results show "Not measured yet" or "Run experiment to generate result." Demo data is allowed only when explicitly labeled.

Real / Simulation / Demo separation: every result-bearing record carries mode: real | simulation | demo; the UI always visibly shows which one it is. Provide a global Real ML | Demo Mode toggle (Admin/Research Lead). Demo mode uses clearly-synthetic seeded studies/predictions/experiments/benchmarks/model configs (all mode = demo) so the app is fully demonstrable without a live GPU/quantum backend, and the dashboard shows a "Demo Environment" indicator when active.

States: every async action needs loading/success/error/retry/empty states (e.g., "ML inference service unavailable — your study has been saved; retry when available," "Could not parse as valid DICOM," explanation-failed message that still preserves the prediction).

Backend architecture: FastAPI endpoints — GET /health, POST /preprocess, /extract-features, /compress-features, /quantum/encode, /quantum/predict, /predict, /explain/gradcam, /explain/shap, /train, GET /train/{run_id}, /train/{run_id}/metrics, /benchmark, GET /benchmark/{experiment_id}, GET /models, GET /models/{model_id} — with Pydantic schemas, validation, structured errors, logging, CORS, request IDs. Supabase Edge Functions orchestrate: create-study, process-study, predict-study, benchmark-models, get-experiment, health. Centralize all frontend API calls in typed src/services/*Service.ts files — no scattered raw fetches. Never expose service credentials/secrets in frontend code; use .env.example.

Security/privacy: RLS everywhere, private storage + signed URLs, input/file-type/size validation, sanitized filenames, audit logging of key actions (login, upload, preprocessing/prediction/training start, model/experiment creation, benchmark run, admin changes), anonymized "Study Reference ID" only (no patient names), pre-upload anonymization notice.

Performance: lazy-loaded routes, query caching, pagination, one-time model/simulator initialization per service process, DB indexes as listed in §5.

Accessibility & responsiveness: keyboard nav, focus states, semantic HTML/ARIA, sufficient contrast; desktop-first with tablet/mobile support (collapsing sidebar, horizontally scrollable tables/viewer).

Reproducibility: store seed, dataset version, preprocessing config, feature extractor, PCA config, quantum config, optimizer/LR/epochs/batch size, simulator, and model version with every training run; support CSV/JSON export of experiment/benchmark/prediction results (no PII).

11. Delivery Table (Expected Deliverables)

Phase / Module Expected Deliverable Success Criteria / Key Output Phase 1: Ingestion & Preprocessing Automated data pipeline Clean, normalized 128×128 MRI slices loaded into the ML pipeline Phase 2: Feature Compression CNN + PCA bottleneck module 512D visual representation reduced to 4–8 quantum-compatible parameters; report actual explained variance Phase 3: Quantum Model PennyLane 4-qubit VQC Differentiable parameterized quantum circuit integrated into the ML workflow Phase 4: Training & Inference End-to-end hybrid engine Working workflow predicting ACL Abnormality vs Normal Phase 5: Explainability XAI & visualization module Grad-CAM heatmaps and SHAP/feature attribution Phase 6: Benchmarking Comparative evaluation suite ROC-AUC, Precision, Recall, Specificity, F1 and other measured metrics vs. classical baseline Phase 7: Application & Documentation Full web dashboard + documentation Interactive research web app — study upload, prediction, explanation, experiments, benchmarks, complete technical docs

Do not replace actual measured criteria with fabricated numbers.

12. Final Acceptance Checklist

Auth + RBAC + RLS · DB migrations & indexes · storage buckets · study upload/management/preview · preprocessing workflow · ResNet18 extraction (512D) · PCA/Linear bottleneck (4–8D) · PennyLane VQC + Qiskit Aer adapter (angle encoding, CNOT, shallow configurable circuit) · prediction API + persistence · Grad-CAM + SHAP architecture · training/experiment tracking · classical (ResNet18) + SVM baselines · benchmarking with ROC curves/confusion matrices · dashboard, quantum circuit visualizer, dataset/system/admin pages · audit logs & notifications · Demo Mode with real/simulation/demo distinction everywhere · error/loading/empty states · responsive & accessible UI · security hardening · API/ML/quantum/deployment docs · Dockerized ml-service · .env.example · smoke tests · seed/demo data.

Build the entire project now — frontend, Supabase backend, ML-service architecture, documentation, tests, demo mode, and deployment config — as one coherent system, then self-check for mismatches across routes/endpoints/tables/types/RLS/pipeline config before finishing.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a99ea493-bdd7-4521-9c8d-5318d4a4095a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
