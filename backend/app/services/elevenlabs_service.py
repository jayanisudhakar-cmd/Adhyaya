import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class ElevenLabsService:
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.base_url = "https://api.elevenlabs.io/v1"

    async def text_to_speech(self, text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> bytes:
        """
        Converts text to speech using ElevenLabs API and returns the audio bytes.
        Voice ID defaults to 'Rachel' (21m00Tcm4TlvDq8ikWAM).
        """
        if not self.api_key:
            logger.warning("ELEVENLABS_API_KEY is not set. Cannot perform text-to-speech.")
            raise ValueError("ElevenLabs API Key is missing.")

        url = f"{self.base_url}/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
            "accept": "audio/mpeg"
        }
        
        # Configure model and settings
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data, headers=headers)
            if response.status_code != 200:
                logger.error(f"ElevenLabs TTS failed: {response.status_code} - {response.text}")
                raise Exception(f"ElevenLabs TTS failed with status {response.status_code}")
            
            return response.content
