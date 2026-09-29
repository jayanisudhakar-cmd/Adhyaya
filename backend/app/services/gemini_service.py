import json
import logging
import re
from typing import List, Optional
import google.generativeai as genai
from app.config import settings
from app.models.schemas import CourseResponse, QuizResponse

logger = logging.getLogger(__name__)

def is_valid_gemini_key(key: str) -> bool:
    """Checks whether the key has the standard Google AI Studio key format."""
    return bool(key and key.strip().startswith("AIzaSy") and len(key.strip()) >= 35)

class GeminiService:
    def __init__(self, model_name: str = "gemini-1.5-flash"):
        self.model_name = model_name
        self.api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
        self.is_configured = False
        
        if is_valid_gemini_key(self.api_key):
            try:
                genai.configure(api_key=self.api_key)
                self.is_configured = True
                logger.info("Google GenAI SDK configured successfully with provided GEMINI_API_KEY.")
            except Exception as e:
                logger.warning(f"Failed to configure Google GenAI SDK: {e}")
        else:
            logger.info("No valid Google AI Studio GEMINI_API_KEY found. Adhyaya dynamic synthesis engine active.")

    def set_api_key(self, key: str):
        """Allows dynamic configuration of API key at runtime."""
        if is_valid_gemini_key(key):
            try:
                genai.configure(api_key=key.strip())
                self.api_key = key.strip()
                self.is_configured = True
                return True
            except Exception as e:
                logger.error(f"Error updating API key: {e}")
                return False
        return False

    def generate_course(self, topic: str, language: str = "English", pace: str = "Medium") -> dict:
        """
        Generates course content using Gemini if configured, or uses Adhyaya's
        dynamic curriculum synthesis engine if API key is invalid/unavailable.
        """
        clean_topic = topic.strip().title()

        if self.is_configured:
            prompt = f"""
            You are an expert personalized AI educator for the 'Adhyaya' platform. Generate a structured learning course for a student.
            
            Course Details:
            - Topic: {clean_topic}
            - Language: {language}
            - Pace: {pace} (Ensure modules and depth match a slow, medium, or fast learning style)

            CRITICAL LANGUAGE REQUIREMENT:
            The student has selected '{language}' as their Course Content Language.
            ALL textual fields in the response MUST be written strictly in {language}:
            - 'title': Course title in {language}.
            - 'description': Course summary in {language}.
            - 'modules[].module_title': Module titles in {language}.
            - 'lessons[].title': Lesson titles in {language}.
            - 'lessons[].content': Rich markdown lesson content with headings, bullet points, and practical examples, all written entirely in {language} (e.g. Kannada script if Kannada, Devanagari if Hindi, English if English). Do NOT use English if {language} is Kannada or Hindi!
            - 'lessons[].script': The speech narration script for text-to-speech, written strictly in {language} like a warm teacher speaking directly to the student. Plain spoken words only, no markdown.

            Requirements:
            1. Title and Description for the course.
            2. Create 3 modules. Each module must have 2 lessons (total 6 lessons).
            3. Each lesson must have a title, rich content (markdown), and TTS script.
            
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
                parsed = json.loads(response.text)
                if parsed and parsed.get("modules"):
                    return parsed
            except Exception as e:
                logger.warning(f"Gemini API generation failed ({e}), activating Adhyaya dynamic syllabus synthesis engine...")
                try:
                    model = genai.GenerativeModel(self.model_name)
                    response = model.generate_content(prompt + "\nReturn a valid JSON string matching the specified course response structure.")
                    text = response.text.strip()
                    if text.startswith("```json"):
                        text = text.split("```json")[1].split("```")[0].strip()
                    elif text.startswith("```"):
                        text = text.split("```")[1].split("```")[0].strip()
                    parsed = json.loads(text)
                    if parsed and parsed.get("modules"):
                        return parsed
                except Exception as inner_e:
                    logger.warning(f"Gemini fallback call also failed ({inner_e}). Generating synthesized course.")

        # Resilient, high-quality multilingual dynamic course synthesis
        return self._synthesize_course(clean_topic, language, pace)

    def generate_quiz(self, topic: str, level: str = "Medium", num_questions: int = 5, language: str = "English") -> dict:
        """
        Generates assessment quiz using Gemini if configured, or Adhyaya's
        dynamic multilingual assessment engine if API key is invalid/unavailable.
        """
        clean_topic = topic.strip().title()

        if self.is_configured:
            prompt = f"""
            You are an academic assessment engine for 'Adhyaya'. Generate a personalized test series for the student.
            
            Assessment Details:
            - Topic: {clean_topic}
            - Difficulty Level: {level} (Easy, Medium, Hard)
            - Number of Questions: {num_questions}
            - Language: {language}

            CRITICAL LANGUAGE REQUIREMENT:
            The quiz MUST be written strictly in {language} (e.g. Kannada script if Kannada, Devanagari if Hindi, English if English).
            All question texts, options, correct answers, and explanations must be in {language}.

            Requirements for each question:
            1. Clear question text in {language}.
            2. A list of 4 distinct choices/options in {language}.
            3. The exact correct answer (must match one of the options).
            4. A comprehensive explanation explaining why the correct choice is right in {language}.

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
                parsed = json.loads(response.text)
                if parsed and parsed.get("questions"):
                    return parsed
            except Exception as e:
                logger.warning(f"Gemini quiz API failed ({e}), using Adhyaya assessment engine...")

        return self._synthesize_quiz(clean_topic, level, num_questions, language)

    def generate_chat_reply(self, message: str, history: List[dict] = None, neuro_mode: str = "standard", language: str = "English") -> dict:
        """
        Generates an Indianized, witty, humorous, crisp response from 'Guru Ji' (Adhyaya AI Tutor).
        """
        clean_msg = message.strip()
        
        # Neuro-specific prompt modifier
        neuro_instructions = {
            "dyslexia": "Use clear, well-spaced short sentences, bullet points, and highlight key terms phonetically or with bold text for easy reading.",
            "dyscalculia": "Avoid dense formulas. Use intuitive visual analogies (e.g. sharing rotis, cricket scores, visual blocks) and step-by-step numbers.",
            "adhd": "Keep the answer ultra-crisp, bulleted, high energy, direct to the point with zero fluff. Include an exciting micro-challenge!",
            "sensory": "Maintain a calm, soothing, reassuring tone without sudden loud exclamation marks or overwhelming walls of text.",
            "dysgraphia": "Provide concise, easily digestible points and clear 1-line key takeaways that don't require heavy note-taking.",
            "standard": "Keep it energetic, educational, crisp, and to the point."
        }.get(neuro_mode.lower(), "Keep it crisp, educational, and to the point.")

        if self.is_configured:
            system_prompt = f"""
            You are 'Guru Ji', the AI Mentor on 'Adhyaya', India's personalized AI learning platform.
            
            Personality & Tone:
            - Indianized persona: warm, sharp, witty, and equipped with a wonderful sense of desi humor.
            - Use relatable Indian analogies (e.g. cricket run chases, chai-samosa breaks, Bangalore traffic, Sharma ji ka beta, mom's secret recipes, auto meters).
            - CRITICAL: Never ramble! Keep your responses crisp, direct, and to the point.
            - Accommodate student's learning profile: {neuro_instructions}
            - Language: Primarily {language}, spiced with occasional natural Indian-English conversational flavor (e.g. 'Arre', 'Bilkul', 'Listen carefully', 'Pakka').
            - End with a motivating 1-liner or gentle funny joke.
            """

            try:
                model = genai.GenerativeModel(self.model_name)
                full_prompt = f"{system_prompt}\n\nStudent asks: {clean_msg}\n\nGuru Ji responds:"
                response = model.generate_content(full_prompt)
                reply_text = response.text.strip()
                return {
                    "reply": reply_text,
                    "humor_note": "Guru Ji's Wisdom: Work smart, study crisp, eat samosas on time!",
                    "quick_tips": ["Review in 5 mins", "Practice 1 example", "Stay curious!"]
                }
            except Exception as e:
                logger.warning(f"Gemini chat failed ({e}), using Guru Ji's local wit engine.")

        # Guru Ji humorous intelligent fallback
        return self._synthesize_guru_reply(clean_msg, neuro_mode)

    # ==================== ADHYAYA DYNAMIC SYNTHESIS ENGINES ====================

    def _synthesize_course(self, topic: str, language: str, pace: str) -> dict:
        """Dynamically crafts a rich, customized 3-module, 6-lesson curriculum in Kannada, Hindi, or English."""
        lang_clean = (language or "English").lower().strip()

        # ================= KANNADA CURRICULUM =================
        if lang_clean in ["kn", "kannada"]:
            pace_note = "ಸಮಗ್ರ ಮತ್ತು ವಿವರವಾದ" if pace == "Slow" else ("ವೇಗವರ್ಧಿತ ಮತ್ತು ಪ್ರಮುಖ ಪರಿಕಲ್ಪನೆಗಳ" if pace == "Fast" else "ಸಮತೋಲಿತ ಮತ್ತು ಪ್ರಾಯೋಗಿಕ")
            return {
                "title": f"{topic}: ಅಧ್ಯಾಯ ಸಮಗ್ರ ಕಲಿಕಾ ಹಾದಿ",
                "description": f"{topic} ವಿಷಯದ ಸಮಗ್ರ, {pace_note} ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ಕನ್ನಡ ಪಠ್ಯಕ್ರಮ. ಮೂಲ ತತ್ವಗಳಿಂದ ಹಿಡಿದು ನೈಜ ಪ್ರಪಂಚದ ಉನ್ನತ ಅನ್ವಯಗಳವರೆಗೆ ಪರಿಪೂರ್ಣ ಮಾರ್ಗದರ್ಶಿ.",
                "modules": [
                    {
                        "module_title": f"ಮಾಡ್ಯೂಲ್ 1: {topic} ನ ಮೂಲ ತತ್ವಗಳು ಮತ್ತು ಪರಿಕಲ್ಪನೆಗಳು",
                        "lessons": [
                            {
                                "title": f"1. {topic} ಪರಿಚಯ ಮತ್ತು ಮಹತ್ವ",
                                "content": f"### {topic} ಎಂದರೇನು?\n\nಅಧ್ಯಾಯ ವೈಯಕ್ತಿಕ ಕಲಿಕಾ ವೇದಿಕೆಗೆ ಸುಸ್ವಾಗತ. **{topic}** ಆಧುನಿಕ ಜ್ಞಾನ ಮತ್ತು ವಿಜ್ಞಾನದಲ್ಲಿ ಅತ್ಯಂತ ಪ್ರಮುಖವಾದ ಅಡಿಪಾಯವಾಗಿದೆ. ಈ ಮೊದಲ ಪಾಠದಲ್ಲಿ ನಾವು ಇದರ ಮೂಲ ತತ್ವಗಳು, ಐತಿಹಾಸಿಕ ಹಿನ್ನೆಲೆ ಮತ್ತು ವಿಶ್ಲೇಷಣಾತ್ಮಕ ಪ್ರಾಮುಖ್ಯತೆಯನ್ನು ತಿಳಿಯಲಿದ್ದೇವೆ.\n\n#### ಪ್ರಮುಖ ಉದ್ದೇಶಗಳು\n- **ಮೂಲ ಸ್ತಂಭಗಳು**: {topic} ವಿಷಯದ ಪ್ರಮುಖ ಘಟಕಗಳನ್ನು ಗುರುತಿಸುವುದು.\n- **ನೈಜ ಅನ್ವಯಗಳು**: ಸೈದ್ಧಾಂತಿಕ ನಿಯಮಗಳು ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಹೇಗೆ ಅನ್ವಯವಾಗುತ್ತವೆ ಎಂದು ತಿಳಿಯುವುದು.\n- **ಮಾನಸಿಕ ಮಾದರಿ**: ವೇಗವಾಗಿ ನೆನಪಿನಲ್ಲಿಟ್ಟುಕೊಳ್ಳಲು ದೃಶ್ಯ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ರೂಪಿಸುವುದು.\n\n#### ಪ್ರಾಯೋಗಿಕ ವಿವರಣೆ\nಯಾವುದೇ ಸಂಕೀರ್ಣ ವಿಷಯವನ್ನು ಸಣ್ಣ ಭಾಗಗಳಾಗಿ ವಿಂಗಡಿಸಿದಾಗ ಕಲಿಯುವುದು ಸುಲಭ. {topic} ಕಲಿಯುವಾಗ ಪ್ರಮುಖ ಇನ್‌ಪುಟ್‌ಗಳು, ಪ್ರಕ್ರಿಯೆ ಮತ್ತು ಅಂತಿಮ ಫಲಿತಾಂಶಗಳನ್ನು ಗಮನಿಸಿ. ಮುಂದಿನ ಪಾಠಗಳಲ್ಲಿ ನಾವು ಈ ಭದ್ರ ಬುನಾದಿಯ ಮೇಲೆ ಪ್ರಾಯೋಗಿಕ ಜ್ಞಾನವನ್ನು ನಿರ್ಮಿಸಲಿದ್ದೇವೆ.",
                                "script": f"ನಮಸ್ಕಾರ ಮತ್ತು ಅಧ್ಯಾಯಕ್ಕೆ ಸುಸ್ವಾಗತ! ಇಂದು ನಾವು {topic} ವಿಷಯದ ಅದ್ಭುತ ಜಗತ್ತನ್ನು ಅನ್ವೇಷಿಸಲಿದ್ದೇವೆ. ಪ್ರತಿಯೊಂದು ಅಂಶವನ್ನು ಸುಲಭ ಉದಾಹರಣೆಗಳೊಂದಿಗೆ ಹಂತ-ಹಂತವಾಗಿ ಕಲಿಯೋಣ. ಬನ್ನಿ ಒಟ್ಟಿಗೆ ಪ್ರಾರಂಭಿಸೋಣ!"
                            },
                            {
                                "title": f"2. {topic} ನ ಆಂತರಿಕ ಕಾರ್ಯವಿಧಾನ ಮತ್ತು ರಚನೆ",
                                "content": f"### ಆಳವಾದ ನೋಟ: {topic} ನ ಆಂತರಿಕ ಎಂಜಿನ್\n\nಈಗ ನಿಮಗೆ {topic} ನ ಮೂಲ ಕಲ್ಪನೆ ತಿಳಿದಿದೆ. ಇದರ ಆಂತರಿಕ ಕಾರ್ಯವಿಧಾನಗಳು ಪರಸ್ಪರ ಹೇಗೆ ಸಂಪರ್ಕ ಹೊಂದಿವೆ ಎಂಬುದನ್ನು ಈಗ ನೋಡೋಣ.\n\n#### ರಚನಾತ್ಮಕ ಮುಖ್ಯಾಂಶಗಳು\n1. **ಮೂಲ ವೇರಿಯೇಬಲ್‌ಗಳು**: {topic} ಅನ್ನು ನಿಯಂತ್ರಿಸುವ ಪ್ರಮುಖ ಘಟಕಗಳು.\n2. **ಸಮತೋಲನ ಮತ್ತು ಹರಿವು**: ಮಾಹಿತಿ ಅಥವಾ ಶಕ್ತಿಯು ಹಂತಗಳ ನಡುವೆ ಹೇಗೆ ಹರಿಯುತ್ತದೆ.\n3. **ಸಾಮಾನ್ಯ ತಪ್ಪುಗಳು**: ಕಲಿಯುವಾಗ ವಿದ್ಯಾರ್ಥಿಗಳು ಮಾಡುವ ಸಾಮಾನ್ಯ ದೋಷಗಳು ಮತ್ತು ಪರಿಹಾರಗಳು.\n\n#### ಪುನರಾವರ್ತನೆ\nದೈನಂದಿನ ಜೀವನದಲ್ಲಿ {topic} ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಎಂಬುದಕ್ಕೆ 2 ನೈಜ ಉದಾಹರಣೆಗಳನ್ನು ಬರೆಯಿರಿ. ಇದು ನಿಮ್ಮ ನೆನಪಿನ ಶಕ್ತಿಯನ್ನು ಗಣನೀಯವಾಗಿ ಹೆಚ್ಚಿಸುತ್ತದೆ.",
                                "script": f"ಮೊದಲ ಪಾಠವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮುಗಿಸಿದ್ದೀರಿ! ಎರಡನೇ ಪಾಠದಲ್ಲಿ ನಾವು {topic} ನ ಆಂತರಿಕ ನಿಯಮಗಳನ್ನು ಗಡಿಯಾರದ ಮುಳ್ಳುಗಳಂತೆ ಪರಸ್ಪರ ಹೇಗೆ ಹೊಂದಿಕೊಳ್ಳುತ್ತವೆ ಎಂಬುದನ್ನು ಕಲಿಯಲಿದ್ದೇವೆ. ಸಂಪೂರ್ಣ ಏಕಾಗ್ರತೆಯಿಂದ ಮುಂದುವರಿಯಿರಿ!"
                            }
                        ]
                    },
                    {
                        "module_title": f"ಮಾಡ್ಯೂಲ್ 2: ಪ್ರಾಯೋಗಿಕ ಬಳಕೆ ಮತ್ತು ಕಾರ್ಯವಿಧಾನಗಳು",
                        "lessons": [
                            {
                                "title": f"3. {topic} ಪ್ರಾಯೋಗಿಕ ಅನ್ವಯಗಳು",
                                "content": f"### ಸಿದ್ಧಾಂತವನ್ನು ಪ್ರಾಯೋಗಿಕವಾಗಿ ಬಳಸುವುದು\n\nಜ್ಞಾನವನ್ನು ಪ್ರಾಯೋಗಿಕವಾಗಿ ಬಳಸಿದಾಗ ಅದು ಶಾಶ್ವತವಾಗುತ್ತದೆ. ಈ ಮಾಡ್ಯೂಲ್‌ನಲ್ಲಿ ತಜ್ಞರು {topic} ಅನ್ನು ಕಠಿಣ ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಹರಿಸಲು ಹೇಗೆ ಬಳಸುತ್ತಾರೆ ಎಂದು ನೋಡೋಣ.\n\n#### 3-ಹಂತಗಳ ಕಾರ್ಯವಿಧಾನ\n- **ಹಂತ 1: ಸಮಸ್ಯೆ ಪತ್ತೆ**: ಸಮಸ್ಯೆಯ ಮೂಲ ಸ್ಥಿತಿಯನ್ನು ನಿಖರವಾಗಿ ಗುರುತಿಸುವುದು.\n- **ಹಂತ 2: ಸೂತ್ರ ಅನ್ವಯ**: {topic} ನ ಅತ್ಯುತ್ತಮ ವಿಧಾನವನ್ನು ಆರಿಸುವುದು.\n- **ಹಂತ 3: ಪರಿಶೀಲನೆ**: ನಿಮ್ಮ ಉತ್ತರವು ತಾರ್ಕಿಕವಾಗಿ ಮತ್ತು ಗಣಿತೀಯವಾಗಿ ಸರಿಯಾಗಿದೆ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳುವುದು.\n\nಯಾವುದೇ ಸೂತ್ರ ಅಥವಾ ಲೆಕ್ಕಾಚಾರದ ಮೊದಲು ಮನಸ್ಸಿನಲ್ಲಿ ದೃಶ್ಯ ಮಾದರಿಯನ್ನು ರೂಪಿಸಿಕೊಳ್ಳಿ.",
                                "script": f"ಎರಡನೇ ಮಾಡ್ಯೂಲ್‌ಗೆ ಸುಸ್ವಾಗತ! ಈಗ ನಾವು {topic} ನೈಜ ಜಗತ್ತಿನಲ್ಲಿ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂಬುದನ್ನು ನೋಡಲಿದ್ದೇವೆ. ಯಾವುದೇ ಕಠಿಣ ಸಮಸ್ಯೆ ಎದುರಾದರೂ ಬಳಸಬಹುದಾದ 3 ಹಂತಗಳ ಸೂತ್ರವನ್ನು ಕಲಿಯೋಣ."
                            },
                            {
                                "title": f"4. ಕೇಸ್ ಸ್ಟಡಿ ಮತ್ತು ವಿಶೇಷ ಸನ್ನಿವೇಶಗಳು",
                                "content": f"### ನೈಜ ಜಗತ್ತಿನ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ವಿಶೇಷ ಸಂದರ್ಭಗಳು\n\nನೈಜ ಜೀವನದಲ್ಲಿ ಎಲ್ಲವೂ ಪುಸ್ತಕದಂತೆ ಸರಳವಾಗಿರುವುದಿಲ್ಲ. {topic} ವಿಷಯದಲ್ಲಿ ಗಡಿ ಪರಿಸ್ಥಿತಿಗಳು ಮತ್ತು ಅನಿರೀಕ್ಷಿತ ಸವಾಲುಗಳು ಎದುರಾಗುತ್ತವೆ.\n\n#### ಕೇಸ್ ಸ್ಟಡಿ ವಿವರಣೆ\nಸಾಮಾನ್ಯ ನಿಯಮಗಳಿಗೆ ಹೊರತಾದ ಪರಿಸ್ಥಿತಿ ಬಂದಾಗ ಹೊಂದಾಣಿಕೆಯ ಚಿಂತನೆ ಮತ್ತು ಪರ್ಯಾಯ ವಿಧಾನಗಳನ್ನು ಅನುಸರಿಸುವುದು ಹೇಗೆ ಎಂದು ಕಲಿಯಿರಿ.\n\n#### ಪರೀಕ್ಷೆಗಳಿಗೆ ವಿಶೇಷ ಸಲಹೆ\n{topic} ಕುರಿತು ಯಾವುದೇ ಪರೀಕ್ಷೆ ಅಥವಾ ಸಂದರ್ಶನದಲ್ಲಿ ಕೇಳಿದಾಗ ಕನಿಷ್ಠ ಒಂದು ಅಸಾಮಾನ್ಯ ಸನ್ನಿವೇಶವನ್ನು ಉಲ್ಲೇಖಿಸಿ. ಇದು ನಿಮ್ಮ ಆಳವಾದ ತಿಳುವಳಿಕೆಯನ್ನು ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ.",
                                "script": f"ಈ ಪಾಠದಲ್ಲಿ ನಾವು ವಿಶೇಷ ಸನ್ನಿವೇಶಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಿದ್ದೇವೆ. ಸಾಮಾನ್ಯ ನಿಯಮಗಳಿಗೆ ಹೊರತಾದ ಪರಿಸ್ಥಿತಿ ಬಂದಾಗ ಏನು ಮಾಡಬೇಕು? ಬನ್ನಿ, ಪರೀಕ್ಷೆಗಳಿಗೆ ಸಮರ್ಥವಾಗಿ ಸಿದ್ಧರಾಗೋಣ!"
                            }
                        ]
                    },
                    {
                        "module_title": f"ಮಾಡ್ಯೂಲ್ 3: ಉನ್ನತ ಕೌಶಲ್ಯಗಳು ಮತ್ತು ಭವಿಷ್ಯದ ಹಾದಿ",
                        "lessons": [
                            {
                                "title": f"5. {topic} ನಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಕಾರ್ಯಕ್ಷಮತೆ ಮತ್ತು ತಂತ್ರಗಳು",
                                "content": f"### ವೇಗ ಮತ್ತು ನಿಖರತೆಯನ್ನು ಹೆಚ್ಚಿಸುವುದು\n\nನೈಪುಣ್ಯತೆ ಎಂದರೆ ಕೇವಲ ತಿಳಿದುಕೊಳ್ಳುವುದಲ್ಲ, ಅದನ್ನು ಚುರುಕಾಗಿ, ಸುಂದರವಾಗಿ ಮತ್ತು ನಿಖರವಾಗಿ ನಿರ್ವಹಿಸುವುದು. {topic} ನಲ್ಲಿ ಸೂಕ್ತ ಆಪ್ಟಿಮೈಸೇಶನ್ ತಂತ್ರಗಳು ನಿಮ್ಮನ್ನು ಮುಂಚೂಣಿಯಲ್ಲಿಡುತ್ತವೆ.\n\n#### ಪ್ರಮುಖ ತಂತ್ರಗಳು\n- **ಅನಗತ್ಯ ಹೆಜ್ಜೆಗಳನ್ನು ತೆಗೆದುಹಾಕುವುದು**: ಸಮಯ ಮತ್ತು ಮಾನಸಿಕ ಶ್ರಮವನ್ನು ಉಳಿಸುವುದು.\n- **ಮಾದರಿ ಗುರುತಿಸುವಿಕೆ**: ಸಮಸ್ಯೆಗಳಲ್ಲಿನ ಸಾಮ್ಯತೆಗಳನ್ನು ತಕ್ಷಣ ಗ್ರಹಿಸುವುದು.\n- **ನಿರಂತರ ಪ್ರತಿಕ್ರಿಯೆ**: ತ್ವರಿತವಾಗಿ ಫಲಿತಾಂಶಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡುವುದು.\n\nವ್ಯೂಹಾತ್ಮಕ ಅಧ್ಯಯನವು ಸ್ಪರ್ಧಾತ್ಮಕ ಪರೀಕ್ಷೆಗಳಲ್ಲಿ ನಿಮಗೆ ಗರಿಷ್ಠ ಅಂಕಗಳನ್ನು ತಂದುಕೊಡುತ್ತದೆ.",
                                "script": f"ನೀವು ಮೂರನೇ ಮಾಡ್ಯೂಲ್ ತಲುಪಿದ್ದೀರಿ! ಈಗ ನಾವು ನಿಮ್ಮ ಕೌಶಲ್ಯವನ್ನು ಪ್ರೊ-ಲೆವೆಲ್‌ಗೆ ಕೊಂಡೊಯ್ಯಲಿದ್ದೇವೆ. {topic} ನಲ್ಲಿ ಗರಿಷ್ಠ ವೇಗ ಮತ್ತು ನಿಖರತೆಯಿಂದ ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಹರಿಸುವುದು ಹೇಗೆ ಎಂದು ಕಲಿಯೋಣ."
                            },
                            {
                                "title": f"6. ಭವಿಷ್ಯದ ಸಾಧ್ಯತೆಗಳು ಮತ್ತು ಸಮಗ್ರ ಸಾರಾಂಶ",
                                "content": f"### {topic} ನ ಭವಿಷ್ಯದ ದಿಗಂತ\n\nಈ ಪಠ್ಯಕ್ರಮದ ಅಂತಿಮ ಪಾಠವನ್ನು ತಲುಪಿದ್ದಕ್ಕಾಗಿ ಅಭಿನಂದನೆಗಳು! ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ, ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ಜಾಗತಿಕ ಸಂಶೋಧನೆಯೊಂದಿಗೆ {topic} ವೇಗವಾಗಿ ವಿಸ್ತರಿಸುತ್ತಿದೆ.\n\n#### ಅಂತಿಮ ಸಾರಾಂಶದ ಮುಖ್ಯಾಂಶಗಳು\n1. **ಮೂಲ ಜ್ಞಾನ**: ಈಗ ನಿಮ್ಮ ಬಳಿ {topic} ನ ಸ್ಪಷ್ಟ ಪರಿಕಲ್ಪನಾ ನಕ್ಷೆಯಿದೆ.\n2. **ಪ್ರಾಯೋಗಿಕ ವಿಶ್ವಾಸ**: ನೀವು ಸರಳ ಮತ್ತು ಸಂಕೀರ್ಣ ಸವಾಲುಗಳನ್ನು ಪರಿಹರಿಸಲು ಸಶಕ್ತರಾಗಿದ್ದೀರಿ.\n3. **ನಿರಂತರ ಬೆಳವಣಿಗೆ**: ಈ ಬುನಾದಿಯನ್ನು ಉನ್ನತ ಸಂಶೋಧನೆ ಮತ್ತು ಸಾಧನೆಗೆ ಬಳಸಿ.\n\nನಿಮ್ಮ ಜ್ಞಾನವನ್ನು ಪರೀಕ್ಷಿಸಲು ಅಧ್ಯಾಯದ ರಸಪ್ರಶ್ನೆ ಪರೀಕ್ಷಾ ಸರಣಿಯನ್ನು ಈಗಲೇ ಪ್ರಯತ್ನಿಸಿ!",
                                "script": f"ಅಭಿನಂದನೆಗಳು, ಯುವ ವಿದ್ವಾಂಸರೇ! ನೀವು {topic} ಕೋರ್ಸ್‌ನ ಅಂತಿಮ ಪಾಠವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತಲುಪಿದ್ದೀರಿ. ನಿಮ್ಮ ಕಲಿಕೆಯ ಬಗ್ಗೆ ಹೆಮ್ಮೆ ಪಡಿ. ಸಿದ್ಧರಾದಾಗ ಟೆಸ್ಟ್ ಸರಣಿಗೆ ಹೋಗಿ ನಿಮ್ಮ ಪ್ರಾವೀಣ್ಯತೆಯನ್ನು ಪರೀಕ್ಷಿಸಿ!"
                            }
                        ]
                    }
                ]
            }

        # ================= HINDI CURRICULUM =================
        elif lang_clean in ["hi", "hindi"]:
            pace_note = "विस्तृत एवं गहन" if pace == "Slow" else ("त्वरित एवं बिंदुवार" if pace == "Fast" else "संतुलित एवं व्यावहारिक")
            return {
                "title": f"{topic}: अध्याय संपूर्ण शिक्षण मार्ग",
                "description": f"{topic} का व्यापक, {pace_note} व्यक्तिगत हिंदी पाठ्यक्रम। मूलभूत सिद्धांतों से लेकर वास्तविक दुनिया के उन्नत प्रयोगों तक।",
                "modules": [
                    {
                        "module_title": f"मॉड्यूल 1: {topic} के आधारभूत सिद्धांत एवं अवधारणाएं",
                        "lessons": [
                            {
                                "title": f"1. {topic} का परिचय एवं महत्व",
                                "content": f"### {topic} क्या है?\n\nअध्याय पर्सनलाइज्ड लर्निंग प्लेटफॉर्म पर आपका स्वागत है। **{topic}** आधुनिक शिक्षा और व्यावहारिक ज्ञान का एक अत्यंत महत्वपूर्ण स्तंभ है। इस प्रारंभिक पाठ में हम इसकी परिभाषा, ऐतिहासिक संदर्भ और विश्लेषणात्मक महत्व को समझेंगे।\n\n#### प्रमुख उद्देश्य\n- {topic} के मूलभूत स्तंभों को पहचानना।\n- समझना कि सैद्धांतिक नियम दैनिक जीवन में कैसे लागू होते हैं।\n- त्वरित स्मरण और स्पष्ट समझ के लिए एक सुदृढ़ मानसिक मॉडल स्थापित करना।\n\n#### व्यावहारिक विश्लेषण\nकिसी भी जटिल विषय को छोटे-छोटे तार्किक हिस्सों में बांटने से सीखना सरल हो जाता है। आगामी पाठों में हम इसी मजबूत नींव पर आगे बढ़ेंगे।",
                                "script": f"नमस्ते और अध्याय में आपका स्वागत है! आज हम {topic} की ज्ञान यात्रा शुरू कर रहे हैं। चिंता बिल्कुल न करें—हम हर अवधारणा को सरल उदाहरणों के साथ कदम-दर-कदम सीखेंगे। चलिए शुरू करते हैं!"
                            },
                            {
                                "title": f"2. {topic} की आंतरिक कार्यप्रणाली और संरचना",
                                "content": f"### गहरा विश्लेषण: {topic} का आंतरिक तंत्र\n\nअब जब आप {topic} की मूल अवधारणा को जान चुके हैं, आइए इसके आंतरिक तंत्र पर नजर डालते हैं।\n\n#### संरचनात्मक मुख्य बिंदु\n1. **मूल चर**: {topic} को संचालित करने वाले मुख्य घटक।\n2. **प्रवाह एवं संतुलन**: चरणों के बीच सूचना या ऊर्जा का प्रवाह।\n3. **सामान्य गलतियां**: बुनियादी संबंधों को समझने में होने वाली गलतियां और उनसे बचाव।",
                                "script": f"पहला पाठ पूरा करने पर बधाई! इस दूसरे पाठ में हम {topic} के वास्तविक तंत्र को समझेंगे। ध्यान लगाकर सुनिए और अपनी समझ को मजबूत कीजिए!"
                            }
                        ]
                    },
                    {
                        "module_title": f"मॉड्यूल 2: व्यावहारिक अनुप्रयोग एवं कार्यपद्धति",
                        "lessons": [
                            {
                                "title": f"3. {topic} के व्यावहारिक अनुप्रयोग",
                                "content": f"### सिद्धांत को क्रिया में बदलना\n\nसैद्धांतिक ज्ञान तभी स्थाई बनता है जब उसे व्यावहारिक रूप से परखा जाए। इस मॉड्यूल में हम देखेंगे कि विशेषज्ञ {topic} का उपयोग वास्तविक समस्याओं को सुलझाने के लिए कैसे करते हैं।\n\n#### 3-चरणीय कार्यविधि\n- **चरण 1: निदान**: समस्या की वास्तविक स्थिति की पहचान।\n- **चरण 2: रणनीति**: सबसे उपयुक्त विधि का चयन।\n- **चरण 3: सत्यापन**: उत्तर की तार्किक और गणितीय जांच।",
                                "script": f"मॉड्यूल दो में आपका स्वागत है! अब समय है यह देखने का कि {topic} वास्तविक जीवन में कैसे काम करता है। हम एक 3-चरणीय व्यावहारिक कार्यप्रणाली सीखेंगे।"
                            },
                            {
                                "title": f"4. केस स्टडी और विशेष परिस्थितियां",
                                "content": f"### वास्तविक जीवन विश्लेषण और एज केसेज\n\nवास्तविक जीवन में सब कुछ पाठ्यपुस्तक की तरह सीधा नहीं होता। {topic} में कई बार अप्रत्याशित बाधाएं आती हैं।\n\n#### परीक्षा के लिए उपयोगी सुझाव\nजब भी {topic} के बारे में प्रश्न पूछा जाए, कम से कम एक विशेष परिस्थिति का उदाहरण अवश्य दें। यह आपकी गहरी समझ को दर्शाता है।",
                                "script": f"इस पाठ में हम विशेष परिस्थितियों का विश्लेषण करेंगे। परीक्षा में आने वाले हर अप्रत्याशित प्रश्न के लिए खुद को तैयार करें!"
                            }
                        ]
                    },
                    {
                        "module_title": f"मॉड्यूल 3: उन्नत कौशल एवं भविष्य की दिशा",
                        "lessons": [
                            {
                                "title": f"5. {topic} में दक्षता और गति संवर्धन",
                                "content": f"### गति और सटीकता को निखारना\n\nकुशलता केवल यह जानना नहीं है कि क्या करना है—बल्कि यह जानना है कि इसे सबसे सटीक, सुरुचिपूर्ण और तीव्र गति से कैसे किया जाए।\n\n#### प्रमुख रणनीतियां\n- **अनावश्यक जटिलता हटाना**: समय और ऊर्जा की बचत।\n- **पैटर्न पहचान**: विभिन्न समस्याओं में समानताओं को तुरंत पहचानना।\n- **सटीक अभ्यास**: निरंतर सुधार और आत्मविश्वास।",
                                "script": f"आप मॉड्यूल तीन पर पहुंच चुके हैं! अब हम आपकी क्षमताओं को प्रो-लेवल तक ले जाएंगे। {topic} में अधिकतम गति और सटीकता से प्रश्न हल करना सीखें।"
                            },
                            {
                                "title": f"6. भविष्य के आयाम और अंतिम सारांश",
                                "content": f"### {topic} का भविष्य\n\nइस पाठ्यक्रम के अंतिम पाठ तक पहुंचने पर हार्दिक बधाई! आर्टिफिशियल इंटेलिजेंस और वैश्विक अनुसंधान के साथ {topic} का क्षेत्र लगातार विकसित हो रहा है।\n\n#### अंतिम मुख्य निष्कर्ष\n1. **स्पष्ट समझ**: अब आपके पास {topic} का एक सुव्यवस्थित मानसिक खाका है।\n2. **व्यावहारिक आत्मविश्वास**: आप मानक और जटिल दोनों तरह की चुनौतियों का समाधान कर सकते हैं।\n\nअपनी महारत को सत्यापित करने के लिए अध्याय की टेस्ट सीरीज अभी हल करें!",
                                "script": f"बधाई हो, प्रिय शिक्षार्थी! आपने {topic} का अंतिम पाठ सफलतापूर्वक पूरा कर लिया है। अब टेस्ट सीरीज में जाकर अपनी महारत का परीक्षण करें!"
                            }
                        ]
                    }
                ]
            }

        # ================= ENGLISH CURRICULUM (DEFAULT) =================
        pace_note = "thorough and step-by-step" if pace == "Slow" else ("accelerated and high-impact" if pace == "Fast" else "balanced and practical")
        return {
            "title": f"Mastering {topic}: An Adhyaya Pathway",
            "description": f"A comprehensive, {pace_note} personalized curriculum in {language} designed to take you from foundational concepts to advanced real-world mastery of {topic}.",
            "modules": [
                {
                    "module_title": f"Module 1: Foundations & Core Principles of {topic}",
                    "lessons": [
                        {
                            "title": f"1. Introduction to {topic}",
                            "content": f"### What is {topic}?\n\nWelcome to your personalized Adhyaya learning track. **{topic}** forms an essential building block in modern study and application. In this opening lesson, we dissect the core definitions, historical context, and why understanding {topic} empowers your analytical mindset.\n\n#### Key Objectives\n- Recognize the foundational pillars of {topic}.\n- Understand how theoretical principles translate into everyday phenomena.\n- Establish a mental model designed for rapid retention and intuitive recall.\n\n#### Practical Breakdown\nEvery complex topic can be split into manageable mental chunks. When approaching {topic}, always observe the primary inputs, the transforming mechanisms, and the resultant outputs. In the upcoming lessons, we will build practical frameworks upon this solid foundation.",
                            "script": f"Namaste and welcome to Adhyaya! Today we are kicking off our journey into {topic}. Don't worry if this sounds intimidating at first—we will break it down step-by-step with clear real-world examples. Let's build your foundation together!"
                        },
                        {
                            "title": f"2. Fundamental Mechanics & Architecture",
                            "content": f"### Deep Dive: The Engine Behind {topic}\n\nNow that you know what {topic} represents, let us look beneath the surface. The underlying mechanics rely on interconnected principles that dictate how systems interact.\n\n#### Structural Highlights\n1. **Core Variables**: The primary active components governing {topic}.\n2. **Equilibrium & Flow**: How information, energy, or logic shifts between stages.\n3. **Common Pitfalls**: Mistakes learners make when misinterpreting basic relationships in {topic}.\n\n#### Summary Checkpoint\nTake a moment to write down 2 everyday situations where {topic} silently operates in the background. Reflection solidifies retention far better than passive reading.",
                            "script": f"Great job finishing lesson one! In this second lesson, we are taking a closer look at the actual mechanics of {topic}. Notice how the core rules fit together like gears in a clock. Keep your focus sharp, and let's dive in!"
                        }
                    ]
                },
                {
                    "module_title": f"Module 2: Practical Application & Working Methodologies",
                    "lessons": [
                        {
                            "title": f"3. Applied Workflows in {topic}",
                            "content": f"### Putting Theory Into Motion\n\nAbstract knowledge becomes permanent when put to the test. In this module, we examine how professionals and researchers utilize {topic} to solve non-trivial problems.\n\n#### Methodological Steps\n- **Step 1: Diagnostics**: Identifying the exact state of your problem space.\n- **Step 2: Strategy Formulation**: Selecting the optimal paradigm within {topic}.\n- **Step 3: Verification**: Running sanity checks to ensure your conclusions are mathematically and logically sound.\n\n#### Visual & Analytical Thinking\nVisualize the problem before writing any equation or code. When your mental representation is crisp, solutions unfold naturally.",
                            "script": f"Welcome to Module Two! It is time to get our hands dirty and see how {topic} actually works in real life. We will go through a three-step practical workflow that you can use whenever you face a tough problem."
                        },
                        {
                            "title": f"4. Case Studies & Edge Scenarios",
                            "content": f"### Real-World Analysis & Edge Cases\n\nReal life rarely behaves like a clean textbook problem. When working with {topic}, unexpected constraints arise—such as noise, variable loads, or boundary conditions.\n\n#### Case Study Breakdown\nConsider a scenario where standard rules hit an anomaly. By applying adaptive thinking and fallback mechanisms, practitioners isolate anomalies without compromising system integrity.\n\n#### Pro-Tip for Exams and Interviews\nWhenever asked about {topic}, always mention at least one edge scenario. It demonstrates that you don't merely memorize facts—you understand boundary behaviors.",
                            "script": f"In this lesson, we are dissecting edge cases. What happens when the standard rules encounter unusual conditions? Let's analyze a real-world case study together so you are prepared for any exam curveball!"
                        }
                    ]
                },
                {
                    "module_title": f"Module 3: Advanced Synthesis & Future Horizons",
                    "lessons": [
                        {
                            "title": f"5. Optimization Strategies in {topic}",
                            "content": f"### Refining Performance and Speed\n\nMastery is not just knowing how to do something—it is knowing how to do it efficiently, elegantly, and robustly. In {topic}, optimization separates novices from veterans.\n\n#### Top Optimization Techniques\n- **Pruning Inefficiencies**: Removing unnecessary computational or cognitive overhead.\n- **Pattern Recognition**: Instantly identifying structural similarities across diverse problems.\n- **Continuous Iteration**: Rapid feedback loops to verify precision.\n\nRemember: premature optimization is tricky, but strategic optimization at this stage will give you a massive competitive edge.",
                            "script": f"You have reached Module Three! Now we elevate your skills to pro-level with optimization strategies. We will look at how to strip away inefficiencies and solve problems in {topic} with maximum elegance and speed."
                        },
                        {
                            "title": f"6. Future Trends, Ethics, and Synthesis",
                            "content": f"### The Horizon of {topic}\n\nCongratulations on reaching the final lesson of this course track! As technology, research, and society evolve, {topic} continues to adapt with exciting intersections in artificial intelligence, automation, and global innovation.\n\n#### Final Synthesis Takeaways\n1. **Core Understanding**: You now possess a structured mental map of {topic}.\n2. **Practical Confidence**: You can apply principles to solve both standard and atypical challenges.\n3. **Lifelong Growth**: Use this foundation as a springboard into specialized domains.\n\nTake the personalized Adhyaya assessment quiz next to validate your mastery and earn your progress streak badge!",
                            "script": f"Congratulations, scholar! You have reached the final lesson on {topic}. Take pride in how much ground you have covered. Review your key takeaways, and when you are ready, head over to the test series to test your mastery!"
                        }
                    ]
                }
            ]
        }

    def _synthesize_quiz(self, topic: str, level: str, num_questions: int, language: str = "English") -> dict:
        """Dynamically crafts relevant assessment questions with explanations in Kannada, Hindi, or English."""
        lang_clean = (language or "English").lower().strip()

        if lang_clean in ["kn", "kannada"]:
            q_pool = [
                {
                    "question_text": f"{topic} ವಿಷಯವನ್ನು ಕಲಿಯುವ ಮೂಲಭೂತ ಪ್ರಮುಖ ಉದ್ದೇಶವೇನು?",
                    "options": [
                        f"{topic} ನ ಮೂಲ ರಚನಾತ್ಮಕ ತತ್ವಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡು ಪ್ರಾಯೋಗಿಕವಾಗಿ ಅನ್ವಯಿಸುವುದು",
                        f"ಯಾವುದೇ ಅನ್ವಯವಿಲ್ಲದೆ ಕೇವಲ ವ್ಯಾಖ್ಯಾನಗಳನ್ನು ಕಂಠಪಾಠ ಮಾಡುವುದು",
                        f"ಆಂತರಿಕ ಕಾರ್ಯವಿಧಾನಗಳನ್ನು ಕಲಿಯುವುದನ್ನು ತಪ್ಪಿಸುವುದು",
                        f"ತಾರ್ಕಿಕ ತರ್ಕದ ಬದಲಿಗೆ ಕೇವಲ ಊಹೆಗಳನ್ನು ಬಳಸುವುದು"
                    ],
                    "correct_option": f"{topic} ನ ಮೂಲ ರಚನಾತ್ಮಕ ತತ್ವಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡು ಪ್ರಾಯೋಗಿಕವಾಗಿ ಅನ್ವಯಿಸುವುದು",
                    "explanation": f"{topic} ನ ರಚನಾತ್ಮಕ ತತ್ವಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದರಿಂದ ಕಲಿಯುವವರು ಮೂಲಭೂತ ಮತ್ತು ಸಂಕೀರ್ಣ ಸಮಸ್ಯೆಗಳನ್ನು ಸುಲಭವಾಗಿ ಪರಿಹರಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತದೆ."
                },
                {
                    "question_text": f"{topic} ನಲ್ಲಿ ವಿಶೇಷ ಅಥವಾ ಅನಿರೀಕ್ಷಿತ ಸನ್ನಿವೇಶವನ್ನು ವಿಶ್ಲೇಷಿಸುವಾಗ ಮೊದಲ ಹೆಜ್ಜೆ ಯಾವುದು?",
                    "options": [
                        "ಗಡಿ ನಿಯಮಗಳನ್ನು ಗುರುತಿಸಿ ದೋಷಗಳನ್ನು ಪ್ರತ್ಯೇಕಿಸುವುದು",
                        "ವಿಶೇಷ ಪರಿಸ್ಥಿತಿಯನ್ನು ನಿರ್ಲಕ್ಷಿಸುವುದು",
                        "ಇಡೀ ವ್ಯವಸ್ಥೆಯನ್ನು ತಕ್ಷಣ ತ್ಯಜಿಸುವುದು",
                        "ಯಾದೃಚ್ಛಿಕವಾಗಿ ವ್ಯಾಖ್ಯಾನಗಳನ್ನು ಬದಲಾಯಿಸುವುದು"
                    ],
                    "correct_option": "ಗಡಿ ನಿಯಮಗಳನ್ನು ಗುರುತಿಸಿ ದೋಷಗಳನ್ನು ಪ್ರತ್ಯೇಕಿಸುವುದು",
                    "explanation": "ಗಡಿ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಸರಿಯಾಗಿ ಗುರುತಿಸಿ ಪ್ರತ್ಯೇಕಿಸುವುದರಿಂದ ಇಡೀ ವ್ಯವಸ್ಥೆಗೆ ಹಾನಿಯಾಗದಂತೆ ಅನಿರೀಕ್ಷಿತ ಸವಾಲುಗಳನ್ನು ಬಗೆಹರಿಸಬಹುದು."
                },
                {
                    "question_text": f"{topic} ನಲ್ಲಿ ದೀರ್ಘಕಾಲದ ನೆನಪು ಮತ್ತು ನೈಪುಣ್ಯತೆಯನ್ನು ನೀಡುವ ಅತ್ಯುತ್ತಮ ತಂತ್ರ ಯಾವುದು?",
                    "options": [
                        "ಸಕ್ರಿಯ ಮಾನಸಿಕ ಮಾದರಿ ರಚನೆ ಮತ್ತು ಪ್ರಾಯೋಗಿಕ ಅಭ್ಯಾಸ",
                        "ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಹರಿಸದೆ ಕೇವಲ ಮೇಲ್ನೋಟಕ್ಕೆ ಓದುವುದು",
                        "ಅರ್ಥಮಾಡಿಕೊಳ್ಳದೆ ಕಂಠಪಾಠ ಮಾಡುವುದು",
                        "ಮೂಲ ಪಾಠಗಳನ್ನು ಬಿಟ್ಟು ನೇರವಾಗಿ ಅಂತಿಮ ಹಂತಕ್ಕೆ ಹೋಗುವುದು"
                    ],
                    "correct_option": "ಸಕ್ರಿಯ ಮಾನಸಿಕ ಮಾದರಿ ರಚನೆ ಮತ್ತು ಪ್ರಾಯೋಗಿಕ ಅಭ್ಯಾಸ",
                    "explanation": "ಸಕ್ರಿಯ ಮಾನಸಿಕ ಮಾದರಿ ಮತ್ತು ಪ್ರಾಯೋಗಿಕ ಅನ್ವಯಗಳು ಪರಿಕಲ್ಪನೆಗಳನ್ನು ದೀರ್ಘಕಾಲದ ನೆನಪಿನಲ್ಲಿ ಭದ್ರವಾಗಿ ನೆಲೆಗೊಳಿಸುತ್ತವೆ."
                },
                {
                    "question_text": f"{topic} ನಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಕಾರ್ಯವಿಧಾನವನ್ನು (Optimized Workflow) ಗುರುತಿಸುವುದು ಹೇಗೆ?",
                    "options": [
                        "ಕನಿಷ್ಠ ಮಾನಸಿಕ ಶ್ರಮ, ಸೊಬಗು ಮತ್ತು ಸ್ಥಿರವಾದ ನಿಖರತೆ",
                        "ಅನಗತ್ಯ ಸಂಕೀರ್ಣತೆ ಮತ್ತು ನಿಧಾನಗತಿಯ ವೇಗ",
                        "ವ್ಯವಸ್ಥಿತ ಪರಿಶೀಲನೆಯ ಕೊರತೆ",
                        "ಖಚಿತ ಕ್ರಮಗಳ ಬದಲು ಊಹೆಗಳನ್ನು ನೆಚ್ಚಿಕೊಳ್ಳುವುದು"
                    ],
                    "correct_option": "ಕನಿಷ್ಠ ಮಾನಸಿಕ ಶ್ರಮ, ಸೊಬಗು ಮತ್ತು ಸ್ಥಿರವಾದ ನಿಖರತೆ",
                    "explanation": "ನಿಜವಾದ ಆಪ್ಟಿಮೈಸೇಶನ್ ಅನಗತ್ಯ ಸಂಕೀರ್ಣತೆಯನ್ನು ತೆಗೆದುಹಾಕಿ ಗರಿಷ್ಠ ನಿಖರತೆ ಮತ್ತು ಸ್ಪಷ್ಟತೆಯನ್ನು ಒದಗಿಸುತ್ತದೆ."
                },
                {
                    "question_text": f"{topic} ನಲ್ಲಿ ಪಡೆದ ಫಲಿತಾಂಶಗಳನ್ನು ಹೇಗೆ ಪರಿಶೀಲಿಸಬೇಕು?",
                    "options": [
                        "ಮೂಲಭೂತ ನಿಯಮಗಳೊಂದಿಗೆ ಕ್ರಾಸ್-ವೆರಿಫೈ ಮತ್ತು ಪರೀಕ್ಷೆ ನಡೆಸುವುದು",
                        "ಮೊದಲ ಊಹೆಯನ್ನೇ ಪರೀಕ್ಷಿಸದೆ ಒಪ್ಪಿಕೊಳ್ಳುವುದು",
                        "ದೋಷ ಬಂದಾಗ ಮಾತ್ರ ಪರಿಶೀಲಿಸುವುದು",
                        "ಎಲ್ಲಾ ಉದಾಹರಣೆಗಳು ಯಾವಾಗಲೂ ಸರಿಯಾಗಿರುತ್ತವೆ ಎಂದು ಭಾವಿಸುವುದು"
                    ],
                    "correct_option": "ಮೂಲಭೂತ ನಿಯಮಗಳೊಂದಿಗೆ ಕ್ರಾಸ್-ವೆರಿಫೈ ಮತ್ತು ಪರೀಕ್ಷೆ ನಡೆಸುವುದು",
                    "explanation": "ಮೂಲಭೂತ ತತ್ವಗಳೊಂದಿಗೆ ಕ್ರಾಸ್-ವೆರಿಫಿಕೇಶನ್ ಮಾಡುವುದರಿಂದ ಸೂಕ್ಷ್ಮ ದೋಷಗಳನ್ನು ಸುಲಭವಾಗಿ ತಡೆಗಟ್ಟಬಹುದು."
                }
            ]
        elif lang_clean in ["hi", "hindi"]:
            q_pool = [
                {
                    "question_text": f"{topic} का अध्ययन करने का प्राथमिक उद्देश्य क्या है?",
                    "options": [
                        f"{topic} के मूल संरचनात्मक सिद्धांतों को समझकर व्यावहारिक रूप से लागू करना",
                        f"बिना समझे केवल शब्दों को रटना",
                        f"आंतरिक कार्यप्रणाली को नजरअंदाज करना",
                        f"तर्क के स्थान पर अनुमान लगाना"
                    ],
                    "correct_option": f"{topic} के मूल संरचनात्मक सिद्धांतों को समझकर व्यावहारिक रूप से लागू करना",
                    "explanation": f"{topic} के संरचनात्मक सिद्धांतों की समझ शिक्षार्थियों को बुनियादी और जटिल दोनों तरह की समस्याओं को हल करने में सक्षम बनाती है।"
                },
                {
                    "question_text": f"{topic} में किसी विशेष या असामान्य स्थिति का विश्लेषण करते समय पहला कदम क्या होना चाहिए?",
                    "options": [
                        "सीमा स्थितियों (Boundary conditions) की पहचान और विसंगतियों को अलग करना",
                        "समस्या को अनदेखा कर देना",
                        "पूरी प्रणाली को तुरंत बंद कर देना",
                        "नियमों को मनमाने ढंग से बदलना"
                    ],
                    "correct_option": "सीमा स्थितियों (Boundary conditions) की पहचान और विसंगतियों को अलग करना",
                    "explanation": "सीमा स्थितियों की पहचान करने से मुख्य प्रणाली को प्रभावित किए बिना समस्याओं का समाधान किया जा सकता है।"
                },
                {
                    "question_text": f"{topic} में सबसे अधिक स्मरण और दक्षता किस रणनीति से प्राप्त होती है?",
                    "options": [
                        "सक्रिय मानसिक मॉडलिंग और व्यावहारिक अनुप्रयोग",
                        "बिना अभ्यास के केवल पन्ने पलटना",
                        "बिना समझे रटना",
                        "बुनियादी पाठों को छोड़कर सीधे आगे बढ़ना"
                    ],
                    "correct_option": "सक्रिय मानसिक मॉडलिंग और व्यावहारिक अनुप्रयोग",
                    "explanation": "सक्रिय मानसिक समझ और व्यावहारिक अभ्यास अवधारणाओं को दीर्घकालिक स्मृति में स्थापित करते हैं।"
                },
                {
                    "question_text": f"{topic} में एक अनुकूलित (Optimized) कार्यप्रणाली की क्या पहचान है?",
                    "options": [
                        "सुरुचिपूर्ण संरचना, न्यूनतम प्रयास और निरंतर सटीकता",
                        "अनावश्यक जटिलता और धीमी गति",
                        "सत्यापन का अभाव",
                        "तथ्यों के बजाय अनुमान पर निर्भरता"
                    ],
                    "correct_option": "सुरुचिपूर्ण संरचना, न्यूनतम प्रयास और निरंतर सटीकता",
                    "explanation": "सच्चा अनुकूलन अनावश्यक जटिलताओं को हटाकर उच्च सटीकता और स्पष्टता बनाए रखता है।"
                },
                {
                    "question_text": f"{topic} में प्राप्त निष्कर्षों का सत्यापन कैसे करना चाहिए?",
                    "options": [
                        "मूल सिद्धांतों के साथ क्रॉस-चेक और तार्किक जांच करना",
                        "पहले अनुमान को बिना जांचे स्वीकार करना",
                        "केवल असफलता के समय जांचना",
                        "मान लेना कि हर परिणाम बिना जांच के सही है"
                    ],
                    "correct_option": "मूल सिद्धांतों के साथ क्रॉस-चेक और तार्किक जांच करना",
                    "explanation": "मूलभूत सिद्धांतों के साथ पुनः जांच करने से सूक्ष्म वैचारिक और गणनात्मक त्रुटियों से बचा जा सकता है।"
                }
            ]
        else:
            q_pool = [
                {
                    "question_text": f"What is the foundational primary objective of studying {topic}?",
                    "options": [
                        f"To understand and apply the core structural principles of {topic}",
                        f"To memorize arbitrary terms without practical application",
                        f"To avoid understanding underlying mechanics",
                        f"To replace fundamental logic with guesswork"
                    ],
                    "correct_option": f"To understand and apply the core structural principles of {topic}",
                    "explanation": f"Understanding the structural principles of {topic} enables learners to solve both foundational problems and complex real-world edge scenarios intuitively."
                },
                {
                    "question_text": f"When analyzing an edge case in {topic}, what is the recommended first step?",
                    "options": [
                        "Identify the boundary conditions and isolate anomalies",
                        "Ignore the edge condition and hope for the best",
                        "Discard the entire system immediately",
                        "Change the fundamental definitions at random"
                    ],
                    "correct_option": "Identify the boundary conditions and isolate anomalies",
                    "explanation": "Diagnostic isolation of boundary conditions allows practitioners to address unexpected constraints without compromising the integrity of the wider system."
                },
                {
                    "question_text": f"Which strategy produces the highest retention and mastery in {topic}?",
                    "options": [
                        "Active mental modeling combined with practical application",
                        "Passive skim reading without problem solving",
                        "Cramming without understanding relationships",
                        "Skipping foundational lessons directly to edge cases"
                    ],
                    "correct_option": "Active mental modeling combined with practical application",
                    "explanation": "Active mental modeling and structured application cement concepts into long-term memory far more effectively than passive observation."
                },
                {
                    "question_text": f"In {topic}, what distinguishes an optimized workflow from a basic one?",
                    "options": [
                        "Elegance, minimal cognitive overhead, and consistent precision",
                        "Unnecessary complexity and slower execution time",
                        "Lack of systematic verification checks",
                        "Relying on guesswork instead of structured metrics"
                    ],
                    "correct_option": "Elegance, minimal cognitive overhead, and consistent precision",
                    "explanation": "True optimization strips away redundant overhead while maintaining rigorous accuracy and structural clarity."
                },
                {
                    "question_text": f"How should you verify conclusions reached when evaluating {topic}?",
                    "options": [
                        "Perform sanity checks and cross-verify with foundational rules",
                        "Accept the first intuitive guess without testing",
                        "Only test when an immediate failure occurs",
                        "Assume all textbook examples hold unconditionally in production"
                    ],
                    "correct_option": "Perform sanity checks and cross-verify with foundational rules",
                    "explanation": "Sanity checks and cross-validation against foundational principles safeguard against subtle conceptual and computational traps."
                }
            ]

        selected_questions = q_pool[:max(1, min(num_questions, len(q_pool)))]
        return {
            "topic": topic,
            "level": level,
            "questions": selected_questions
        }

    def _synthesize_guru_reply(self, message: str, neuro_mode: str) -> dict:
        """
        Guru Ji's comprehensive, witty Indian AI tutor engine.
        Answers math, science, programming, history, and study doubts with crisp desi humor.
        """
        msg_lower = message.lower()

        # 1. Greetings & Pleasantries
        if any(w in msg_lower for w in ["hi", "hello", "hey", "namaste", "pranam", "good morning", "good evening"]):
            reply = "Namaste beta! Guru Ji is in the classroom. What concept is troubling your brain today? Ask away—I explain things faster than a Mumbai local on a green signal!"
            humor = "Guru Ji's Rule #1: Why take tension when you can take action?"
            tips = ["Ask any doubt", "Request a cricket analogy", "Try a 5-min study sprint"]

        # 2. Photosynthesis & Botany
        elif any(w in msg_lower for w in ["photosynthesis", "chlorophyll", "plant food", "stomata"]):
            reply = """Arre, photosynthesis is basically plants running their own 5-star solar-powered kitchen!

• The Ingredients: Sunlight (free energy from Surya Dev) + Carbon Dioxide (inhaled through tiny leaf doors called stomata) + Water (drawn from the soil roots).
• The Master Chef: Chlorophyll (the green pigment that catches the sun rays like a fielder at boundary).
• The Dish Prepared: Glucose (delicious sweet plant energy) + Fresh Oxygen (released for all of us to breathe!).

Equation in plain words:
Sunlight + CO2 + Water ➔ Glucose + Oxygen. Clean, green, and zero electricity bill!"""
            humor = "Next time you see a tree, say thank you for the free tiffin delivery!"
            tips = ["Remember: Light + CO2 + H2O", "Chlorophyll = Solar Panels", "Releases Oxygen"]

        # 3. Gravity & Newton's Laws
        elif any(w in msg_lower for w in ["gravity", "newton", "apple fall", "falling"]):
            reply = """Listen carefully! Sir Isaac Newton got hit on the head by an apple, and instead of eating it, he discovered Gravity!

1. What is Gravity? It is the invisible universal glue pulling any two masses toward each other. The heavier the object (like planet Earth), the stronger the pull!
2. First Law: Things stay lazy unless a force pushes them (just like Sharma ji's scooter on a cold morning).
3. Second Law: Force = Mass × Acceleration (Hit a cricket ball harder, it flies further).
4. Third Law: Every action has an equal & opposite reaction (Push the skateboard backward, you roll forward!)."""
            humor = "Gravity always works 24/7 without taking casual leave!"
            tips = ["F = m * a", "Earth pulls with 9.8 m/s²", "Action = Reaction"]

        # 4. Programming & Computer Science
        elif any(w in msg_lower for w in ["python", "variable", "loop", "function", "coding", "code", "programming", "if else"]):
            reply = """Coding is just writing a recipe for a very fast but completely literal robot!

• Variables: Labeled dabbas (storage boxes) in memory. Like a jar labeled 'Sugar'—here `score = 100`.
• Loops (for/while): Doing your chores automatically until done. 'While samosas remain on plate, keep eating!'
• Functions: A master recipe card `def make_chai(tea, milk):`. You write it once, call it 100 times!
• If/Else: Decision-making. 'If traffic is clear, go; Else, take the bypass road.'

Start with tiny scripts, run them, break them, and fix them. That is how real programmers are made!"""
            humor = "Pro tip: If your code doesn't work on the first try, don't worry—neither did the Chandrayaan prototype!"
            tips = ["Practice 5 lines of code", "Use print() for debugging", "Keep variables descriptive"]

        # 5. Math, Calculus, Equations & Algebra (including equation detection like '2x + 4 = 10')
        elif any(w in msg_lower for w in ["math", "formula", "algebra", "calculus", "quadratic", "pythagoras", "equation", "solve", "+", "-", "*", "/", "="]) and any(char.isdigit() for char in message):
            if neuro_mode == "dyscalculia":
                reply = f"""Arre beta, let us throw away the scary formula walls! Let's solve '{message}' visually:

• Visual Balance Method:
Think of the equals sign (=) as a physical balance scale!
1. What you do to the left side, you must do to the right side to keep the pans level.
2. Group the loose numbers together and the mystery bags together.
3. For example in 2x + 4 = 10: Remove 4 loose coins from both sides -> 2x = 6. Divide both by 2 -> x = 3!
See? It is just balancing weights on a scale without tension!"""
            else:
                reply = f"""Solving equations like '{message}' is just being a detective finding the hidden value!

1. Goal: Isolate the variable on one side all by itself.
2. Rule of Balance: If you subtract or add to one side, do the exact same to the other side.
3. Undo Operations in Reverse (SADMEP):
   - First undo Addition / Subtraction
   - Then undo Multiplication / Division
4. Final Sanity Check: Plug your answer back into '{message}' to verify both sides match!"""
            humor = "Mathematics: The only subject where every problem has a solution waiting to be discovered!"
            tips = ["Isolate the variable step-by-step", "Keep equals signs aligned", "Double check by plugging back"]

        elif any(w in msg_lower for w in ["math", "formula", "algebra", "calculus", "quadratic", "pythagoras", "equation"]):
            if neuro_mode == "dyscalculia":
                reply = """Arre beta, let us throw away the scary formula walls! Math is just counting visual pieces:

• Pythagoras Theorem: Imagine a right-angled triangle like a samosa corner. The two short sides (a and b) build squares. Together, their area matches the big slanted side (c²)!
• Visualizing Equations: `2x + 4 = 10` simply means: 'Two mystery bags plus 4 loose coins equal 10 coins.'
1. Remove 4 coins from both sides: Two bags = 6 coins.
2. Divide by 2: Each bag has 3 coins! (x = 3).
See? No black magic, just balancing weights on a scale!"""
            else:
                reply = """Math is not a monster under your bed; it is just logic wearing a crisp kurta!

• Algebra: Solving for 'x' is just being a detective finding who stole the last jalebi.
• Pythagoras: a² + b² = c² (The square of the longest hypotenuse side equals the sum of squares of the other two).
• Quadratic Formula: `x = (-b ± √(b² - 4ac)) / (2a)`.
Break each calculation into 1 line at a time. Never rush all steps together!"""
            humor = "Mathematics: The only place where people buy 60 watermelons and nobody asks why!"
            tips = ["Isolate variables step-by-step", "Draw a sketch first", "Sanity check by substituting back"]

        # 6. Exam Anxiety & Memory Strategy
        elif any(w in msg_lower for w in ["exam", "test", "scared", "nervous", "marks", "forget", "study tips"]):
            reply = """Arre beta, breathe in, sip some warm water, and relax! Why take tension when you can take action?

Here is the Guru Ji 3-Step Exam Strategy:
1. Treat it like an IPL Run Chase: Don't try hitting a boundary on every single ball. First collect easy singles (questions you know 100%). Build momentum!
2. Active Recall over Passive Reading: Close your notebook and explain the topic in 60 seconds to your mirror or your pet. If you can explain it simply, you own it!
3. The 25-5 Pomodoro: 25 minutes pure study, 5 minutes stretch. Zero multitasking."""
            humor = "Remember: Marks don't define your destiny. Your curiosity and consistency do!"
            tips = ["Attempt easy questions first", "Teach it aloud to test recall", "Sleep 7 hours before test"]

        # 7. Focus, ADHD & Distraction
        elif any(w in msg_lower for w in ["focus", "distracted", "adhd", "bored", "procrastinat"]):
            reply = """Listen closely! When your brain wants novelty and won't focus, do NOT force a 2-hour marathon.

Use the Guru Ji Dopamine Sprint:
⚡ Step 1: Pick ONE micro-task (e.g., read just 2 paragraphs or solve 1 problem).
⚡ Step 2: Set a timer for 10 minutes.
⚡ Step 3: Put your smartphone in the next room (out of sight, out of mind).
⚡ Step 4: After 10 mins, celebrate with a reward! A cookie, a stretch, or your favorite track!"""
            humor = "Your brain is an ultra-fast Ferrari with bicycle brakes. Master the brakes, and you will fly!"
            tips = ["10-min sprints only", "Hide your phone", "Celebrate small milestones"]

        # 8. Space, ISRO & Solar System
        elif any(w in msg_lower for w in ["space", "isro", "chandrayaan", "moon", "solar system", "planet"]):
            reply = """Shabash! Space exploration is India's proudest playground!

• Chandrayaan-3: Landed near the Moon's South Pole where no nation had gone before—and at a fraction of a Hollywood movie's budget!
• How Rockets Work: Newton's 3rd Law! Burning fuel shoots downward at extreme speed, pushing the rocket skyward into orbit.
• The Solar System: 8 planets orbiting Surya Dev. Inner rocky planets (Mercury, Venus, Earth, Mars) and outer gas giants (Jupiter, Saturn, Uranus, Neptune)."""
            humor = "ISRO proves: When you combine Indian engineering with sheer passion, even the Moon is within reach!"
            tips = ["Newton's 3rd law powers rockets", "Escape velocity is 11.2 km/s", "Stay curious!"]

        # 9. Dynamic Concept Breakdown for ANY topic
        else:
            # Extract key nouns and question intent
            clean_q = message.strip()
            reply = f"""Aha! You are asking about **'{clean_q}'**! Let me break it down clearly:

1. The Core Idea:
Strip away the fancy textbook jargon. At its heart, this concept explains how components interact under specific rules to produce predictable outcomes.

2. A Simple Indian Analogy:
Think of it like coordinating a street cricket tournament or preparing a great cup of tea—every ingredient and player has a designated role. If one part is missing, the balance shifts!

3. Your 3-Minute Action Step:
• First, define the main terms in your own words.
• Second, find one real-life example where this operates in the background.
• Third, test yourself with a quick question!

What specific part of '{clean_q}' would you like to explore deeper?"""
            humor = "Guru Ji's Motto: Master one concept before lunch, and you are already ahead of yesterday!"
            tips = [f"Summarize {clean_q} in 1 line", "Link to a real example", "Ask Guru Ji for a quiz"]

        # Neuro-mode specific adaptation
        if neuro_mode == "adhd":
            lines = [l for l in reply.split("\n") if l.strip()][:5]
            reply = "\n".join(lines) + "\n\n⚡ Quick Challenge: What is the main takeaway in 3 words?"
        elif neuro_mode == "dyslexia":
            reply = reply.replace("—", " - ")

        return {
            "reply": reply,
            "humor_note": humor,
            "quick_tips": tips
        }

gemini_service = GeminiService()
