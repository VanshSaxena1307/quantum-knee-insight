-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('researcher','research_lead','admin');
CREATE TYPE public.result_mode AS ENUM ('real','simulation','demo');
CREATE TYPE public.run_status AS ENUM ('pending','queued','running','completed','failed');
CREATE TYPE public.experiment_status AS ENUM ('draft','queued','running','completed','failed');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES + ROLES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  institution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_lead_or_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('research_lead','admin'));
$$;

CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "roles readable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_user BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, institution)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'institution')
  ON CONFLICT (id) DO NOTHING;
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO first_user;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN first_user THEN 'admin'::public.app_role ELSE 'researcher'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ DATASETS ============
CREATE TABLE public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source TEXT,
  source_url TEXT,
  version TEXT,
  modality TEXT DEFAULT 'MRI',
  total_studies INTEGER,
  label_schema JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'research_reference_dataset',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_datasets_created_by ON public.datasets(created_by);
CREATE INDEX idx_datasets_status ON public.datasets(status);
CREATE INDEX idx_datasets_created_at ON public.datasets(created_at DESC);

-- ============ STUDIES ============
CREATE TABLE public.studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_reference TEXT NOT NULL,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
  study_uid TEXT,
  modality TEXT DEFAULT 'MRI',
  body_part TEXT DEFAULT 'KNEE',
  acquisition_date DATE,
  status TEXT NOT NULL DEFAULT 'uploaded',
  file_count INTEGER NOT NULL DEFAULT 0,
  preprocessing_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  mode public.result_mode NOT NULL DEFAULT 'real',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_studies_created_by ON public.studies(created_by);
CREATE INDEX idx_studies_status ON public.studies(status);
CREATE INDEX idx_studies_created_at ON public.studies(created_at DESC);
CREATE INDEX idx_studies_dataset_id ON public.studies(dataset_id);

CREATE TABLE public.study_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  file_type TEXT,
  checksum TEXT,
  upload_status TEXT NOT NULL DEFAULT 'uploaded',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_study_files_study_id ON public.study_files(study_id);
CREATE INDEX idx_study_files_created_by ON public.study_files(created_by);

CREATE TABLE public.preprocessing_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  run_id TEXT,
  input_format TEXT,
  target_size TEXT NOT NULL DEFAULT '128x128',
  normalization_method TEXT DEFAULT 'z-score',
  slices_processed INTEGER,
  selected_slices JSONB,
  status public.run_status NOT NULL DEFAULT 'pending',
  processing_time_ms INTEGER,
  error_message TEXT,
  mode public.result_mode NOT NULL DEFAULT 'real',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_preproc_study_id ON public.preprocessing_runs(study_id);
CREATE INDEX idx_preproc_status ON public.preprocessing_runs(status);
CREATE INDEX idx_preproc_created_by ON public.preprocessing_runs(created_by);

