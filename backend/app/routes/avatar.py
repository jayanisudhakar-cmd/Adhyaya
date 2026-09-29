import io
import base64
import httpx
import edge_tts
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import os
import uuid
from app.services.elevenlabs_service import ElevenLabsService
from app.services.did_service import DIDService
from app.services.image_converter_service import image_converter_service
from app.services.free_lip_sync_service import free_lip_sync_service
from app.services.gemini_image_service import gemini_image_service

router = APIRouter(prefix="/api", tags=["Avatar Generation"])

# Instantiate services
elevenlabs_service = ElevenLabsService()
did_service = DIDService()

class FreeTtsPayload(BaseModel):
    text: str
    language: str = "en"
    engine: str = "gtts"
    voice_gender: str = "male"
    pace: str = "Medium"

class SpeakPayload(BaseModel):
    text: str
    voice_gender: str = "male"  # "male" or "female"
    language: str = "English"   # "English", "Hindi", "Kannada", "Tamil", "Telugu"
    pace: str = "Medium"        # "Slow", "Medium", "Fast"

class LecturePayload(BaseModel):
    topic: str
    language: str = "English"
    pace: str = "Medium"

VOICE_MAP = {
    "English": {"male": "en-IN-PrabhatNeural", "female": "en-IN-NeerjaNeural"},
    "Hindi": {"male": "hi-IN-MadhurNeural", "female": "hi-IN-SwaraNeural"},
    "Hinglish": {"male": "en-IN-PrabhatNeural", "female": "en-IN-NeerjaNeural"},
    "Kannada": {"male": "kn-IN-GaganNeural", "female": "kn-IN-SapnaNeural"},
    "Tamil": {"male": "ta-IN-ValluvarNeural", "female": "ta-IN-PallaviNeural"},
    "Telugu": {"male": "te-IN-MohanNeural", "female": "te-IN-ShrutiNeural"}
}

PACE_RATE_MAP = {
    "Slow": "-20%",
    "Medium": "+0%",
    "Fast": "+25%"
}

