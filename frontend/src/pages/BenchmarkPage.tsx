import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import api from "../lib/api";
import { formatDate, formatMetric } from "../lib/utils";
import { ModeBadge } from "../components/ui/ModeBadge";
import { DisclaimerBanner } from "../components/ui/DisclaimerBanner";

export default function BenchmarkPage() {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchBenchmarks = () => api.get("/api/benchmarks").then(r => setBenchmarks(r.data)).catch(console.error);
  useEffect(() => { fetchBenchmarks().finally(() => setLoading(false)); }, []);

  const runBenchmark = async () => {
    setRunning(true); setMsg("");
    try { const r = await api.post("/api/benchmarks/run"); setMsg(r.data.message); await fetchBenchmarks(); }
    catch (err: any) { setMsg(err?.response?.data?.error || "Benchmark failed."); }
    finally { setRunning(false); }
  };

  const mc = (v: number | null | undefined) =>
    v === null || v === undefined ? <span className="text-slate-400">-</span> : <span className="font-mono">{formatMetric(v, 3)}</span>;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-slate-900">Research Benchmarking</h1><p className="text-slate-500 text-sm">Classical vs Hybrid Quantum-Classical comparison</p></div>
          <button onClick={runBenchmark} disabled={running} className="btn-primary">{running ? "Running..." : "Run Benchmark"}</button>
        </div>
        <DisclaimerBanner />
        <div className="card p-4 bg-blue-50 border-blue-200 text-sm text-blue-800">
          Metrics are computed from actual model predictions on held-out evaluation data.
          "-" means not yet measured. Sample counts are always displayed.
          Results must not be interpreted as clinically validated performance.
        </div>
        {msg && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{msg}</div>}
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : benchmarks.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500 font-medium">No benchmarks yet</p>
            <p className="text-slate-400 text-sm mt-1">Click "Run Benchmark" to compare classical and quantum models</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>{["Model","Mode","Accuracy","Precision","Recall","F1","ROC-AUC","Samples","Date"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {benchmarks.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{b.model_name}</td>
                      <td className="px-4 py-3"><ModeBadge mode={b.mode} /></td>
                      <td className="px-4 py-3">{mc(b.accuracy)}</td>
                      <td className="px-4 py-3">{mc(b.precision_score)}</td>
                      <td className="px-4 py-3">{mc(b.recall)}</td>
                      <td className="px-4 py-3">{mc(b.f1)}</td>
                      <td className="px-4 py-3">{mc(b.roc_auc)}</td>
                      <td className="px-4 py-3 text-slate-500">{b.sample_count ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}