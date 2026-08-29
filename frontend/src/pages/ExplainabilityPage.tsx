import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import api from "../lib/api";
import { DisclaimerBanner } from "../components/ui/DisclaimerBanner";
import { ModeBadge } from "../components/ui/ModeBadge";
import { formatPercent } from "../lib/utils";

export default function ExplainabilityPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get("/api/explanations/" + id + "/explain")
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.status === 404 ? "No explanation yet. Click below to generate." : "Failed to load explanation."))
      .finally(() => setLoading(false));
  }, [id]);

  const generate = async () => {
    setGenerating(true); setError("");
    try { const r = await api.post("/api/explanations/" + id + "/explain"); setData(r.data); }
    catch (err: any) { setError(err?.response?.data?.error || "Failed to generate explanation."); }
    finally { setGenerating(false); }
  };

  if (loading) return <AppLayout><div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <div><h1 className="text-2xl font-bold text-slate-900">Explainability Analysis</h1><p className="text-slate-500 text-sm mt-1">Model attention and feature attribution</p></div>
        <DisclaimerBanner />
        <div className="card p-4 bg-blue-50 border-blue-200 text-sm text-blue-800">
          These visualizations describe model behavior and do not establish medical causality or diagnosis.
          Grad-CAM highlights areas of high model activation, not confirmed anatomical findings.
        </div>

        {error && !data && (
          <div className="card p-8 text-center">
            <p className="text-slate-500 mb-4">{error}</p>
            <button onClick={generate} disabled={generating} className="btn-primary">{generating ? "Generating..." : "Generate Explanation"}</button>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {data.prediction && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Prediction</h2><ModeBadge mode={data.prediction.mode} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-xs text-slate-500">Result</div><div className={"font-bold " + (data.prediction.predicted_class === "abnormal" ? "text-red-600" : "text-emerald-600")}>{data.prediction.predicted_class === "abnormal" ? "ACL Abnormality" : "Normal"}</div></div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-xs text-slate-500">p(abnormal)</div><div className="font-bold font-mono">{formatPercent(data.prediction.abnormal_probability)}</div></div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-xs text-slate-500">Model</div><div className="font-medium text-sm">{data.prediction.model_name}</div></div>
                </div>
              </div>
            )}

            {data.explanation?.gradcam_reference && (
              <div className="card p-5">
                <h2 className="font-semibold mb-2">Grad-CAM Visualization</h2>
                <p className="text-xs text-slate-500 mb-4">Gradient-weighted Class Activation Map from ResNet18 layer4. Highlights model activation regions. Reflects model attention, not anatomical ground truth.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.explanation.gradcam_reference.original && <div className="text-center"><p className="text-xs text-slate-500 mb-2">Original MRI Slice</p><img src={"/api/explanations/" + data.explanation.id + "/image/original"} alt="Original MRI" className="w-full rounded-lg border border-slate-200" /></div>}
                  {data.explanation.gradcam_reference.heatmap && <div className="text-center"><p className="text-xs text-slate-500 mb-2">Grad-CAM Heatmap</p><img src={"/api/explanations/" + data.explanation.id + "/image/heatmap"} alt="Grad-CAM" className="w-full rounded-lg border border-slate-200" /></div>}
                  {data.explanation.gradcam_reference.overlay && <div className="text-center"><p className="text-xs text-slate-500 mb-2">Overlay</p><img src={"/api/explanations/" + data.explanation.id + "/image/overlay"} alt="Overlay" className="w-full rounded-lg border border-slate-200" /></div>}
                </div>
              </div>
            )}

            {data.explanation?.attribution_data && Array.isArray(data.explanation.attribution_data) && (
              <div className="card p-5">
                <h2 className="font-semibold mb-2">PCA Feature Attribution</h2>
                <p className="text-xs text-slate-500 mb-4">Sensitivity-based attribution for PCA features input to the classifier.</p>
                <div className="space-y-3">
                  {data.explanation.attribution_data.map((f: any, i: number) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 font-mono">PC{i + 1}</span>
                        <span className={"font-mono font-medium " + (f.attribution > 0 ? "text-red-600" : "text-blue-600")}>{f.attribution >= 0 ? "+" : ""}{f.attribution.toFixed(4)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={"h-full rounded-full " + (f.attribution > 0 ? "bg-red-500" : "bg-blue-500")} style={{ width: Math.min(100, Math.abs(f.attribution) * 200) + "%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}