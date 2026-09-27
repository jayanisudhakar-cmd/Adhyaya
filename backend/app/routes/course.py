from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import CourseRequest, CourseResponse, QuizRequest, QuizResponse
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/api", tags=["Education Generation"])

# Instantiate services
gemini_service = GeminiService()

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
