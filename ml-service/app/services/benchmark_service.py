"""Benchmark service: evaluates Classical SVM and Hybrid VQC on held-out data."""
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from app.config import config
import app.pipeline.pca_handler as pca_handler
import app.pipeline.classical_model as classical_model
import app.pipeline.quantum_model as quantum_model

def _compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray, model_name: str, mode: str, model_config: dict) -> dict:
    n = len(y_true)
    try: acc = float(accuracy_score(y_true, y_pred))
    except: acc = None
    try: prec = float(precision_score(y_true, y_pred, zero_division=0))
    except: prec = None
    try: rec = float(recall_score(y_true, y_pred, zero_division=0))
    except: rec = None
    try: f1 = float(f1_score(y_true, y_pred, zero_division=0))
    except: f1 = None
    try:
        if len(np.unique(y_true)) >= 2:
            roc = float(roc_auc_score(y_true, y_prob))
        else:
            roc = None
    except: roc = None
    return {
        "model_name": model_name, "mode": mode, "sample_count": n,
        "accuracy": acc, "precision": prec, "recall": rec, "f1": f1, "roc_auc": roc,
        "model_configuration": model_config,
    }

def run_benchmark(mode: str = "DEMO") -> dict:
    """
    Evaluate classical and quantum models on held-out test data.
    Uses DEMO synthetic data. Returns list of result dicts.
    """
    from app.services.demo_service import generate_demo_features
    # Generate evaluation data (separate from training to avoid leakage)
    X_all, y_all = generate_demo_features(n_samples=80, seed=99)
    _, X_test, _, y_test = train_test_split(X_all, y_all, test_size=0.3, random_state=42, stratify=y_all)

    # PCA transform test data
    if not pca_handler.is_fitted():
        return {"error": "PCA not fitted. Run startup first."}
    X_pca = pca_handler.transform(X_test)  # (N_test, n_components)

    results = []
    model_config = {"pca_components": config.PCA_COMPONENTS, "pca_explained_variance": pca_handler.get_explained_variance()}
    dataset_info = {"source": mode, "test_samples": len(X_test), "note": "Report-derived labels" if mode == "REAL" else "Synthetic DEMO labels - no clinical significance"}

    # --- Classical SVM ---
    if classical_model.is_fitted():
        y_pred_c = []
        y_prob_c = []
        for i in range(len(X_pca)):
            r = classical_model.predict(X_pca[i:i+1])
            y_pred_c.append(1 if r["predicted_class"] == "abnormal" else 0)
            y_prob_c.append(r["abnormal_probability"])
        clf_config = {**model_config, "model": "SVM-RBF", "kernel": "rbf"}
        results.append(_compute_metrics(y_test, np.array(y_pred_c), np.array(y_prob_c), "ClassicalSVM", mode, clf_config))

    # --- Hybrid VQC ---
    if quantum_model.is_trained():
        y_pred_q = []
        y_prob_q = []
        for i in range(min(len(X_pca), 30)):  # cap VQC evaluation (slow on CPU)
            r = quantum_model.predict(X_pca[i:i+1])
            y_pred_q.append(1 if r["predicted_class"] == "abnormal" else 0)
            y_prob_q.append(r["abnormal_probability"])
        y_test_sub = y_test[:len(y_pred_q)]
        vqc_config = {**model_config, "model": "VQC", "qubits": config.QUANTUM_QUBITS, "depth": config.QUANTUM_DEPTH, "backend": "default.qubit (SIMULATION)"}
        results.append(_compute_metrics(y_test_sub, np.array(y_pred_q), np.array(y_prob_q), "HybridVQC", "SIMULATION", vqc_config))

    return {
        "mode": mode, "results": results,
        "dataset_information": dataset_info,
        "model_configuration": model_config,
    }