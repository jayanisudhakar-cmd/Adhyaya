import json
import logging
import google.generativeai as genai
from app.config import settings
from app.models.schemas import CourseResponse, QuizResponse

logger = logging.getLogger(__name__)

# Configure Google GenAI SDK
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY is not set in environment variables.")

class GeminiService:
    def __init__(self, model_name: str = "gemini-1.5-flash"):
        # We default to gemini-1.5-flash for compatibility, but can be configured to gemini-2.5-flash
        self.model_name = model_name

    def generate_course(self, topic: str, language: str = "English", pace: str = "Medium") -> dict:
        prompt = f"""
        You are an expert personalized AI educator. Generate a structured learning course for a student.
        
        Course Details:
        - Topic: {topic}
        - Language: {language}
        - Pace: {pace} (Ensure modules and depth match a slow, medium, or fast learning style)

        Requirements:
        1. Title and Description for the course.
        2. Create 3 modules. Each module must have 2 lessons (total 6 lessons).
        3. Each lesson must have:
           - A title.
           - Rich learning content (formatted nicely in markdown, 3-4 paragraphs minimum).
           - A speech script ('script'): this is a narration of the lesson designed for text-to-speech. 
             It should be warm, engaging, and read like a teacher speaking directly to the student. No markdown elements in the script, just plain spoken text.
        
        Generate the response exactly matching the JSON schema.
        """
        
        try:
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=CourseResponse
                )
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Error generating course from Gemini: {e}")
            # Fallback to simple generation and manual parsing if schema enforcement fails
            try:
                model = genai.GenerativeModel(self.model_name)
                response = model.generate_content(prompt + "\nReturn a valid JSON string matching the specified course response structure.")
                # Basic cleanup
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text.split("```json")[1].split("```")[0].strip()
                elif text.startswith("```"):
                    text = text.split("```")[1].split("```")[0].strip()
                return json.loads(text)
            except Exception as inner_e:
                logger.error(f"Fallback generation also failed: {inner_e}")
                raise inner_e

    def generate_quiz(self, topic: str, level: str = "Medium", num_questions: int = 5) -> dict:
        prompt = f"""
        You are a academic assessment engine. Generate a personalized test series for the student.
        
        Assessment Details:
        - Topic: {topic}
        - Difficulty Level: {level} (Easy, Medium, Hard)
        - Number of Questions: {num_questions}

        Requirements for each question:
        1. Clear question text.
        2. A list of 4 distinct choices/options.
        3. The exact correct answer (must be a string matching one of the options).
        4. A comprehensive explanation explaining why the correct choice is right.

        Generate the response exactly matching the JSON schema.
        """

        try:
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=QuizResponse
                )
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Error generating quiz from Gemini: {e}")
            try:
                model = genai.GenerativeModel(self.model_name)
                response = model.generate_content(prompt + "\nReturn a valid JSON string matching the specified quiz response structure.")
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text.split("```json")[1].split("```")[0].strip()
                elif text.startswith("```"):
                    text = text.split("```")[1].split("```")[0].strip()
                return json.loads(text)
            except Exception as inner_e:
                logger.error(f"Fallback quiz generation failed: {inner_e}")
                raise inner_e
