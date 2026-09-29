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
    Transforms any user-uploaded real photo into a 2D or 3D animated AI avatar / figurine
    using advanced computer vision cel-shading, K-Means color quantization,
    ink line-art extraction, and studio lighting.
    """

    @staticmethod
    def process_image(image_bytes: bytes, style: str = "2d_illustrated") -> str:
        """
        Processes raw image bytes and returns a base64 encoded data URI.
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid or corrupted image format.")

        # Resize keeping aspect ratio to a crisp 600px square/portrait
        h, w = img.shape[:2]
        max_dim = 600
        scale = max_dim / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        # Ensure even dimensions
        new_w -= (new_w % 2)
        new_h -= (new_h % 2)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        # Style selection
        if style in ["2d_illustrated", "2d_comic", "comic"]:
            stylized = ImageToFigurineConverter._apply_2d_illustrated_style(img)
        elif style in ["anime_chibi", "anime", "2d_anime"]:
            stylized = ImageToFigurineConverter._apply_anime_style(img)
        elif style in ["cyberpunk", "hologram"]:
            stylized = ImageToFigurineConverter._apply_cyberpunk_style(img)
        else:
            stylized = ImageToFigurineConverter._apply_clay_figurine_style(img)

        # Convert back to PIL for studio color grading
        pil_img = Image.fromarray(cv2.cvtColor(stylized, cv2.COLOR_BGR2RGB))

        # Saturation and vibrance boost for artistic avatar look
        sat_enhancer = ImageEnhance.Color(pil_img)
        pil_img = sat_enhancer.enhance(1.55)

        # Contrast enhancement for sharp character features
        contrast_enhancer = ImageEnhance.Contrast(pil_img)
        pil_img = contrast_enhancer.enhance(1.25)

        # Sharpness polish
        sharpness_enhancer = ImageEnhance.Sharpness(pil_img)
        pil_img = sharpness_enhancer.enhance(1.35)

        # Studio lighting vignette
        pil_img = ImageToFigurineConverter._add_studio_lighting(pil_img)

        # Encode to JPEG base64 data URI
        buffer = io.BytesIO()
        pil_img.save(buffer, format="JPEG", quality=92)
        base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{base64_data}"

    @staticmethod
    def _apply_2d_illustrated_style(img: np.ndarray) -> np.ndarray:
        """
        Transforms photo into a genuine 2D comic / vector illustrated character:
        - Clean black ink contour lines
        - Deep bilateral color flattening
        - K-Means 10-level color quantization (cel-shading)
        """
        # 1. Clean comic ink outline extraction
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray_blur = cv2.medianBlur(gray, 7)
        edges = cv2.adaptiveThreshold(
            gray_blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 6
        )
        # Dilate edges slightly for prominent ink lines
        kernel = np.ones((2, 2), np.uint8)
        edges = cv2.erode(edges, kernel, iterations=1)
        edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        # 2. Deep bilateral smoothing (eliminates photo skin grain into flat illustrated tone)
        color = img.copy()
        for _ in range(6):
            color = cv2.bilateralFilter(color, d=9, sigmaColor=90, sigmaSpace=90)

        # 3. K-Means cel-shade quantization
        data = np.float32(color).reshape((-1, 3))
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 0.5)
        K = 10
        _, labels, centers = cv2.kmeans(data, K, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        quantized = np.uint8(centers)[labels.flatten()].reshape(color.shape)

        # 4. Multiply cel-shaded colors with crisp ink line art
        result = cv2.bitwise_and(quantized, edges_bgr)
        return result

    @staticmethod
    def _apply_clay_figurine_style(img: np.ndarray) -> np.ndarray:
        """Transforms photo into a smooth 3D vinyl/clay figurine with soft edges."""
        color = img.copy()
        for _ in range(5):
            color = cv2.bilateralFilter(color, d=9, sigmaColor=85, sigmaSpace=85)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 7)
        edges = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 2
        )
        edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        data = np.float32(color).reshape((-1, 3))
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        K = 16
        _, label, center = cv2.kmeans(data, K, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        center = np.uint8(center)
        quantized = center[label.flatten()].reshape(color.shape)

        edges_norm = edges.astype(float) / 255.0
        blended = (quantized.astype(float) * 0.90 + edges_norm * quantized.astype(float) * 0.10).astype(np.uint8)
        return blended

    @staticmethod
    def _apply_anime_style(img: np.ndarray) -> np.ndarray:
        """Transforms photo into a vibrant anime sensei character."""
        # Edge-preserving anime watercolor smoothing
        smooth = cv2.edgePreservingFilter(img, flags=1, sigma_s=60, sigma_r=0.45)
        
        # Soft anime outline sketch
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 7, 2)
        edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        # Luminous pastel tone quantization
        quantized = (smooth // 28) * 28
        result = cv2.bitwise_and(quantized, edges)
        return result

    @staticmethod
    def _apply_cyberpunk_style(img: np.ndarray) -> np.ndarray:
        """Transforms photo into a glowing neon hologram AI avatar."""
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        hsv[:, :, 0] = (hsv[:, :, 0] + 35) % 180
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.6, 0, 255).astype(np.uint8)
        shifted = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

        smooth = cv2.bilateralFilter(shifted, d=9, sigmaColor=75, sigmaSpace=75)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        canny = cv2.Canny(gray, 50, 150)
        canny_colored = np.zeros_like(img)
        canny_colored[:, :, 0] = canny  # Cyan / Blue
        canny_colored[:, :, 2] = canny  # Magenta / Red

        result = cv2.addWeighted(smooth, 0.85, canny_colored, 0.40, 0)
        return result

    @staticmethod
    def _add_studio_lighting(pil_img: Image.Image) -> Image.Image:
        """Adds a soft circular spotlight on the avatar."""
        w, h = pil_img.size
        y, x = np.ogrid[:h, :w]
        cy, cx = h * 0.45, w * 0.5
        max_dist = np.sqrt(cx**2 + cy**2)
        dist = np.sqrt((x - cx)**2 + (y - cy)**2)
        vignette_mask = 1 - 0.22 * (dist / max_dist)
        vignette_mask = np.clip(vignette_mask, 0.70, 1.0)

        img_arr = np.array(pil_img).astype(float)
        for c in range(3):
            img_arr[:, :, c] = np.clip(img_arr[:, :, c] * vignette_mask, 0, 255)

        return Image.fromarray(img_arr.astype(np.uint8))

image_converter_service = ImageToFigurineConverter()
