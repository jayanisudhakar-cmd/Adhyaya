import base64
import httpx
import logging
import asyncio
from app.config import settings

logger = logging.getLogger(__name__)

class DIDService:
    def __init__(self):
        self.api_key = settings.DID_API_KEY
        self.base_url = "https://api.d-id.com"

    def _get_headers(self) -> dict:
        if not self.api_key:
            logger.warning("DID_API_KEY is not set. D-ID API calls will fail.")
            raise ValueError("D-ID API key is missing.")
        
        # D-ID uses Basic authentication: API_KEY:password (password is empty)
        encoded_auth = base64.b64encode(f"{self.api_key}:".encode()).decode()
        return {
            "Authorization": f"Basic {encoded_auth}",
            "accept": "application/json"
        }

    async def upload_audio(self, audio_bytes: bytes, filename: str = "tts_audio.mp3") -> str:
        """
        Uploads audio bytes to D-ID temporary storage and returns the uploaded audio URL.
        """
        url = f"{self.base_url}/audios"
        headers = self._get_headers()
        # Do not set Content-Type header manually when using multipart form, httpx handles it
        
        files = {
            "audio": (filename, audio_bytes, "audio/mpeg")
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, files=files, headers=headers)
            if response.status_code != 201:
                logger.error(f"D-ID Audio upload failed: {response.status_code} - {response.text}")
                raise Exception(f"D-ID Audio upload failed with status {response.status_code}: {response.text}")
            
            result = response.json()
            # D-ID returns url in the JSON response
            audio_url = result.get("url")
            if not audio_url:
                raise Exception("D-ID response did not contain audio url")
            
            return audio_url

    async def create_talk(self, image_url: str, audio_url: str) -> str:
        """
        Creates a D-ID talk with source image and audio URL, polls until done, and returns video URL.
        """
        url = f"{self.base_url}/talks"
        headers = self._get_headers()
        headers["Content-Type"] = "application/json"

        data = {
            "source_url": image_url,
            "script": {
                "type": "audio",
                "audio_url": audio_url
            },
            "config": {
                "fluent": "true",
                "pad_audio": "0.0",
                "stitch": True
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data, headers=headers)
            if response.status_code != 201:
                logger.error(f"D-ID Create Talk failed: {response.status_code} - {response.text}")
                raise Exception(f"D-ID Create Talk failed: {response.text}")
            
            talk_info = response.json()
            talk_id = talk_info.get("id")
            if not talk_id:
                raise Exception("D-ID talk creation did not return a talk ID")
            
            return talk_id

    async def poll_talk_status(self, talk_id: str, max_retries: int = 40, delay_seconds: int = 3) -> str:
        """
        Polls D-ID talk status until it is 'done' or 'failed'. Returns the final video URL.
        """
        url = f"{self.base_url}/talks/{talk_id}"
        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(max_retries):
                response = await client.get(url, headers=headers)
                if response.status_code != 200:
                    logger.error(f"D-ID Poll failed: {response.status_code} - {response.text}")
                    raise Exception(f"D-ID polling error: {response.text}")
                
                result = response.json()
                status = result.get("status")
                logger.info(f"D-ID Talk status (Attempt {attempt+1}/{max_retries}): {status}")

                if status == "done":
                    video_url = result.get("result_url")
                    if not video_url:
                        raise Exception("D-ID talk succeeded but no result_url was found")
                    return video_url
                elif status == "failed":
                    error_details = result.get("error", "Unknown error")
                    raise Exception(f"D-ID talk generation failed: {error_details}")
                
                await asyncio.sleep(delay_seconds)
            
            raise TimeoutError("D-ID video generation timed out.")

    async def upload_image(self, image_bytes: bytes, filename: str = "avatar_image.png") -> str:
        """
        Uploads image bytes to D-ID temporary storage and returns the uploaded image ID.
        """
        url = f"{self.base_url}/images"
        headers = self._get_headers()
        
        files = {
            "image": (filename, image_bytes, "image/png")
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, files=files, headers=headers)
            if response.status_code != 201:
                logger.error(f"D-ID Image upload failed: {response.status_code} - {response.text}")
                raise Exception(f"D-ID Image upload failed with status {response.status_code}: {response.text}")
            
            result = response.json()
            image_id = result.get("id")
            if not image_id:
                raise Exception("D-ID response did not contain image ID")
            
            return image_id

    async def generate_avatar_video(self, image_url: str, audio_bytes: bytes) -> str:
        """
        Full workflow: Upload audio, trigger talk generation, poll and return the resulting video URL.
        """
        logger.info("Uploading audio to D-ID storage...")
        audio_url = await self.upload_audio(audio_bytes)
        
        logger.info(f"Audio uploaded successfully. Audio URL: {audio_url}")
        logger.info("Triggering D-ID talk creation...")
        talk_id = await self.create_talk(image_url, audio_url)
        
        logger.info(f"Talk created. Talk ID: {talk_id}. Polling for completion...")
        video_url = await self.poll_talk_status(talk_id)
        
        logger.info(f"Video generated successfully! Video URL: {video_url}")
        return video_url
