"""
HQML ML Service - FastAPI entry point.
Startup: loads or trains PCA + SVM + VQC on demo data if no artifacts exist.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import numpy as np
import os
import shutil
import uuid

from app.config import config
import app.pipeline.pca_handler as pca_handler
import app.pipeline.classical_model as classical_model
import app.pipeline.quantum_model as quantum_model
from app.pipeline.feature_extractor import extract_features_from_paths, extract_features_from_image
from app.services.demo_service import generate_demo_features, generate_demo_image
from app.services.benchmark_service import run_benchmark

@asynccontextmanager
async def lifespan(app: FastAPI):
    """On startup: load or train models."""
    print("HQML ML Service starting...")
    print(f"  Mode: {config.current_mode}")
    print(f"  Qubits: {config.QUANTUM_QUBITS}, Depth: {config.QUANTUM_DEPTH}, PCA: {config.PCA_COMPONENTS}")
    os.makedirs(config.MODEL_DIR, exist_ok=True)
    os.makedirs(config.UPLOAD_DIR, exist_ok=True)

    pca_loaded = pca_handler.load_pca()
    clf_loaded = classical_model.load_classifier()
    vqc_loaded = quantum_model.load_vqc()

    if not pca_loaded or not clf_loaded:
        print("  No saved models found. Training on DEMO data (seed=42)...")
        X, y = generate_demo_features(n_samples=60, seed=42)
        pca_handler.fit_pca(X)
        X_pca = pca_handler.transform(X)
        classical_model.fit_classifier(X_pca, y)
        print(f"  Classical SVM fitted on {len(X)} DEMO samples.")

    if not vqc_loaded:
        print("  Training VQC on DEMO data (30 epochs)...")
        X, y = generate_demo_features(n_samples=40, seed=42)
        X_pca = pca_handler.transform(X)
        result = quantum_model.train_vqc(X_pca, y, epochs=30, lr=0.05)
        print(f"  VQC trained. Final loss: {result['final_loss']:.4f}")

    print("HQML ML Service ready.")
    yield
    print("HQML ML Service shutdown.")

app = FastAPI(title="HQML ML Service", version="1.0.0", lifespan=lifespan)

class PredictRequest(BaseModel):
    study_id: str
    file_paths: list
    model_type: str = "quantum"
    mode: str = "DEMO"

class BenchmarkRequest(BaseModel):
    mode: str = "DEMO"

class ExplainRequest(BaseModel):
    prediction_id: str
    study_id: str
    file_paths: list
    model_type: str = "quantum"

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "hqml-ml",
        "mode": config.current_mode,
        "quantum_backend": "default.qubit (SIMULATION)",
        "qubits": config.QUANTUM_QUBITS,
        "quantum_depth": config.QUANTUM_DEPTH,
        "pca_components": config.PCA_COMPONENTS,
        "model_loaded": True,
        "pca_fitted": pca_handler.is_fitted(),
        "classifier_fitted": classical_model.is_fitted(),
        "vqc_trained": quantum_model.is_trained(),
        "dataset_configured": config.dataset_configured,
    }

@app.post("/predict")
async def predict(req: PredictRequest):
    try:
        # Extract 512D features (mean-pooled across slices)
        features_512d = extract_features_from_paths(req.file_paths)
        # PCA transform
        pca_features = pca_handler.transform(features_512d.reshape(1, -1))[0]

        if req.model_type == "quantum":
            result = quantum_model.predict(pca_features)
            model_name = "HybridVQC"
            model_version = f"1.0-{config.QUANTUM_QUBITS}q-d{config.QUANTUM_DEPTH}"
        else:
            result = classical_model.predict(pca_features)
            model_name = "ClassicalSVM"
            model_version = "1.0-rbf"

        return {
            "model_name": model_name,
            "model_version": model_version,
            "predicted_class": result["predicted_class"],
            "abnormal_probability": result["abnormal_probability"],
            "normal_probability": result["normal_probability"],
            "confidence": result["confidence"],
            "mode": "SIMULATION" if req.model_type == "quantum" else req.mode,
            "raw_output": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain")
async def explain(req: ExplainRequest):
    try:
        from app.pipeline.gradcam import compute_gradcam
        from app.pipeline.attribution import compute_feature_attribution

        # Load first available image
        img = None
        for path in req.file_paths[:3]:
            from app.services.dicom_service import load_image_from_path
            img = load_image_from_path(str(path))
            if img is not None:
                break
        if img is None:
            img = generate_demo_image(128, seed=0)

        # Grad-CAM
        gradcam_dir = Path(config.UPLOAD_DIR) / "explanations" / req.prediction_id
        label_idx = 1  # abnormal class
        gradcam_paths = compute_gradcam(img, gradcam_dir, label_idx=label_idx)

        # Feature attribution
        features_512d = extract_features_from_image(img)
        pca_features = pca_handler.transform(features_512d.reshape(1, -1))[0]

        if req.model_type == "quantum" and quantum_model.is_trained():
            def pred_fn(x): return quantum_model.predict(x)["abnormal_probability"]
        else:
            def pred_fn(x): return classical_model.predict(x)["abnormal_probability"]

        attributions = compute_feature_attribution(pca_features, pred_fn)

        return {
            "prediction_id": req.prediction_id,
            "gradcam": gradcam_paths,
            "attribution": attributions,
            "gradcam_dir": str(gradcam_dir),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/explanations/{prediction_id}/image/{image_type}")
def get_explanation_image(prediction_id: str, image_type: str):
    allowed = {"original", "heatmap", "overlay"}
    if image_type not in allowed:
        raise HTTPException(status_code=400, detail="Invalid image type")
    img_path = Path(config.UPLOAD_DIR) / "explanations" / prediction_id / f"{image_type}.png"
    if not img_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(str(img_path), media_type="image/png")

@app.post("/benchmark")
async def benchmark(req: BenchmarkRequest):
    try:
        result = run_benchmark(mode=req.mode)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))