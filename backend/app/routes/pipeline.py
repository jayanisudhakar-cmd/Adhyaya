# backend/app/routes/pipeline.py
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from gtts import gTTS
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/pipeline", tags=["pipeline"])
gemini_service = GeminiService()

class QueryRequest(BaseModel):
    prompt: str
    neuro_mode: str = "standard"
    language: str = "en"

@router.post("/process-query")
async def process_query(data: QueryRequest):
    try:
        reply = gemini_service._synthesize_guru_reply(data.prompt, data.neuro_mode)
        
        audio_path = os.path.join(os.getcwd(), "temp_audio.mp3")
        tts = gTTS(text=reply, lang=data.language)
        tts.save(audio_path)
        
        return {
            "response": reply,
            "language": data.language,
            "has_video": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/video")
async def get_video():
    video_path = os.path.join(os.getcwd(), "output_video.mp4")
    if os.path.exists(video_path):
        return FileResponse(video_path, media_type="video/mp4")
    
    audio_path = os.path.join(os.getcwd(), "temp_audio.mp3")
    if os.path.exists(audio_path):
        return FileResponse(audio_path, media_type="audio/mp3")
        
    raise HTTPException(status_code=404, detail="Media not generated yet.")