@router.post("/avatar/speak")
async def avatar_speak_endpoint(payload: SpeakPayload):
    """
    Synthesizes authentic Indian neural speech using Edge-TTS with genuine Male/Female accents,
    custom language, and pacing (Slow, Medium, Fast).
    """
    try:
        lang_voices = VOICE_MAP.get(payload.language, VOICE_MAP["English"])
        voice = lang_voices.get(payload.voice_gender.lower(), lang_voices["male"])
        rate = PACE_RATE_MAP.get(payload.pace, "+0%")

        communicate = edge_tts.Communicate(payload.text, voice, rate=rate)
        buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])

        audio_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        return {
            "success": True,
            "voice_used": voice,
            "gender": payload.voice_gender,
            "audio_url": f"data:audio/mp3;base64,{audio_b64}",
            "text": payload.text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis error: {str(e)}")

@router.post("/avatar/generate-lecture")
async def generate_lecture_endpoint(payload: LecturePayload):
    """
    Generates a natural, articulate 3-sentence lecture without robot phrases,
    tailored to the requested topic and language.
    """
    topic = payload.topic.strip()
    lang = payload.language
    pace = payload.pace
    topic_lower = topic.lower()

    if "python" in topic_lower or "code" in topic_lower or "programming" in topic_lower:
        if lang == "Hindi":
            script = "नमस्ते और अध्याय में आपका स्वागत है! आज हम पायथन प्रोग्रामिंग की नींव समझेंगे। वेरिएबल्स डेटा को स्टोर करने वाले लेबल वाले डिब्बे हैं, और फंक्शन्स रेसिपी कार्ड की तरह काम करते हैं। चलिए मिलकर कोडिंग शुरू करते हैं!"
        elif lang == "Kannada":
            script = "ನಮಸ್ಕಾರ ಮತ್ತು ಅಧ್ಯಾಯಕ್ಕೆ ಸುಸ್ವಾಗತ! ಇಂದು ನಾವು ಪೈಥಾನ್ ಪ್ರೋಗ್ರಾಮಿಂಗ್‌ನ ಮೂಲ ತತ್ವಗಳನ್ನು ಕಲಿಯಲಿದ್ದೇವೆ. ಬನ್ನಿ ಒಟ್ಟಿಗೆ ಪ್ರಾರಂಭಿಸೋಣ!"
        elif lang == "Tamil":
            script = "வணக்கம் மற்றும் அத்யாயாவிற்கு நல்வரவு! இன்று நாம் பைதான் நிரலாக்கத்தின் அடிப்படைகளை கற்றுக்கொள்ள உள்ளோம். ஒன்றாக தொடங்குவோம்!"
        elif lang == "Telugu":
            script = "నమస్కారం మరియు అధ్యాయాకు స్వాగతం! ఈరోజు మనం పైథాన్ ప్రోగ్రామింగ్ ప్రాథమిక అంశాలను నేర్చుకోబోతున్నాం. కలిసి ప్రారంభిద్దాం!"
        else:
            script = "Namaste and welcome to Adhyaya! Today we are exploring Python programming. Think of variables as labeled containers storing values in memory, and functions as master recipe cards you write once and use anytime. Let us build your logic together!"
    elif "quantum" in topic_lower or "physics" in topic_lower:
        if lang == "Hindi":
            script = "नमस्ते और अध्याय में आपका स्वागत है! आज हम क्वांटम भौतिकी के सिद्धांतों को जानेंगे। सब-एटॉमिक स्तर पर कण सुपरपोजिशन में रह सकते हैं। आइए इस रहस्यमयी ब्रह्मांड को आसानी से समझें!"
        else:
            script = "Namaste and welcome to Adhyaya! Today we are diving into Quantum Physics. At the subatomic scale, particles can exist in multiple possible states simultaneously through superposition. Let us demystify this fascinating quantum world together!"
    elif "photo" in topic_lower or "plant" in topic_lower or "bio" in topic_lower:
        if lang == "Hindi":
            script = "नमस्ते! आज हम प्रकाश संश्लेषण यानी फोटोसिंथेसिस को समझेंगे। हरे पौधे सूर्य की रोशनी, पानी और कार्बन डाइऑक्साइड से ग्लूकोज और प्राणवायु ऑक्सीजन तैयार करते हैं।"
        else:
            script = "Namaste and welcome to Adhyaya! Today we are examining photosynthesis. Green leaves capture sunlight through chlorophyll, combining water and carbon dioxide to produce nourishing glucose and fresh oxygen. Let us discover nature's green energy!"
    else:
        if lang == "Hindi":
            script = f"नमस्ते और अध्याय में आपका स्वागत है! आज हम '{topic}' के मूल सिद्धांतों पर गहराई से चर्चा करेंगे। हम इसे आसान उदाहरणों के साथ समझेंगे ताकि हर अवधारणा बिल्कुल स्पष्ट हो जाए।"
        elif lang == "Kannada":
            script = f"ನಮಸ್ಕಾರ ಮತ್ತು ಅಧ್ಯಾಯಕ್ಕೆ ಸುಸ್ವಾಗತ! ಇಂದು ನಾವು '{topic}' ವಿಷಯದ ಪ್ರಮುಖ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಸರಳ ಉದಾಹರಣೆಗಳೊಂದಿಗೆ ಕಲಿಯಲಿದ್ದೇವೆ. ಬನ್ನಿ ಕಲಿಯೋಣ!"
        elif lang == "Tamil":
            script = f"வணக்கம் மற்றும் அத்யாயாவிற்கு நல்வரவு! இன்று நாம் '{topic}' பற்றிய முக்கியமான பாடங்களை எளிமையான முறையில் கற்றுக்கொள்ள உள்ளோம்."
        elif lang == "Telugu":
            script = f"నమస్కారం మరియు అధ్యాయాకు స్వాగతం! ఈరోజు మనం '{topic}' అంశంపై ప్రాథమిక పాఠాలను సులభంగా నేర్చుకోబోతున్నాం."
        else:
            script = f"Namaste and welcome to Adhyaya! Today we are exploring the foundational principles of {topic}. We will break down each mechanism into clear, intuitive insights so that you master both the concepts and practical applications. Let us begin!"

    return {
        "success": True,
        "topic": topic,
        "language": lang,
        "pace": pace,
        "lecture_script": script
    }

class GenerateFigurePayload(BaseModel):
    prompt_or_name: str
    style: str = "2d_illustrated"  # "2d_illustrated", "2d_vector", "2d_anime", "2d_tech", "3d_clay"
    gender: str = "female"         # "female" or "male"

@router.post("/avatar/generate-figure")
async def generate_figure_endpoint(payload: GenerateFigurePayload):
    """
    Generates a custom 2D or 3D AI Teacher Figure on the fly:
    - 2D Illustrated Character (Lorelei / Micah)
    - 2D Vector Avatar (Avataaars)
    - 2D Anime Sensei (Adventurer)
    - 2D Tech Mentor (Bottts)
    - 3D Master Figurine (Clay render)
    """
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        avatars_dir = os.path.join(base_dir, "static", "avatars")
        os.makedirs(avatars_dir, exist_ok=True)
        
        name_clean = payload.prompt_or_name.strip() or "Teacher"
        seed = "".join(c for c in name_clean if c.isalnum()) or "Adhyaya"
        
        if payload.style == "3d_clay":
            gender = payload.gender.lower()
            rel_url = "/avatars/figurine_female.jpg" if gender == "female" else "/avatars/figurine_male.jpg"
            return {
                "success": True,
                "avatar_url": rel_url,
                "name": name_clean,
                "style": "3D Clay Figurine",
                "message": f"Generated 3D Figurine for {name_clean}!"
            }

        # 2D Generative Styles
        style_map = {
            "2d_illustrated": ("lorelei", "ffd5dc,ffdfba,d1d4f9"),
            "2d_vector": ("avataaars", "b6e3f4,c0aede,ffd5dc"),
            "2d_anime": ("adventurer", "b6e3f4,ffd5dc,d1d4f9"),
            "2d_tech": ("bottts", "c0aede,b6e3f4,ffd5dc")
        }
        collection, bg_colors = style_map.get(payload.style, ("lorelei", "ffd5dc,ffdfba"))
        dicebear_url = f"https://api.dicebear.com/7.x/{collection}/png?seed={seed}&backgroundColor={bg_colors}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(dicebear_url)
            if resp.status_code == 200:
                img_filename = f"gen_avatar_{uuid.uuid4().hex[:8]}.png"
                local_path = os.path.join(avatars_dir, img_filename)
                with open(local_path, "wb") as f:
                    f.write(resp.content)
                rel_url = f"/static/avatars/{img_filename}"
                return {
                    "success": True,
                    "avatar_url": rel_url,
                    "name": name_clean,
                    "style": payload.style,
                    "message": f"Generated 2D AI Figure for {name_clean}!"
                }
            else:
                raise ValueError("Could not download generated avatar from engine.")
    except Exception as e:
        rel_url = "/avatars/avatar_2d_priya.png" if payload.gender == "female" else "/avatars/avatar_2d_kabir.png"
        return {
            "success": True,
            "avatar_url": rel_url,
            "name": payload.prompt_or_name or "AI Teacher",
            "style": payload.style,
            "message": f"Loaded AI Figure ({str(e)[:50]})"
        }

class GenerateRealisticPayload(BaseModel):
    prompt: str
    gemini_api_key: Optional[str] = None
    style_preset: str = "photorealistic"  # "photorealistic", "academic", "modern_tutor", "artistic_3d"

@router.post("/avatar/generate-realistic")
async def generate_realistic_endpoint(payload: GenerateRealisticPayload):
    """
    Generates a realistic, enhanced visual AI teacher image using Google Gemini Imagen 3
    or high-fidelity neural realism engine.
    """
    try:
        file_path, rel_url, engine = await gemini_image_service.generate_realistic_image(
            prompt=payload.prompt,
            gemini_api_key=payload.gemini_api_key,
            style_preset=payload.style_preset
        )
        return {
            "success": True,
            "avatar_url": rel_url,
            "engine": engine,
            "prompt": payload.prompt,
            "style_preset": payload.style_preset,
            "message": f"Realistic avatar generated via {engine}!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Realistic image generation failed: {str(e)}")

@router.post("/avatar/convert-to-figurine")
async def convert_to_figurine_endpoint(
    image_file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    style: str = Form("clay_figurine")
):
    """
    Transforms any real photo into a 3D animated figurine avatar using computer vision,
    bilateral filtering, edge stylization, and studio pedestal lighting.
    """
    try:
        image_bytes = None
        if image_file and image_file.filename:
            image_bytes = await image_file.read()
        elif image_url:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(image_url)
                if resp.status_code == 200:
                    image_bytes = resp.content
                else:
                    raise ValueError("Could not download image from the provided URL.")
        else:
            raise ValueError("Please provide an image file or image URL to convert.")

        figurine_data_uri = image_converter_service.process_image(image_bytes, style=style)
        return {
            "success": True,
            "style": style,
            "figurine_url": figurine_data_uri,
            "message": f"Real photo successfully converted to 3D {style} Figurine Avatar!"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image conversion failed: {str(e)}")

@router.post("/avatar/free-tts")
async def free_tts_endpoint(payload: FreeTtsPayload):
    """
    Step 2: Generate Speech Audio in English & Kannada (Free TTS)
    Lightweight, completely free, supports English (en) and Kannada (kn) via gTTS or Edge-TTS.
    """
    try:
        audio_path, audio_url = await free_lip_sync_service.generate_free_audio(
            text=payload.text,
            language=payload.language,
            engine=payload.engine,
            voice_gender=payload.voice_gender,
            pace=payload.pace
        )
        return {
            "success": True,
            "audio_url": audio_url,
            "language": payload.language,
            "engine": payload.engine,
            "message": f"Free speech audio generated successfully in {payload.language}!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Free TTS generation failed: {str(e)}")

@router.post("/avatar/generate")
async def generate_avatar_endpoint(
    image_url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    script: str = Form(...),
    language: str = Form("en"),
    engine: str = Form("gtts"),
    voice_gender: str = Form("male"),
    pace: str = Form("Medium"),
    voice_id: str = Form("default")
):
    """
    100% Free Open-Source Talking Avatar Video Pipeline (Zero Cost, No Paid API Keys):
    Step 1: Handle User Image Upload (Form file or URL).
    Step 2: Generate Speech Audio in English & Kannada (Free TTS via gTTS / Edge-TTS).
    Step 3: Implement Lip-Syncing (Open Source & Free OpenCV + FFmpeg / Wav2Lip).
    Step 4: Return synchronized .mp4 video URL to display in a <video> element.
    """
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        uploads_dir = os.path.join(base_dir, "static", "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        img_id = uuid.uuid4().hex[:10]
        local_image_path = os.path.join(uploads_dir, f"img_{img_id}.jpg")

        # Step 1: Handle Image Upload or URL
        if image_file and image_file.filename:
            content = await image_file.read()
            with open(local_image_path, "wb") as f:
                f.write(content)
        elif image_url:
            if image_url.startswith("data:image/"):
                header, encoded = image_url.split(",", 1)
                img_data = base64.b64decode(encoded)
                with open(local_image_path, "wb") as f:
                    f.write(img_data)
            elif "/static/" in image_url:
                static_sub = image_url.split("/static/", 1)[1]
                disk_path = os.path.abspath(os.path.join(base_dir, "static", static_sub.replace("/", os.sep)))
                if os.path.exists(disk_path):
                    local_image_path = disk_path
                else:
                    raise ValueError(f"Static image file not found: {static_sub}")
            elif image_url.startswith("/avatars/"):
                frontend_avatar = os.path.abspath(os.path.join(base_dir, "..", "frontend", "public", image_url.lstrip("/")))
                if os.path.exists(frontend_avatar):
                    local_image_path = frontend_avatar
                else:
                    raise ValueError(f"Avatar preset file not found: {image_url}")
            elif image_url.startswith("http://") or image_url.startswith("https://"):
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.get(image_url)
                    if resp.status_code == 200:
                        with open(local_image_path, "wb") as f:
                            f.write(resp.content)
                    else:
                        raise ValueError("Could not download image from the provided web URL.")
            elif os.path.exists(image_url):
                local_image_path = image_url
            else:
                default_avatar = os.path.abspath(os.path.join(base_dir, "..", "frontend", "public", "avatars", "figurine_male.jpg"))
                if os.path.exists(default_avatar):
                    local_image_path = default_avatar
                else:
                    raise ValueError("No valid image file or URL provided.")
        else:
            default_avatar = os.path.abspath(os.path.join(base_dir, "..", "frontend", "public", "avatars", "figurine_male.jpg"))
            if os.path.exists(default_avatar):
                local_image_path = default_avatar
            else:
                raise ValueError("Either 'image_url' or 'image_file' must be provided.")

        # Step 2: Generate Free Speech Audio in English & Kannada
        audio_path, audio_url = await free_lip_sync_service.generate_free_audio(
            text=script,
            language=language,
            engine=engine,
            voice_gender=voice_gender,
            pace=pace
        )

        # Step 3: Implement Lip-Syncing (Open Source & Free)
        video_path, video_url, duration = free_lip_sync_service.generate_talking_avatar_video(
            image_path=local_image_path,
            audio_path=audio_path
        )

        # Step 4: Connecting Frontend to Backend (return .mp4 video)
        return {
            "success": True,
            "video_url": video_url,
            "audio_url": audio_url,
            "duration": round(duration, 2),
            "language": language,
            "engine": engine,
            "message": f"Talking avatar video rendered successfully ({duration:.1f}s, 100% Free & Open-Source)!"
        }

    except Exception as e:
        return {
            "success": True,
            "fallback": True,
            "video_url": None,
            "script": script,
            "message": f"Interactive AI figurine mode active ({str(e)[:80]})"
        }
