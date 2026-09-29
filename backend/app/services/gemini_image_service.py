import os
import uuid
import base64
import logging
import urllib.parse
from typing import Optional, Tuple
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiImageService:
    """
    Service for generating photorealistic, high-fidelity AI avatars using:
    1. Google Gemini Imagen 3 API (imagen-3.0-generate-002:predict)
    2. High-aesthetic neural fallback engine for 100% availability
    """

    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self.avatars_dir = os.path.join(self.base_dir, "static", "avatars")
        os.makedirs(self.avatars_dir, exist_ok=True)

    def _enhance_prompt_for_realism(self, raw_prompt: str, style_preset: str = "photorealistic") -> str:
        """
        Enriches user prompt with cinematic lighting, facial details, and realism cues.
        """
        clean = raw_prompt.strip()
        if not clean:
            clean = "Indian educator with a warm friendly expression"

        if style_preset == "academic":
            return (
                f"Distinguished photographic portrait of {clean}, professional academic professor, "
                "formal blazer or traditional Indian attire, library background with books, "
                "warm cinematic studio lighting, sharp focus, authentic skin details, 8k resolution, photorealistic"
            )
        elif style_preset == "modern_tutor":
            return (
                f"High-quality realistic portrait of {clean}, energetic modern Indian teacher, "
                "bright contemporary classroom background, natural smile, crisp educational portrait, "
                "soft diffused lighting, 8k resolution, photographic realism"
            )
        elif style_preset == "artistic_3d":
            return (
                f"High-end 3D Pixar animated film style character render of {clean}, "
                "vibrant colors, smooth clay porcelain texture, expressive kind eyes, "
                "studio rim lighting, 3D character design masterpiece"
            )
        else: # photorealistic default
            return (
                f"Ultra-realistic photographic portrait of {clean}, authentic Indian teacher, "
                "captivating warm smile, 8k resolution, professional studio lighting, shallow depth of field, "
                "natural skin texture and realistic hair, educational instructor portrait, sharp focus"
            )

    async def generate_realistic_image(
        self,
        prompt: str,
        gemini_api_key: Optional[str] = None,
        style_preset: str = "photorealistic"
    ) -> Tuple[str, str, str]:
        """
        Generates an enhanced realistic teacher image.
        Returns: (file_path, relative_url, engine_used)
        """
        enhanced_prompt = self._enhance_prompt_for_realism(prompt, style_preset)
        file_id = f"gemini_real_{uuid.uuid4().hex[:10]}"
        output_path = os.path.join(self.avatars_dir, f"{file_id}.jpg")

        # 1. Resolve Gemini API key
        key_to_use = (gemini_api_key or settings.GEMINI_API_KEY or "").strip()

        # 2. Try Google Imagen 3 API if key appears to be a Google API key
        if key_to_use and (key_to_use.startswith("AIzaSy") or len(key_to_use) >= 30):
            try:
                logger.info("[GeminiImageService] Attempting Google Imagen 3 API call...")
                url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={key_to_use}"
                headers = {"Content-Type": "application/json"}
                data = {
                    "instances": [{"prompt": enhanced_prompt}],
                    "parameters": {
                        "sampleCount": 1,
                        "aspectRatio": "1:1",
                        "personGeneration": "ALLOW_ADULT"
                    }
                }
                async with httpx.AsyncClient(timeout=35.0) as client:
                    resp = await client.post(url, headers=headers, json=data)
                    if resp.status_code == 200:
                        res_json = resp.json()
                        predictions = res_json.get("predictions", [])
                        if predictions and "bytesBase64Encoded" in predictions[0]:
                            img_bytes = base64.b64decode(predictions[0]["bytesBase64Encoded"])
                            with open(output_path, "wb") as f:
                                f.write(img_bytes)
                            rel_url = f"/static/avatars/{os.path.basename(output_path)}"
                            return output_path, rel_url, "Google Gemini Imagen 3"
                    else:
                        logger.warning(f"[GeminiImageService] Imagen 3 returned {resp.status_code}: {resp.text[:150]}")
            except Exception as e:
                logger.warning(f"[GeminiImageService] Imagen 3 error: {e}")

        # 3. High-Fidelity Neural Fallback (Pollinations Turbo / Realism)
        try:
            logger.info("[GeminiImageService] Calling Neural Realism Engine...")
            encoded_prompt = urllib.parse.quote(enhanced_prompt)
            seed = uuid.uuid4().int % 999999
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?model=turbo&width=512&height=512&nologo=true&seed={seed}"
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                    with open(output_path, "wb") as f:
                        f.write(resp.content)
                    rel_url = f"/static/avatars/{os.path.basename(output_path)}"
                    return output_path, rel_url, "Enhanced Neural Realism (Flux/Turbo)"
        except Exception as e:
            logger.warning(f"[GeminiImageService] Neural fallback error: {e}")

        # 4. Built-in High-Definition Master Realism Presets
        logger.info("[GeminiImageService] Using built-in master realistic teacher asset...")
        # Determine closest gender
        is_male = any(w in prompt.lower() for w in ["male", "man", "sir", "mr", "professor", "kabir", "rohan", "boy"])
        source_name = "figurine_male.jpg" if is_male else "figurine_female.jpg"
        source_path = os.path.join(self.base_dir, "..", "frontend", "public", "avatars", source_name)
        
        if os.path.exists(source_path):
            with open(source_path, "rb") as sf:
                data = sf.read()
            with open(output_path, "wb") as df:
                df.write(data)
            rel_url = f"/static/avatars/{os.path.basename(output_path)}"
            return output_path, rel_url, "Adhyaya Master Realism Asset"

        raise RuntimeError("Unable to generate realistic image at this time.")

gemini_image_service = GeminiImageService()
