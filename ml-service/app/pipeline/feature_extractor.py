"""ResNet18 feature extractor (512D output, no final FC)."""
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np

_model = None
_transform = None

def _get_model():
    global _model, _transform
    if _model is None:
        base = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        # Remove final FC to get 512D feature vector
        _model = nn.Sequential(*list(base.children())[:-1])
        _model.eval()
        _transform = transforms.Compose([
            transforms.Resize((128, 128)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    return _model, _transform

def extract_features_from_image(pil_image: Image.Image) -> np.ndarray:
    """Extract 512D ResNet18 features from a PIL image."""
    model, transform = _get_model()
    tensor = transform(pil_image).unsqueeze(0)
    with torch.no_grad():
        features = model(tensor)
    return features.squeeze().numpy()  # (512,)

def extract_features_from_paths(file_paths: list) -> np.ndarray:
    """Load images from paths, extract features, return mean-pooled 512D vector."""
    from app.services.dicom_service import load_image_from_path
    all_features = []
    for path in file_paths[:5]:  # max 5 representative slices
        try:
            img = load_image_from_path(str(path))
            if img is not None:
                feat = extract_features_from_image(img)
                all_features.append(feat)
        except Exception as e:
            print(f"Feature extraction error for {path}: {e}")
    if not all_features:
        return np.zeros(512, dtype=np.float32)
    return np.mean(all_features, axis=0)  # (512,)

def get_model_for_gradcam():
    """Return the full ResNet18 model (with FC) for Grad-CAM."""
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    model.fc = nn.Linear(512, 2)  # binary output
    model.eval()
    transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    return model, transform