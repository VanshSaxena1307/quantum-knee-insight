"""
Hybrid Quantum-Classical VQC using PennyLane.
Architecture:
  - Angle encoding of PCA features into qubits (RY gates)
  - Variational layers: RZ + RX + CNOT entangling
  - Output: PauliZ expectation value on qubit 0
  - Training: Parameter-shift rule (quantum-compatible gradients)
  - Loss: MSE (labels mapped +-1)
"""
import numpy as np
import pickle
from pathlib import Path
from typing import Optional
import pennylane as qml
from app.config import config

_weights: Optional[np.ndarray] = None
_dev = None
_circuit = None
_trained = False

def _init_device():
    global _dev, _circuit
    if _dev is None:
        n_qubits = config.QUANTUM_QUBITS
        depth = config.QUANTUM_DEPTH
        _dev = qml.device("default.qubit", wires=n_qubits)

        @qml.qnode(_dev)
        def circuit(inputs, weights):
            # Angle encoding
            for i in range(n_qubits):
                qml.RY(inputs[i % len(inputs)] * np.pi, wires=i)
            # Variational layers
            for d in range(depth):
                for i in range(n_qubits):
                    qml.RZ(weights[d, i, 0], wires=i)
                    qml.RX(weights[d, i, 1], wires=i)
                for i in range(n_qubits - 1):
                    qml.CNOT(wires=[i, i + 1])
            return qml.expval(qml.PauliZ(0))

        _circuit = circuit
    return _dev, _circuit

def _weights_path() -> Path:
    return Path(config.MODEL_DIR) / "vqc_weights.npy"

def load_vqc() -> bool:
    global _weights, _trained
    p = _weights_path()
    if p.exists():
        _weights = np.load(p)
        _trained = True
        return True
    return False

def _parameter_shift_grad(inputs: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """Compute gradients via parameter-shift rule."""
    _, circuit = _init_device()
    grads = np.zeros_like(weights)
    shift = np.pi / 2
    for d in range(weights.shape[0]):
        for i in range(weights.shape[1]):
            for k in range(weights.shape[2]):
                w_plus = weights.copy(); w_plus[d, i, k] += shift
                w_minus = weights.copy(); w_minus[d, i, k] -= shift
                grads[d, i, k] = 0.5 * (circuit(inputs, w_plus) - circuit(inputs, w_minus))
    return grads

def train_vqc(X: np.ndarray, y: np.ndarray, epochs: int = 30, lr: float = 0.05) -> dict:
    """
    Train VQC on (N, n_components) features, y in {0, 1}.
    Labels mapped: 0 -> -1, 1 -> +1 (for PauliZ expectation).
    Returns training history.
    """
    global _weights, _trained
    _init_device()
    n_qubits = config.QUANTUM_QUBITS
    depth = config.QUANTUM_DEPTH
    _, circuit = _init_device()

    # Map labels to +-1
    y_pm = 2 * y.astype(float) - 1.0

    # Initialize weights
    np.random.seed(42)
    weights = np.random.uniform(-np.pi, np.pi, (depth, n_qubits, 2))
    best_weights = weights.copy()
    best_loss = float("inf")
    history = []

    for epoch in range(epochs):
        epoch_loss = 0.0
        # Shuffle
        idx = np.random.permutation(len(X))
        for i in idx:
            x_i = X[i][:n_qubits]  # clip to n_qubits
            y_i = y_pm[i]
            # Forward pass
            pred = circuit(x_i, weights)
            loss = (pred - y_i) ** 2
            epoch_loss += loss
            # Gradient via parameter-shift
            grad = _parameter_shift_grad(x_i, weights)
            # MSE gradient: dL/dpred = 2*(pred - y)
            weights -= lr * 2 * (pred - y_i) * grad
        epoch_loss /= len(X)
        history.append(float(epoch_loss))
        if epoch_loss < best_loss:
            best_loss = epoch_loss
            best_weights = weights.copy()
        if epoch % 10 == 0:
            print(f"  VQC epoch {epoch}: loss={epoch_loss:.4f}")

    _weights = best_weights
    _trained = True
    _weights_path().parent.mkdir(parents=True, exist_ok=True)
    np.save(_weights_path(), _weights)
    return {"epochs": epochs, "final_loss": best_loss, "history": history}

def predict(X: np.ndarray) -> dict:
    """Predict from (1, n_components) or (n_components,) PCA features."""
    if not _trained or _weights is None:
        raise RuntimeError("VQC not trained. Call train_vqc() first.")
    _, circuit = _init_device()
    n_qubits = config.QUANTUM_QUBITS
    if X.ndim > 1:
        X = X[0]
    x_in = X[:n_qubits]  # clip to n_qubits

    raw = float(circuit(x_in, _weights))  # in [-1, 1]
    # Map PauliZ output to probability: p_abn = (raw + 1) / 2
    p_abn = (raw + 1.0) / 2.0
    p_norm = 1.0 - p_abn
    return {
        "abnormal_probability": p_abn, "normal_probability": p_norm,
        "predicted_class": "abnormal" if p_abn > 0.5 else "normal",
        "confidence": max(p_abn, p_norm),
        "raw_circuit_output": raw,
        "quantum_backend": "default.qubit (SIMULATION)",
    }

def is_trained() -> bool:
    return _trained