"""Image forensics feature extraction and localization engine."""

import io
import math
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image, ImageChops, ImageEnhance, ImageFilter

class ImageForensicsExtractor:
    """Extracts low-level physical and compression features from document images."""

    def __init__(self, ela_quality: int = 90, max_dimension: int = 2048):
        self.ela_quality = ela_quality
        self.max_dimension = max_dimension

    def _load_image(self, image_input: Union[str, Path, bytes, Image.Image]) -> Image.Image:
        """Load and normalize PIL Image to RGB."""
        if isinstance(image_input, (str, Path)):
            img = Image.open(str(image_input))
        elif isinstance(image_input, bytes):
            img = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            img = image_input
        else:
            raise TypeError("Unsupported image input type")

        if img.mode != "RGB":
            img = img.convert("RGB")

        # Resize if oversized
        w, h = img.size
        if max(w, h) > self.max_dimension:
            scale = self.max_dimension / max(w, h)
            new_w = max(1, int(w * scale))
            new_h = max(1, int(h * scale))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        return img

    def compute_ela_image(self, img: Image.Image) -> Image.Image:
        """Perform Error Level Analysis (ELA) by recompressing at a fixed quality."""
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=self.ela_quality)
        buffer.seek(0)
        recompressed = Image.open(buffer).convert("RGB")

        # Compute difference
        diff = ImageChops.difference(img, recompressed)
        
        # Scale for enhanced visual contrast
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema]) if extrema else 1
        scale = 255.0 / max(max_diff, 1)
        enhancer = ImageEnhance.Brightness(diff)
        ela_img = enhancer.enhance(scale * 0.5)
        return ela_img

    def extract_features(self, image_input: Union[str, Path, bytes, Image.Image]) -> Dict[str, float]:
        """Extract a deterministic 10-dimensional forensic feature vector."""
        img = self._load_image(image_input)
        w, h = img.size
        aspect_ratio = round(w / max(h, 1), 4)

        img_arr = np.asarray(img, dtype=np.float32)

        # 1. Color Channel Variance & Ratio
        r_mean = float(np.mean(img_arr[:, :, 0]))
        g_mean = float(np.mean(img_arr[:, :, 1]))
        b_mean = float(np.mean(img_arr[:, :, 2]))
        r_var = float(np.var(img_arr[:, :, 0]))
        g_var = float(np.var(img_arr[:, :, 1]))
        b_var = float(np.var(img_arr[:, :, 2]))
        color_ratio = round((r_var + 1e-5) / (b_var + 1e-5), 4)

        # 2. Laplacian Sharpness (Edge Variance)
        gray = img.convert("L")
        gray_arr = np.asarray(gray, dtype=np.float32)
        # Compute discrete Laplacian convolution via numpy
        lap = (
            np.roll(gray_arr, 1, axis=0) +
            np.roll(gray_arr, -1, axis=0) +
            np.roll(gray_arr, 1, axis=1) +
            np.roll(gray_arr, -1, axis=1) -
            4 * gray_arr
        )
        laplacian_var = float(np.var(lap[1:-1, 1:-1]))

        # 3. Noise SNR estimation
        # Filter high frequencies with Gaussian blur
        blurred = gray.filter(ImageFilter.GaussianBlur(radius=1))
        blurred_arr = np.asarray(blurred, dtype=np.float32)
        noise_arr = gray_arr - blurred_arr
        noise_var = float(np.var(noise_arr))
        signal_var = float(np.var(gray_arr))
        snr_db = round(10.0 * math.log10(max(signal_var, 1e-5) / max(noise_var, 1e-5)), 2)

        # 4. Error Level Analysis (ELA) Statistics
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=self.ela_quality)
        buffer.seek(0)
        recompressed = Image.open(buffer).convert("RGB")
        recomp_arr = np.asarray(recompressed, dtype=np.float32)
        diff_arr = np.abs(img_arr - recomp_arr)
        
        ela_mean = float(np.mean(diff_arr))
        ela_max = float(np.max(diff_arr))
        ela_std = float(np.std(diff_arr))
        ela_p95 = float(np.percentile(diff_arr, 95))

        # 5. Edge Density
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_arr = np.asarray(edges, dtype=np.float32)
        edge_density = float(np.mean(edge_arr > 50))

        # 6. Resampling Inconsistency Indicator
        resampling_score = round(abs(1.0 - (laplacian_var / max(noise_var * 50.0, 1.0))), 4)

        return {
            "aspect_ratio": aspect_ratio,
            "color_channel_var_ratio": color_ratio,
            "blur_laplacian_var": round(laplacian_var, 2),
            "noise_snr_db": snr_db,
            "ela_mean_diff": round(ela_mean, 4),
            "ela_max_diff": round(ela_max, 4),
            "ela_std_diff": round(ela_std, 4),
            "ela_p95_diff": round(ela_p95, 4),
            "edge_density": round(edge_density, 4),
            "resampling_indicator": min(max(resampling_score, 0.0), 10.0),
        }

    def localize_tampering(
        self,
        image_input: Union[str, Path, bytes, Image.Image],
        threshold_multiplier: float = 2.5
    ) -> Dict[str, Any]:
        """Generate pixel-level tampering candidate mask and bounding boxes."""
        img = self._load_image(image_input)
        w, h = img.size
        img_arr = np.asarray(img, dtype=np.float32)

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=self.ela_quality)
        buffer.seek(0)
        recompressed = Image.open(buffer).convert("RGB")
        recomp_arr = np.asarray(recompressed, dtype=np.float32)

        # Difference map
        diff_arr = np.mean(np.abs(img_arr - recomp_arr), axis=2)
        mean_val = np.mean(diff_arr)
        std_val = np.std(diff_arr)
        
        # Adaptive threshold for anomaly localization
        threshold = mean_val + (threshold_multiplier * std_val)
        binary_mask = (diff_arr > threshold).astype(np.uint8) * 255

        tampered_pixels = int(np.sum(binary_mask > 0))
        total_pixels = w * h
        tamper_percent = round((tampered_pixels / max(total_pixels, 1)) * 100.0, 2)

        # Find connected bounding regions
        bounding_boxes = []
        if tampered_pixels > 50:
            y_indices, x_indices = np.where(binary_mask > 0)
            if len(x_indices) > 0:
                min_x, max_x = int(np.min(x_indices)), int(np.max(x_indices))
                min_y, max_y = int(np.min(y_indices)), int(np.max(y_indices))
                bounding_boxes.append({
                    "box": [min_x, min_y, max_x, max_y],
                    "confidence": min(round(tamper_percent / 5.0, 2), 0.99),
                    "area_percent": tamper_percent,
                    "type": "suspected_splice_or_inpainting"
                })

        return {
            "has_tampering_regions": len(bounding_boxes) > 0 and tamper_percent > 0.5,
            "tampered_pixel_count": tampered_pixels,
            "tampered_area_percent": tamper_percent,
            "bounding_boxes": bounding_boxes,
            "image_dimensions": [w, h]
        }
