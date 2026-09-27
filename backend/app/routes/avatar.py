from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from app.services.elevenlabs_service import ElevenLabsService
from app.services.did_service import DIDService

router = APIRouter(prefix="/api", tags=["Avatar Generation"])

# Instantiate services
elevenlabs_service = ElevenLabsService()
did_service = DIDService()

@router.post("/avatar/generate")
async def generate_avatar_endpoint(
    image_url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    script: str = Form(...),
    voice_id: str = Form("21m00Tcm4TlvDq8ikWAM")
):
    """
    Takes an avatar image (either a URL or uploaded image file) and a lesson script,
    generates speech audio via ElevenLabs, sends both to D-ID to animate the avatar,
    and returns the final MP4 video URL.
    """
    try:
        # Step 1: Resolve the source image identifier (URL or D-ID image ID)
        if image_file and image_file.filename:
            # Read the uploaded image file
            image_bytes = await image_file.read()
            # Upload image file to D-ID's hosting to get an ID
            source_identifier = await did_service.upload_image(
                image_bytes=image_bytes,
                filename=image_file.filename
            )
        elif image_url:
            source_identifier = image_url
        else:
            raise ValueError("Either 'image_url' or an 'image_file' must be uploaded.")

        # Step 2: Generate speech audio from script using ElevenLabs
        audio_bytes = await elevenlabs_service.text_to_speech(
            text=script,
            voice_id=voice_id
        )
        
        # Step 3: Animate avatar using D-ID (Uploads audio, triggers, and polls)
        video_url = await did_service.generate_avatar_video(
            image_url=source_identifier,
            audio_bytes=audio_bytes
        )
        
        return {
            "success": True,
            "video_url": video_url
        }
        
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate virtual teacher avatar: {str(e)}")
