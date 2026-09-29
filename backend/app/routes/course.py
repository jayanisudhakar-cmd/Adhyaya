from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import CourseRequest, CourseResponse, QuizRequest, QuizResponse, ChatRequest, ChatResponse
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api", tags=["Education Generation"])



@router.post("/courses/generate", response_model=CourseResponse)
def generate_course_endpoint(request: CourseRequest):
    """
    Generates a personalized 3-module (6-lesson) course syllabus and contents 
    using Gemini 2.5 Flash / Gemini 1.5 Flash based on user topic and pace.
    """
    try:
        course_data = gemini_service.generate_course(
            topic=request.topic,
            language=request.language,
            pace=request.pace
        )
        return course_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate course: {str(e)}")

@router.post("/quizzes/generate", response_model=QuizResponse)
def generate_quiz_endpoint(request: QuizRequest):
    """
    Generates a customized assessment/test series based on topic and difficulty.
    """
    try:
        quiz_data = gemini_service.generate_quiz(
            topic=request.topic,
            level=request.level,
            num_questions=request.num_questions
        )
        return quiz_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """
    Interactive Indianized humorous tutor 'Guru Ji' responding to student questions
    with tailored support for neurodivergent modes (dyslexia, dyscalculia, adhd, sensory, dysgraphia).
    """
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in (request.history or [])]
        reply_data = gemini_service.generate_chat_reply(
            message=request.message,
            history=history_dicts,
            neuro_mode=request.neuro_mode or "standard",
            language=request.language or "English"
        )
        return reply_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.post("/config/set-key")
def set_api_key_endpoint(payload: dict):
    """Allows setting runtime API key for Gemini / ElevenLabs / D-ID."""
    gemini_key = payload.get("gemini_api_key")
    if gemini_key:
        success = gemini_service.set_api_key(gemini_key)
        return {"success": success, "message": "Gemini API key updated" if success else "Invalid key format"}
    return {"success": False, "message": "No key provided"}
