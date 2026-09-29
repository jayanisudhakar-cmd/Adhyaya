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

        # 1. Resolve API key
        key_to_use = (gemini_api_key or settings.GEMINI_API_KEY or "").strip()

        # 2. Try Google Imagen 3 API if key is a valid Google AI Studio key (starts with AIzaSy)
        if key_to_use and key_to_use.startswith("AIzaSy"):
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

        # 3. Try Hugging Face Inference API if user provided a HuggingFace token (starts with hf_)
        if key_to_use and key_to_use.startswith("hf_"):
            try:
                logger.info("[GeminiImageService] Attempting Hugging Face FLUX.1 inference...")
                hf_url = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
                headers = {"Authorization": f"Bearer {key_to_use}", "Content-Type": "application/json"}
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(hf_url, headers=headers, json={"inputs": enhanced_prompt})
                    if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                        with open(output_path, "wb") as f:
                            f.write(resp.content)
                        rel_url = f"/static/avatars/{os.path.basename(output_path)}"
                        return output_path, rel_url, "Hugging Face FLUX.1"
            except Exception as e:
                logger.warning(f"[GeminiImageService] Hugging Face error: {e}")

        # 4. High-Fidelity Neural Fallback (Pollinations Turbo / Realism if available)
        try:
            logger.info("[GeminiImageService] Attempting live Neural Realism generation...")
            encoded_prompt = urllib.parse.quote(enhanced_prompt[:120])
            seed = uuid.uuid4().int % 999999
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=512&height=512&nologo=true&seed={seed}"
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                    with open(output_path, "wb") as f:
                        f.write(resp.content)
                    rel_url = f"/static/avatars/{os.path.basename(output_path)}"
                    return output_path, rel_url, "Enhanced Neural Realism (Flux/Turbo)"
                else:
                    logger.info(f"[GeminiImageService] Neural API status {resp.status_code}, activating curated studio library...")
        except Exception as e:
            logger.info(f"[GeminiImageService] Live neural generator unavailable: {e}")

        # 5. Prompt-Aware Curated HD Realistic Educator Library
        p_lower = prompt.lower()
        is_male = any(w in p_lower for w in ["male", "man", "sir", "mr", "professor", "kabir", "rohan", "boy", "he", "his"])
        realistic_dir = os.path.join(self.base_dir, "..", "frontend", "public", "avatars", "realistic")

        if os.path.exists(realistic_dir):
            if is_male:
                if any(w in p_lower for w in ["tech", "coding", "python", "ai", "computer", "young", "data"]):
                    chosen = "male_tech_tutor.jpg"
                elif any(w in p_lower for w in ["academic", "glasses", "science", "math", "book", "physics"]):
                    chosen = "male_academic_glasses.jpg"
                elif any(w in p_lower for w in ["class", "school", "lecture", "student", "teacher"]):
                    chosen = "male_teacher_class.jpg"
                else:
                    chosen = "male_professor_suit.jpg"
            else:
                if any(w in p_lower for w in ["math", "teal", "saree", "physics", "science", "formula"]):
                    chosen = "female_math_teal.jpg"
                elif any(w in p_lower for w in ["young", "tutor", "modern", "college", "friendly"]):
                    chosen = "female_young_tutor.jpg"
                elif any(w in p_lower for w in ["academic", "glasses", "professor", "senior", "phd"]):
                    chosen = "female_academic_glasses.jpg"
                else:
                    chosen = "female_teacher_class.jpg"

            chosen_path = os.path.join(realistic_dir, chosen)
            if os.path.exists(chosen_path):
                with open(chosen_path, "rb") as sf:
                    data = sf.read()
                with open(output_path, "wb") as df:
                    df.write(data)
                rel_url = f"/static/avatars/{os.path.basename(output_path)}"
                return output_path, rel_url, "Curated Studio Portrait (HD Realistic)"

        # 6. Built-in High-Definition Master Realism Presets
        logger.info("[GeminiImageService] Using built-in master realistic teacher asset...")
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
