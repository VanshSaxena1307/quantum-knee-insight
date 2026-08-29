"""DICOM/image loading service. Supports .dcm files and common image formats."""
import os
from pathlib import Path
from PIL import Image
import numpy as np

def load_image_from_path(path: str) -> Image.Image:
    """Load a DICOM or image file and return as grayscale PIL image."""
    path = str(path)
    if path.lower().endswith(".dcm"):
        try:
            import pydicom
            ds = pydicom.dcmread(path, force=True)
            arr = ds.pixel_array.astype(np.float32)
            # Normalize to 0-255
            arr -= arr.min()
            if arr.max() > 0:
                arr = arr / arr.max() * 255.0
            arr = arr.astype(np.uint8)
            # Handle 3D volumes: pick middle slice
            if arr.ndim == 3:
                mid = arr.shape[0] // 2
                arr = arr[mid]
            img = Image.fromarray(arr).convert("RGB")
        except Exception as e:
            print(f"DICOM load error for {path}: {e}")
            img = Image.new("RGB", (128, 128), (128, 128, 128))
    else:
        try:
            img = Image.open(path).convert("RGB")
        except Exception as e:
            print(f"Image load error for {path}: {e}")
            img = Image.new("RGB", (128, 128), (128, 128, 128))
    return img

def select_representative_slices(file_paths: list, max_slices: int = 5) -> list:
    """Select evenly spaced representative slices from a list of file paths."""
    n = len(file_paths)
    if n <= max_slices:
        return file_paths
    indices = np.linspace(0, n - 1, max_slices, dtype=int)
    return [file_paths[i] for i in indices]