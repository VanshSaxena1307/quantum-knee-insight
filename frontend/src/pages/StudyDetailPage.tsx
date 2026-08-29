import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import api from "../lib/api";
import { formatDate, formatPercent } from "../lib/utils";
import { ModeBadge } from "../components/ui/ModeBadge";
import { DisclaimerBanner } from "../components/ui/DisclaimerBanner";

export default function StudyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [study, setStudy] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predError, setPredError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/api/studies/" + id), api.get("/api/studies/" + id + "/predictions")])
      .then(([s, p]) => { setStudy(s.data); setPredictions(p.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const runPrediction = async (model_type: "classical" | "quantum") => {
    setPredicting(true); setPredError("");
    try {
      const res = await api.post("/api/studies/" + id + "/predict", { model_type });
      setPredictions(prev => [res.data.prediction, ...prev]);
    } catch (err: any) { setPredError(err?.response?.data?.error || "Prediction failed"); }
    finally { setPredicting(false); }
  };

  if (loading) return <AppLayout><div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div></AppLayout>;
  if (!study) return <AppLayout><div className="p-8 text-center text-slate-500">Study not found.</div></AppLayout>;

  const statusColor = (s: string) => s === "ready" ? "bg-emerald-100 text-emerald-700" : s === "processing" ? "bg-blue-100 text-blue-700" : s === "error" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600";

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{study.original_filename || ("Study #" + study.id)}</h1>
              <ModeBadge mode={study.mode || "DEMO"} />
            </div>
            <div className="text-xs text-slate-400 font-mono">{study.study_instance_uid}</div>
          </div>
          <span className={"px-3 py-1 rounded-full text-sm font-medium " + statusColor(study.status)}>{study.status}</span>
        </div>

        <DisclaimerBanner />

        <div className="card p-6 grid grid-cols-2 gap-4">
          <div><div className="text-xs text-slate-500 mb-1">Uploaded</div><div className="text-sm font-medium">{formatDate(study.created_at)}</div></div>
          <div><div className="text-xs text-slate-500 mb-1">Dataset Label</div><div className="text-sm font-medium">{study.label !== null && study.label !== undefined ? (study.label ? "ACL Abnormality (dataset label)" : "Normal (dataset label)") : "No label available"}</div></div>
          <div><div className="text-xs text-slate-500 mb-1">Label Source</div><div className="text-sm font-medium">{study.label_source || "-"}</div></div>
          <div><div className="text-xs text-slate-500 mb-1">Execution Mode</div><ModeBadge mode={study.mode || "DEMO"} /></div>
        </div>

        {study.status === "ready" && (
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-2">Run ACL Abnormality Prediction</h2>
            <p className="text-sm text-slate-500 mb-4">Run the ML pipeline to predict ACL abnormality from this study data.</p>
            {predError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{predError}</div>}
            <div className="flex gap-3">
              <button onClick={() => runPrediction("classical")} disabled={predicting} className="btn-secondary">{predicting ? "Running..." : "Classical SVM"}</button>
              <button onClick={() => runPrediction("quantum")} disabled={predicting} className="btn-primary">{predicting ? "Running..." : "Hybrid Quantum-Classical"}</button>
            </div>
          </div>
        )}

        {predictions.length > 0 && (
          <div className="card">
            <div className="p-5 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Prediction Results</h2>
              <p className="text-xs text-slate-500 mt-1">Research/decision-support output only - not a medical diagnosis</p>
            </div>
            <div className="divide-y divide-slate-100">
              {predictions.map(pred => (
                <div key={pred.id} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className={"text-lg font-bold " + (pred.predicted_class === "abnormal" ? "text-red-600" : "text-emerald-600")}>
                        {pred.predicted_class === "abnormal" ? "ACL Abnormality Predicted" : "No ACL Abnormality Predicted"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{pred.model_name} v{pred.model_version} - {formatDate(pred.created_at)}</div>
                    </div>
                    <ModeBadge mode={pred.mode} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-xs text-slate-500">p(abnormal)</div><div className="text-xl font-bold font-mono text-slate-900">{formatPercent(pred.abnormal_probability)}</div></div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-xs text-slate-500">p(normal)</div><div className="text-xl font-bold font-mono text-slate-900">{formatPercent(pred.normal_probability)}</div></div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-xs text-slate-500">Confidence</div><div className="text-xl font-bold font-mono text-slate-900">{formatPercent(pred.confidence)}</div></div>
                  </div>
                  <Link to={"/predictions/" + pred.id + "/explain"} className="btn-secondary text-sm">View Explainability</Link>
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-lg"><p className="text-xs text-amber-700">Model prediction only - not a medical diagnosis</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}