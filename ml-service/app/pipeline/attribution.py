"""Sensitivity/perturbation-based feature attribution for PCA features."""
import numpy as np
from typing import Callable

def compute_feature_attribution(
    pca_features: np.ndarray,
    predict_fn: Callable[[np.ndarray], float],
    n_perturbations: int = 50,
    noise_std: float = 0.1,
) -> list:
    """
    Sensitivity analysis: perturb each PCA feature and measure change in abnormal probability.
    Returns list of {feature_idx, attribution} dicts.
    """
    x = pca_features.reshape(-1)
    n = len(x)
    baseline_prob = predict_fn(x)
    attributions = []

    for i in range(n):
        delta_scores = []
        for _ in range(n_perturbations):
            x_perturbed = x.copy()
            x_perturbed[i] += np.random.normal(0, noise_std)
            perturbed_prob = predict_fn(x_perturbed)
            delta_scores.append(perturbed_prob - baseline_prob)
        # Mean sensitivity
        mean_sensitivity = float(np.mean(delta_scores))
        attributions.append({
            "feature_idx": i,
            "attribution": mean_sensitivity,
            "abs_attribution": abs(mean_sensitivity),
        })

    return sorted(attributions, key=lambda a: a["abs_attribution"], reverse=True)