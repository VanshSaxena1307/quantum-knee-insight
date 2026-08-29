"""Classical SVM classifier with calibrated probabilities."""
import numpy as np
import pickle
from pathlib import Path
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from app.config import config

_clf = None

def _clf_path() -> Path:
    return Path(config.MODEL_DIR) / "classical_svm.pkl"

def load_classifier() -> bool:
    global _clf
    p = _clf_path()
    if p.exists():
        with open(p, "rb") as f:
            _clf = pickle.load(f)
        return True
    return False

def fit_classifier(X: np.ndarray, y: np.ndarray) -> None:
    """Fit SVM on (N, n_components) features, y in {0, 1}."""
    global _clf
    base_svm = SVC(kernel="rbf", C=1.0, gamma="scale", random_state=42)
    # Use cross-val calibration if enough samples, else prefit
    if X.shape[0] >= 10:
        _clf = CalibratedClassifierCV(base_svm, cv=min(3, X.shape[0] // 2))
    else:
        base_svm.fit(X, y)
        _clf = CalibratedClassifierCV(base_svm, cv="prefit")
    _clf.fit(X, y)
    _clf_path().parent.mkdir(parents=True, exist_ok=True)
    with open(_clf_path(), "wb") as f:
        pickle.dump(_clf, f)

def predict(X: np.ndarray) -> dict:
    """Predict from (1, n_components) PCA features. Returns probabilities."""
    if _clf is None:
        raise RuntimeError("Classical classifier not fitted.")
    if X.ndim == 1:
        X = X.reshape(1, -1)
    probs = _clf.predict_proba(X)[0]
    classes = _clf.classes_
    # Map to abnormal/normal
    if len(probs) == 2:
        idx_abn = 1  # assume class 1 = abnormal
        p_abn = float(probs[idx_abn]) if 1 in classes else float(probs[0])
        p_norm = 1.0 - p_abn
    else:
        p_abn = 0.5; p_norm = 0.5
    return {"abnormal_probability": p_abn, "normal_probability": p_norm,
            "predicted_class": "abnormal" if p_abn > 0.5 else "normal",
            "confidence": max(p_abn, p_norm)}

def is_fitted() -> bool:
    return _clf is not None