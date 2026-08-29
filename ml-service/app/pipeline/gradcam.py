"""Real Grad-CAM from ResNet18 layer4. Saves heatmap, overlay, original as PNG."""
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from pathlib import Path
from app.pipeline.feature_extractor import get_model_for_gradcam

def compute_gradcam(pil_image: Image.Image, output_dir: Path, label_idx: int = 1) -> dict:
    """
    Compute Grad-CAM for a single PIL image using ResNet18 layer4.
    label_idx: 1=abnormal, 0=normal
    Returns dict with paths to saved images.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    model, transform = get_model_for_gradcam()

    # Hook storage
    activations = {}
    gradients = {}

    def forward_hook(module, input, output):
        activations["layer4"] = output.detach()

    def backward_hook(module, grad_input, grad_output):
        gradients["layer4"] = grad_output[0].detach()

    handle_fwd = model.layer4[-1].register_forward_hook(forward_hook)
    handle_bwd = model.layer4[-1].register_full_backward_hook(backward_hook)

    tensor = transform(pil_image).unsqueeze(0)
    tensor.requires_grad_(True)

    output = model(tensor)
    model.zero_grad()
    output[0, label_idx].backward()

    handle_fwd.remove()
    handle_bwd.remove()

    # Grad-CAM computation
    act = activations["layer4"].squeeze()   # (512, H, W)
    grad = gradients["layer4"].squeeze()     # (512, H, W)
    weights = grad.mean(dim=(1, 2))         # (512,) global average pooling of gradients
    cam = torch.relu((weights[:, None, None] * act).sum(dim=0))  # (H, W)
    cam = cam.numpy()
    cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)  # normalize [0,1]

    # Resize to image size
    img_w, img_h = pil_image.size
    cam_resized = np.array(Image.fromarray((cam * 255).astype(np.uint8)).resize((img_w, img_h), Image.BILINEAR)) / 255.0

    # Save original
    orig_path = output_dir / "original.png"
    pil_image.save(orig_path)

    # Save heatmap
    heatmap_arr = (cm.jet(cam_resized)[:, :, :3] * 255).astype(np.uint8)
    heatmap_path = output_dir / "heatmap.png"
    Image.fromarray(heatmap_arr).save(heatmap_path)

    # Save overlay (50/50 blend)
    orig_rgb = pil_image.convert("RGB").resize((img_w, img_h))
    orig_arr = np.array(orig_rgb).astype(np.float32)
    overlay_arr = (0.5 * orig_arr + 0.5 * heatmap_arr).astype(np.uint8)
    overlay_path = output_dir / "overlay.png"
    Image.fromarray(overlay_arr).save(overlay_path)

    return {
        "original": str(orig_path),
        "heatmap": str(heatmap_path),
        "overlay": str(overlay_path),
    }