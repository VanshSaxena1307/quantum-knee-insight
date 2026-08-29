import { useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import api from "../lib/api";

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  }, []);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); };
  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (!files.length) { setError("Please select at least one file"); return; }
    setUploading(true); setError(""); setSuccess("");
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));
      const res = await api.post("/api/studies/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess("Study uploaded! ID: " + res.data.study.id);
      setTimeout(() => navigate("/studies/" + res.data.study.id), 1500);
    } catch (err: any) { setError(err?.response?.data?.error || "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <div><h1 className="text-2xl font-bold text-slate-900">Upload MRI Study</h1><p className="text-slate-500 text-sm mt-1">Upload DICOM files or image files for ACL abnormality analysis</p></div>
        <div className="card p-4 bg-amber-50 border-amber-200 text-sm text-amber-800"><strong>Research prototype only.</strong> Do not upload files containing real patient identifiers.</div>
        <div
          onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          className={"card p-12 text-center border-2 border-dashed cursor-pointer transition-colors " + (dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400")}
        >
          <div className="text-4xl mb-4">+</div>
          <p className="text-slate-700 font-medium">Drop files here</p>
          <p className="text-slate-400 text-sm mt-1">DICOM (.dcm), JPEG, PNG supported</p>
          <label className="mt-4 btn-secondary inline-block cursor-pointer">
            Browse files
            <input type="file" multiple accept=".dcm,.jpg,.jpeg,.png,image/*" onChange={onFileChange} className="sr-only" />
          </label>
        </div>
        {files.length > 0 && (
          <div className="card">
            <div className="p-4 border-b border-slate-200"><h3 className="font-medium">{files.length} file(s) selected</h3></div>
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="text-sm text-slate-700 truncate">{f.name} <span className="text-slate-400">({(f.size / 1024).toFixed(1)} KB)</span></div>
                  <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 ml-2 text-xs">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        {success && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{success}</div>}
        <button onClick={handleUpload} disabled={uploading || !files.length} className="btn-primary">{uploading ? "Uploading..." : "Upload Study"}</button>
      </div>
    </AppLayout>
  );
}