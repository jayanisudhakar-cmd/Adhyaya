import os
import io
import base64
import logging
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

logger = logging.getLogger(__name__)

class ImageToFigurineConverter:
    """
    Transforms any user-uploaded real photo into a 3D animated figurine / avatar
    using OpenCV computer vision bilateral filtering, color quantization,
    edge styling, and cinematic studio lighting.
    """

    @staticmethod
    def process_image(image_bytes: bytes, style: str = "clay_figurine") -> str:
        """
        Processes raw image bytes and returns a base64 encoded data URI.
        """
        # Load image with OpenCV
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid or corrupted image format.")

        # Resize keeping aspect ratio to a crisp 600px square/portrait
        h, w = img.shape[:2]
        max_dim = 640
        scale = max_dim / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        # Style 1: 3D Pixar / Claymation Figurine
        if style in ["clay_figurine", "pixar_3d", "default"]:
            stylized = ImageToFigurineConverter._apply_clay_figurine_style(img)
        # Style 2: Cyberpunk / Neon Hologram Avatar
        elif style == "cyberpunk":
            stylized = ImageToFigurineConverter._apply_cyberpunk_style(img)
        # Style 3: Anime Chibi Sensei
        elif style == "anime_chibi":
            stylized = ImageToFigurineConverter._apply_anime_style(img)
        else:
            stylized = ImageToFigurineConverter._apply_clay_figurine_style(img)

        # Convert back to PIL for studio color grading & specular lighting
        pil_img = Image.fromarray(cv2.cvtColor(stylized, cv2.COLOR_BGR2RGB))

        # Enhance saturation and vibrance for figurine look
        sat_enhancer = ImageEnhance.Color(pil_img)
        pil_img = sat_enhancer.enhance(1.45)

        # Enhance contrast for sharp clay highlights
        contrast_enhancer = ImageEnhance.Contrast(pil_img)
        pil_img = contrast_enhancer.enhance(1.22)

        # Sharpness polish
        sharpness_enhancer = ImageEnhance.Sharpness(pil_img)
        pil_img = sharpness_enhancer.enhance(1.3)

        # Add studio pedestal vignette & circular spotlight
        pil_img = ImageToFigurineConverter._add_studio_lighting(pil_img)

        # Encode to JPEG base64 data URI
        buffer = io.BytesIO()
        pil_img.save(buffer, format="JPEG", quality=92)
        base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{base64_data}"

    @staticmethod
    def _apply_clay_figurine_style(img: np.ndarray) -> np.ndarray:
        """Transforms photo into a smooth vinyl/clay figurine with soft edges."""
        # 1. Multi-pass bilateral filter (produces smooth skin / porcelain clay surface)
        color = img.copy()
        for _ in range(4):
            color = cv2.bilateralFilter(color, d=9, sigmaColor=85, sigmaSpace=85)

        # 2. Extract clean cartoon character edges
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 7)
        edges = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 2
        )
        edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        # 3. K-Means Color Quantization (creates distinct vinyl paint zones)
        data = np.float32(color).reshape((-1, 3))
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        K = 16
        _, label, center = cv2.kmeans(data, K, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        center = np.uint8(center)
        quantized = center[label.flatten()].reshape(color.shape)

        # 4. Blend quantized clay tones with soft outline contours
        edges_norm = edges.astype(float) / 255.0
        blended = (quantized.astype(float) * 0.88 + edges_norm * quantized.astype(float) * 0.12).astype(np.uint8)
        return blended

    @staticmethod
    def _apply_cyberpunk_style(img: np.ndarray) -> np.ndarray:
        """Transforms photo into a futuristic glowing neon hologram figurine."""
        # Color shift towards cyan and magenta neon
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        hsv[:, :, 0] = (hsv[:, :, 0] + 30) % 180  # Shift hues
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.5, 0, 255).astype(np.uint8)  # Saturate
        shifted = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

        # Bilateral smoothing
        smooth = cv2.bilateralFilter(shifted, d=9, sigmaColor=75, sigmaSpace=75)

        # Glow edge overlay
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        canny = cv2.Canny(gray, 50, 150)
        canny_colored = np.zeros_like(img)
        canny_colored[:, :, 0] = canny  # Blue
        canny_colored[:, :, 2] = canny  # Red -> Magenta glow

        result = cv2.addWeighted(smooth, 0.85, canny_colored, 0.35, 0)
        return result

    @staticmethod
    def _apply_anime_style(img: np.ndarray) -> np.ndarray:
        """Cel-shaded anime style figurine."""
        smooth = cv2.edgePreservingFilter(img, flags=1, sigma_s=60, sigma_r=0.4)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 7, 2)
        edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        # Stepped palette
        quantized = (smooth // 32) * 32
        result = cv2.bitwise_and(quantized, edges)
        return result

    @staticmethod
    def _add_studio_lighting(pil_img: Image.Image) -> Image.Image:
        """Adds a soft circular spotlight on the figurine and pedestal."""
        w, h = pil_img.size
        y, x = np.ogrid[:h, :w]
        cy, cx = h * 0.45, w * 0.5
        max_dist = np.sqrt(cx**2 + cy**2)
        dist = np.sqrt((x - cx)**2 + (y - cy)**2)
        vignette_mask = 1 - 0.25 * (dist / max_dist)
        vignette_mask = np.clip(vignette_mask, 0.65, 1.0)

        img_arr = np.array(pil_img).astype(float)
        for c in range(3):
            img_arr[:, :, c] = np.clip(img_arr[:, :, c] * vignette_mask, 0, 255)

        return Image.fromarray(img_arr.astype(np.uint8))

image_converter_service = ImageToFigurineConverter()