CREATE TABLE public.feature_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  preprocessing_run_id UUID REFERENCES public.preprocessing_runs(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL DEFAULT 'ResNet18',
  model_version TEXT,
  feature_dimension INTEGER NOT NULL DEFAULT 512,
  embedding_path TEXT,
  extraction_time_ms INTEGER,
  mode public.result_mode NOT NULL DEFAULT 'real',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_featext_study_id ON public.feature_extractions(study_id);
CREATE INDEX idx_featext_created_by ON public.feature_extractions(created_by);

CREATE TABLE public.feature_compressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_extraction_id UUID NOT NULL REFERENCES public.feature_extractions(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'PCA',
  input_dimension INTEGER NOT NULL DEFAULT 512,
  output_dimension INTEGER NOT NULL DEFAULT 4,
  explained_variance REAL,
  parameters JSONB DEFAULT '{}'::jsonb,
  mode public.result_mode NOT NULL DEFAULT 'real',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_featcomp_extraction_id ON public.feature_compressions(feature_extraction_id);
CREATE INDEX idx_featcomp_created_by ON public.feature_compressions(created_by);

-- ============ QUANTUM MODELS ============
CREATE TABLE public.quantum_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model_type TEXT NOT NULL DEFAULT 'hybrid',
  framework TEXT NOT NULL DEFAULT 'PennyLane',
  simulator TEXT NOT NULL DEFAULT 'default.qubit',
  qubit_count INTEGER NOT NULL DEFAULT 4,
  circuit_depth INTEGER NOT NULL DEFAULT 2,
  encoding_method TEXT NOT NULL DEFAULT 'Angle',
  entanglement_method TEXT NOT NULL DEFAULT 'CNOT',
  optimizer TEXT NOT NULL DEFAULT 'Adam',
  learning_rate REAL NOT NULL DEFAULT 0.01,
  epochs INTEGER NOT NULL DEFAULT 30,
  batch_size INTEGER NOT NULL DEFAULT 16,
  status TEXT NOT NULL DEFAULT 'configured',
  version TEXT NOT NULL DEFAULT 'v0.1.0',
  mode public.result_mode NOT NULL DEFAULT 'real',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qmodels_created_by ON public.quantum_models(created_by);
CREATE INDEX idx_qmodels_status ON public.quantum_models(status);
CREATE INDEX idx_qmodels_created_at ON public.quantum_models(created_at DESC);

-- ============ EXPERIMENTS / TRAINING ============
CREATE TABLE public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
  task TEXT NOT NULL DEFAULT 'ACL Abnormality vs Normal',
  classical_model TEXT,
  quantum_model UUID REFERENCES public.quantum_models(id) ON DELETE SET NULL,
  status public.experiment_status NOT NULL DEFAULT 'draft',
  configuration_json JSONB DEFAULT '{}'::jsonb,
  mode public.result_mode NOT NULL DEFAULT 'real',
  created_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_experiments_created_by ON public.experiments(created_by);
CREATE INDEX idx_experiments_status ON public.experiments(status);
CREATE INDEX idx_experiments_created_at ON public.experiments(created_at DESC);

CREATE TABLE public.training_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.quantum_models(id) ON DELETE SET NULL,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
  experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
  run_name TEXT NOT NULL,
  model_type TEXT NOT NULL DEFAULT 'hybrid',
  train_samples INTEGER,
  val_samples INTEGER,
  test_samples INTEGER,
  epochs INTEGER,
  batch_size INTEGER,
  learning_rate REAL,
  seed INTEGER,
  dataset_version TEXT,
  reproducibility_json JSONB DEFAULT '{}'::jsonb,
  training_time_ms INTEGER,
  status public.run_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metrics_json JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  mode public.result_mode NOT NULL DEFAULT 'real',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_training_status ON public.training_runs(status);
CREATE INDEX idx_training_created_by ON public.training_runs(created_by);
CREATE INDEX idx_training_model_id ON public.training_runs(model_id);
CREATE INDEX idx_training_experiment_id ON public.training_runs(experiment_id);
CREATE INDEX idx_training_created_at ON public.training_runs(created_at DESC);

-- ============ PREDICTIONS / EXPLANATIONS / BENCHMARKS ============
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.quantum_models(id) ON DELETE SET NULL,
  training_run_id UUID REFERENCES public.training_runs(id) ON DELETE SET NULL,
  predicted_class TEXT NOT NULL,
  abnormal_probability REAL NOT NULL,
  normal_probability REAL NOT NULL,
  confidence REAL,
  inference_time_ms INTEGER,
  model_version TEXT,
  mode public.result_mode NOT NULL DEFAULT 'real',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_predictions_study_id ON public.predictions(study_id);
CREATE INDEX idx_predictions_created_by ON public.predictions(created_by);
CREATE INDEX idx_predictions_created_at ON public.predictions(created_at DESC);

CREATE TABLE public.explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  heatmap_path TEXT,
  attribution_json JSONB,
  feature_importance_json JSONB,
  explanation_summary TEXT,
  mode public.result_mode NOT NULL DEFAULT 'real',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_explanations_prediction_id ON public.explanations(prediction_id);
CREATE INDEX idx_explanations_created_by ON public.explanations(created_by);

CREATE TABLE public.benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES public.experiments(id) ON DELETE CASCADE,
  training_run_id UUID REFERENCES public.training_runs(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL,
  accuracy REAL, precision_score REAL, recall REAL, specificity REAL,
  f1_score REAL, roc_auc REAL,
  confusion_matrix JSONB, roc_curve JSONB,
  inference_time_ms INTEGER, training_time_ms INTEGER,
  mode public.result_mode NOT NULL DEFAULT 'real',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_benchmarks_experiment_id ON public.benchmarks(experiment_id);
CREATE INDEX idx_benchmarks_created_by ON public.benchmarks(created_by);
CREATE INDEX idx_benchmarks_created_at ON public.benchmarks(created_at DESC);

-- ============ AUDIT + SETTINGS ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_user_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_created_at ON public.audit_logs(created_at DESC);

CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['datasets','studies','study_files','preprocessing_runs','feature_extractions',
    'feature_compressions','quantum_models','experiments','training_runs','predictions','explanations','benchmarks']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "read for authenticated" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "insert own" ON public.%I FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid())', t);
    EXECUTE format('CREATE POLICY "update own or lead" ON public.%I FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_lead_or_admin(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "delete own or admin" ON public.%I FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(),''admin''))', t);
  END LOOP;
END $$;

CREATE TRIGGER trg_datasets_upd BEFORE UPDATE ON public.datasets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_studies_upd BEFORE UPDATE ON public.studies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_qmodels_upd BEFORE UPDATE ON public.quantum_models FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_experiments_upd BEFORE UPDATE ON public.experiments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_training_upd BEFORE UPDATE ON public.training_runs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "insert own audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read public settings" ON public.system_settings FOR SELECT TO authenticated
  USING (is_public OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write settings" ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ STORAGE POLICIES (buckets are private; access via signed URLs) ============
CREATE POLICY "hqml read buckets" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('mri-studies','preprocessed-images','embeddings','explanations','model-artifacts'));
CREATE POLICY "hqml upload buckets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('mri-studies','preprocessed-images','embeddings','explanations','model-artifacts')
    AND owner = auth.uid());
CREATE POLICY "hqml delete own objects" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('mri-studies','preprocessed-images','embeddings','explanations','model-artifacts')
    AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin')));

-- ============ SEED ============
INSERT INTO public.datasets (id, name, description, source, source_url, version, modality, total_studies, label_schema, status)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'RSNA Knee Abnormality Detection Dataset',
  'Reference-only research dataset. Raw imaging data is NOT bundled with this application; it must be obtained directly from the source under its own licence terms. The dataset supports 12 abnormality labels; the currently implemented prototype task is binary ACL Abnormality vs Normal.',
  'RSNA (Kaggle competition)',
  'https://www.kaggle.com/competitions/rsna-knee-abnormality-detection/data',
  'competition-2024', 'MRI', NULL,
  '{"dataset_capability":{"label_count":12,"note":"12 abnormality labels are available in the source dataset"},"implemented_prototype":{"task":"ACL Abnormality vs Normal","label_count":2,"labels":["Normal","ACL Abnormality"]},"multi_label":"future work - not implemented"}'::jsonb,
  'research_reference_dataset'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.system_settings (key, value, description, is_public) VALUES
  ('ml_service_url', '{"value":"http://localhost:8000"}', 'Base URL of the FastAPI ML service', true),
  ('default_model', '{"value":"hybrid-vqc-4q"}', 'Default model used for inference', true),
  ('default_simulator', '{"value":"default.qubit"}', 'Default quantum simulator backend', true),
  ('default_qubits', '{"value":4}', 'Default qubit count', true),
  ('default_feature_dimension', '{"value":512}', 'Feature extractor output dimension', true),
  ('max_upload_size_mb', '{"value":256}', 'Maximum upload size per file (MB)', true),
  ('allowed_file_types', '{"value":[".dcm",".dicom",".zip",".nii",".nii.gz"]}', 'Allowed upload extensions', true),
  ('demo_mode', '{"value":true}', 'When true the app serves clearly-labelled demo records instead of live ML output', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.quantum_models (id, name, framework, simulator, qubit_count, circuit_depth, encoding_method, entanglement_method, optimizer, learning_rate, epochs, batch_size, status, version, mode)
VALUES
 ('22222222-2222-4222-8222-222222222201','DEMO Hybrid VQC-4Q','PennyLane','default.qubit',4,2,'Angle','CNOT','Adam',0.01,30,16,'trained','demo-v0.1.0','demo'),
 ('22222222-2222-4222-8222-222222222202','DEMO Hybrid VQC-6Q','PennyLane','default.qubit',6,3,'Angle','CNOT','Adam',0.005,40,16,'trained','demo-v0.1.0','demo'),
 ('22222222-2222-4222-8222-222222222203','DEMO Hybrid VQC-4Q (Qiskit Aer)','Qiskit','aer_simulator',4,2,'Angle','CNOT','SPSA',0.02,25,16,'configured','demo-v0.1.0','demo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.studies (id, patient_reference, dataset_id, study_uid, modality, body_part, acquisition_date, status, file_count, preprocessing_status, notes, mode)
VALUES
 ('33333333-3333-4333-8333-333333333301','DEMO-STUDY-0001','11111111-1111-4111-8111-111111111111','1.2.826.0.1.DEMO.0001','MRI','KNEE','2025-11-04','processed',24,'completed','Synthetic demo study - not real patient data.','demo'),
 ('33333333-3333-4333-8333-333333333302','DEMO-STUDY-0002','11111111-1111-4111-8111-111111111111','1.2.826.0.1.DEMO.0002','MRI','KNEE','2025-12-12','processed',31,'completed','Synthetic demo study - not real patient data.','demo'),
 ('33333333-3333-4333-8333-333333333303','DEMO-STUDY-0003','11111111-1111-4111-8111-111111111111','1.2.826.0.1.DEMO.0003','MRI','KNEE','2026-01-19','uploaded',18,'pending','Synthetic demo study - not real patient data.','demo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.preprocessing_runs (study_id, run_id, input_format, target_size, normalization_method, slices_processed, selected_slices, status, processing_time_ms, mode)
VALUES
 ('33333333-3333-4333-8333-333333333301','demo-pre-0001','DICOM','128x128','z-score',24,'[9,10,11,12,13]'::jsonb,'completed',1840,'demo'),
 ('33333333-3333-4333-8333-333333333302','demo-pre-0002','DICOM','128x128','z-score',31,'[12,13,14,15,16]'::jsonb,'completed',2210,'demo');

INSERT INTO public.predictions (id, study_id, model_id, predicted_class, abnormal_probability, normal_probability, confidence, inference_time_ms, model_version, mode)
VALUES
 ('44444444-4444-4444-8444-444444444401','33333333-3333-4333-8333-333333333301','22222222-2222-4222-8222-222222222201','ACL Abnormality',0.78,0.22,0.78,412,'demo-v0.1.0','demo'),
 ('44444444-4444-4444-8444-444444444402','33333333-3333-4333-8333-333333333302','22222222-2222-4222-8222-222222222201','Normal',0.31,0.69,0.69,389,'demo-v0.1.0','demo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.explanations (prediction_id, method, feature_importance_json, explanation_summary, mode)
VALUES
 ('44444444-4444-4444-8444-444444444401','SHAP','{"features":[{"name":"q0 (PC1)","value":0.31},{"name":"q1 (PC2)","value":-0.18},{"name":"q2 (PC3)","value":0.12},{"name":"q3 (PC4)","value":0.07}]}'::jsonb,'DEMO attribution values. Highlighted regions indicate image areas contributing to the model prediction. They are not a clinical interpretation.','demo'),
 ('44444444-4444-4444-8444-444444444401','Grad-CAM','{"features":[]}'::jsonb,'DEMO heatmap placeholder - no real scan attached.','demo');

INSERT INTO public.experiments (id, name, description, dataset_id, task, classical_model, quantum_model, status, configuration_json, mode, completed_at)
VALUES
 ('55555555-5555-4555-8555-555555555501','DEMO Benchmark: Hybrid VQC-4Q vs ResNet18 / SVM','Clearly-labelled demo experiment used to exercise the benchmarking UI without a live ML backend.','11111111-1111-4111-8111-111111111111','ACL Abnormality vs Normal','ResNet18 + Linear head','22222222-2222-4222-8222-222222222201','completed','{"seed":42,"compression":"PCA","output_dimension":4,"epochs":30,"simulator":"default.qubit"}'::jsonb,'demo', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.benchmarks (experiment_id, model_name, model_type, accuracy, precision_score, recall, specificity, f1_score, roc_auc, confusion_matrix, inference_time_ms, training_time_ms, mode)
VALUES
 ('55555555-5555-4555-8555-555555555501','ResNet18 (classical baseline)','classical',0.842,0.831,0.856,0.828,0.843,0.897,'{"tp":72,"fp":15,"tn":68,"fn":12}'::jsonb,38,412000,'demo'),
 ('55555555-5555-4555-8555-555555555501','SVM on PCA(4) features','classical',0.769,0.755,0.783,0.756,0.769,0.821,'{"tp":66,"fp":21,"tn":62,"fn":18}'::jsonb,9,18000,'demo'),
 ('55555555-5555-4555-8555-555555555501','Hybrid VQC-4Q (PennyLane)','hybrid',0.811,0.798,0.822,0.801,0.810,0.869,'{"tp":69,"fp":17,"tn":65,"fn":15}'::jsonb,412,986000,'demo');

INSERT INTO public.training_runs (model_id, dataset_id, experiment_id, run_name, model_type, train_samples, val_samples, test_samples, epochs, batch_size, learning_rate, seed, dataset_version, status, started_at, completed_at, training_time_ms, metrics_json, reproducibility_json, mode)
VALUES
 ('22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111111','55555555-5555-4555-8555-555555555501','DEMO run: hybrid-vqc-4q','hybrid',600,120,167,30,16,0.01,42,'competition-2024','completed', now() - interval '2 days', now() - interval '2 days' + interval '16 minutes', 986000,
  '{"epochs":[{"epoch":1,"loss":0.691,"accuracy":0.532,"val_loss":0.684,"val_accuracy":0.549},{"epoch":5,"loss":0.612,"accuracy":0.651,"val_loss":0.629,"val_accuracy":0.634},{"epoch":10,"loss":0.548,"accuracy":0.712,"val_loss":0.571,"val_accuracy":0.698},{"epoch":15,"loss":0.497,"accuracy":0.759,"val_loss":0.534,"val_accuracy":0.742},{"epoch":20,"loss":0.462,"accuracy":0.787,"val_loss":0.512,"val_accuracy":0.769},{"epoch":25,"loss":0.441,"accuracy":0.803,"val_loss":0.501,"val_accuracy":0.784},{"epoch":30,"loss":0.428,"accuracy":0.814,"val_loss":0.496,"val_accuracy":0.791}]}'::jsonb,
  '{"seed":42,"dataset_version":"competition-2024","preprocessing":{"target_size":"128x128","normalization":"z-score"},"feature_extractor":"ResNet18","compression":{"method":"PCA","output_dimension":4},"quantum":{"framework":"PennyLane","simulator":"default.qubit","qubits":4,"depth":2,"encoding":"Angle","entanglement":"CNOT"},"optimizer":"Adam","learning_rate":0.01,"epochs":30,"batch_size":16,"model_version":"demo-v0.1.0"}'::jsonb,
  'demo');