"""PCA handler: 512D -> n_components. Fitted on training data, persisted."""
import numpy as np
import pickle
from pathlib import Path
from sklearn.decomposition import PCA
from app.config import config

_pca = None

def _pca_path() -> Path:
    return Path(config.MODEL_DIR) / "pca.pkl"

def load_pca() -> bool:
    global _pca
    p = _pca_path()
    if p.exists():
        with open(p, "rb") as f:
            _pca = pickle.load(f)
        return True
    return False

def fit_pca(features: np.ndarray) -> None:
    """Fit PCA on (N, 512) training features."""
    global _pca
    n_comp = min(config.PCA_COMPONENTS, features.shape[0], features.shape[1])
    _pca = PCA(n_components=n_comp, random_state=42)
    _pca.fit(features)
    _pca_path().parent.mkdir(parents=True, exist_ok=True)
    with open(_pca_path(), "wb") as f:
        pickle.dump(_pca, f)

def transform(features: np.ndarray) -> np.ndarray:
    """Transform (N, 512) or (512,) -> (N, n_components)."""
    if _pca is None:
        raise RuntimeError("PCA not fitted. Call fit_pca() first.")
    if features.ndim == 1:
        features = features.reshape(1, -1)
    return _pca.transform(features)

def is_fitted() -> bool:
    return _pca is not None

def get_explained_variance() -> list:
    if _pca is None:
        return []
    return _pca.explained_variance_ratio_.tolist()