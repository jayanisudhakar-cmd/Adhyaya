from pydantic import BaseModel, Field
from typing import List, Optional

class CourseRequest(BaseModel):
    topic: str = Field(..., description="Topic of the course (e.g. Introduction to Python)")
    language: str = Field(default="English", description="Language of instruction")
    pace: str = Field(default="Medium", description="Pace of learning: Slow, Medium, Fast")

class Lesson(BaseModel):
    title: str
    content: str
    script: str = Field(..., description="TTS-friendly speech script that the virtual teacher will read")

class Module(BaseModel):
    module_title: str
    lessons: List[Lesson]

class CourseResponse(BaseModel):
    title: str
    description: str
    modules: List[Module]

class QuizRequest(BaseModel):
    topic: str
    level: str = Field(default="Medium", description="Difficulty: Easy, Medium, Hard")
    num_questions: int = Field(default=5, description="Number of questions to generate")
    language: Optional[str] = Field(default="English", description="Language of quiz questions")

class Question(BaseModel):
    question_text: str
    options: List[str] = Field(..., description="List of 4 options")
    correct_option: str = Field(..., description="The exact matching correct option from options list")
    explanation: str = Field(..., description="Explanation of why this option is correct")

class QuizResponse(BaseModel):
    topic: str
    level: str
    questions: List[Question]

class AvatarRequest(BaseModel):
    image_url: str = Field(..., description="URL of the teacher avatar image")
    script: str = Field(..., description="Script text that ElevenLabs and D-ID will say")
    voice_id: str = Field(default="21m00Tcm4TlvDq8ikWAM", description="ElevenLabs Voice ID (default: Rachel)")

class ChatMessage(BaseModel):
    role: str = Field(default="user", description="user or assistant")
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    neuro_mode: Optional[str] = "standard"
    language: Optional[str] = "English"

class ChatResponse(BaseModel):
    reply: str
    humor_note: Optional[str] = None
    quick_tips: Optional[List[str]] = []
