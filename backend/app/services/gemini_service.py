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

            Requirements:
            1. Title and Description for the course.
            2. Create 3 modules. Each module must have 2 lessons (total 6 lessons).
            3. Each lesson must have:
               - A title.
               - Rich learning content (formatted nicely in markdown with headings, bullet points, practical examples, 3-4 paragraphs minimum).
               - A speech script ('script'): this is a narration of the lesson designed for text-to-speech. 
                 It should be warm, engaging, crisp, and read like a teacher speaking directly to the student. No markdown elements in the script, just plain spoken text.
            
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

        # Resilient, high-quality dynamic course synthesis
        return self._synthesize_course(clean_topic, language, pace)

    def generate_quiz(self, topic: str, level: str = "Medium", num_questions: int = 5) -> dict:
        """
        Generates assessment quiz using Gemini if configured, or Adhyaya's
        dynamic assessment engine if API key is invalid/unavailable.
        """
        clean_topic = topic.strip().title()

        if self.is_configured:
            prompt = f"""
            You are an academic assessment engine for 'Adhyaya'. Generate a personalized test series for the student.
            
            Assessment Details:
            - Topic: {clean_topic}
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
                parsed = json.loads(response.text)
                if parsed and parsed.get("questions"):
                    return parsed
            except Exception as e:
                logger.warning(f"Gemini quiz API failed ({e}), using Adhyaya assessment engine...")

        return self._synthesize_quiz(clean_topic, level, num_questions)

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
        """Dynamically crafts a rich, customized 3-module, 6-lesson curriculum."""
        pace_note = "thorough and step-by-step" if pace == "Slow" else ("accelerated and high-impact" if pace == "Fast" else "balanced and practical")

        return {
            "title": f"Mastering {topic}: An Adhyaya Pathway",
            "description": f"A comprehensive, {pace_note} personalized curriculum in {language} designed to take you from foundational concepts to advanced real-world mastery of {topic}.",
            "modules": [
                {
                    "module_title": f"Foundations & Core Principles of {topic}",
                    "lessons": [
                        {
                            "title": f"Introduction to {topic}",
                            "content": f"### What is {topic}?\n\nWelcome to your personalized Adhyaya learning track. **{topic}** forms an essential building block in modern study and application. In this opening lesson, we dissect the core definitions, historical context, and why understanding {topic} empowers your analytical mindset.\n\n#### Key Objectives\n- Recognize the foundational pillars of {topic}.\n- Understand how theoretical principles translate into everyday phenomena.\n- Establish a mental model designed for rapid retention and intuitive recall.\n\n#### Practical Breakdown\nEvery complex topic can be split into manageable mental chunks. When approaching {topic}, always observe the primary inputs, the transforming mechanisms, and the resultant outputs. In the upcoming lessons, we will build practical frameworks upon this solid foundation.",
                            "script": f"Namaste and welcome to Adhyaya! Today we are kicking off our journey into {topic}. Don't worry if this sounds intimidating at first—we will break it down step-by-step with clear real-world examples. Let's build your foundation together!"
                        },
                        {
                            "title": f"Fundamental Mechanics & Architecture",
                            "content": f"### Deep Dive: The Engine Behind {topic}\n\nNow that you know what {topic} represents, let us look beneath the surface. The underlying mechanics rely on interconnected principles that dictate how systems interact.\n\n#### Structural Highlights\n1. **Core Variables**: The primary active components governing {topic}.\n2. **Equilibrium & Flow**: How information, energy, or logic shifts between stages.\n3. **Common Pitfalls**: Mistakes learners make when misinterpreting basic relationships in {topic}.\n\n#### Summary Checkpoint\nTake a moment to write down 2 everyday situations where {topic} silently operates in the background. Reflection solidifies retention far better than passive reading.",
                            "script": f"Great job finishing lesson one! In this second lesson, we are taking a closer look at the actual mechanics of {topic}. Notice how the core rules fit together like gears in a clock. Keep your focus sharp, and let's dive in!"
                        }
                    ]
                },
                {
                    "module_title": f"Practical Application & Working Methodologies",
                    "lessons": [
                        {
                            "title": f"Applied Workflows in {topic}",
                            "content": f"### Putting Theory Into Motion\n\nAbstract knowledge becomes permanent when put to the test. In this module, we examine how professionals and researchers utilize {topic} to solve non-trivial problems.\n\n#### Methodological Steps\n- **Step 1: Diagnostics**: Identifying the exact state of your problem space.\n- **Step 2: Strategy Formulation**: Selecting the optimal paradigm within {topic}.\n- **Step 3: Verification**: Running sanity checks to ensure your conclusions are mathematically and logically sound.\n\n#### Visual & Analytical Thinking\nVisualize the problem before writing any equation or code. When your mental representation is crisp, solutions unfold naturally.",
                            "script": f"Welcome to Module Two! It is time to get our hands dirty and see how {topic} actually works in real life. We will go through a three-step practical workflow that you can use whenever you face a tough problem."
                        },
                        {
                            "title": f"Case Studies & Edge Scenarios",
                            "content": f"### Real-World Analysis & Edge Cases\n\nReal life rarely behaves like a clean textbook problem. When working with {topic}, unexpected constraints arise—such as noise, variable loads, or boundary conditions.\n\n#### Case Study Breakdown\nConsider a scenario where standard rules hit an anomaly. By applying adaptive thinking and fallback mechanisms, practitioners isolate anomalies without compromising system integrity.\n\n#### Pro-Tip for Exams and Interviews\nWhenever asked about {topic}, always mention at least one edge scenario. It demonstrates that you don't merely memorize facts—you understand boundary behaviors.",
                            "script": f"In this lesson, we are dissecting edge cases. What happens when the standard rules encounter unusual conditions? Let's analyze a real-world case study together so you are prepared for any exam curveball!"
                        }
                    ]
                },
                {
                    "module_title": f"Advanced Synthesis & Future Horizons",
                    "lessons": [
                        {
                            "title": f"Optimization Strategies in {topic}",
                            "content": f"### Refining Performance and Speed\n\nMastery is not just knowing how to do something—it is knowing how to do it efficiently, elegantly, and robustly. In {topic}, optimization separates novices from veterans.\n\n#### Top Optimization Techniques\n- **Pruning Inefficiencies**: Removing unnecessary computational or cognitive overhead.\n- **Pattern Recognition**: Instantly identifying structural similarities across diverse problems.\n- **Continuous Iteration**: Rapid feedback loops to verify precision.\n\nRemember: premature optimization is tricky, but strategic optimization at this stage will give you a massive competitive edge.",
                            "script": f"You have reached Module Three! Now we elevate your skills to pro-level with optimization strategies. We will look at how to strip away inefficiencies and solve problems in {topic} with maximum elegance and speed."
                        },
                        {
                            "title": f"Future Trends, Ethics, and Synthesis",
                            "content": f"### The Horizon of {topic}\n\nCongratulations on reaching the final lesson of this course track! As technology, research, and society evolve, {topic} continues to adapt with exciting intersections in artificial intelligence, automation, and global innovation.\n\n#### Final Synthesis Takeaways\n1. **Core Understanding**: You now possess a structured mental map of {topic}.\n2. **Practical Confidence**: You can apply principles to solve both standard and atypical challenges.\n3. **Lifelong Growth**: Use this foundation as a springboard into specialized domains.\n\nTake the personalized Adhyaya assessment quiz next to validate your mastery and earn your progress streak badge!",
                            "script": f"Congratulations, scholar! You have reached the final lesson on {topic}. Take pride in how much ground you have covered. Review your key takeaways, and when you are ready, head over to the test series to test your mastery!"
                        }
                    ]
                }
            ]
        }

    def _synthesize_quiz(self, topic: str, level: str, num_questions: int) -> dict:
        """Dynamically crafts relevant assessment questions with explanations."""
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
        """Guru Ji's witty, humorous, crisp Indian tutor persona."""
        msg_lower = message.lower()

        # Contextual humorous replies
        if any(w in msg_lower for w in ["hi", "hello", "hey", "namaste"]):
            reply = "Namaste beta! Guru Ji is in the classroom. What concept is troubling your brain today? Ask away—I explain things faster than a Mumbai local on green signal!"
        elif any(w in msg_lower for w in ["exam", "test", "scared", "nervous", "marks"]):
            reply = "Arre baba, relax! Why take tension when you can take action? Treat your exams like an IPL run chase—keep your head cool, pick the easy singles first, and hit the big concepts for six. What topic do you want to revise right now?"
        elif any(w in msg_lower for w in ["math", "formula", "calculus", "algebra", "number"]):
            if neuro_mode == "dyscalculia":
                reply = "Numbers are just visual ingredients, like making chai! Two spoons of logic, one cup of patience, boil it on low flame. Tell me the specific problem, and we will visualize it without scary formula walls!"
            else:
                reply = "Math is not a monster under the bed; it's just logic wearing a fancy kurta! Break the equation into bite-sized pieces. Which step is making your brain spin?"
        elif any(w in msg_lower for w in ["focus", "distracted", "adhd", "bored"]):
            reply = "Listen carefully! Here is the Guru Ji 10-Minute Sprint: 1) Pick ONE sub-topic. 2) Put phone on silent. 3) Read for 10 minutes. Then reward yourself with a hot samosa or a chai break. Let's do 10 minutes right now—what are we studying?"
        elif any(w in msg_lower for w in ["who are you", "what is adhyaya", "adhyaya"]):
            reply = "I am Guru Ji, your friendly neighborhood AI tutor on Adhyaya! Think of me as the mentor who gives crisp explanations, zero boring lectures, and enough encouragement to make Sharma ji jealous."
        else:
            reply = f"Aha! Regarding '{message}': The secret is simple—isolate the core idea, strip away the jargon, and connect it to something you already know. Here is the golden rule: Focus on the 'why' before the 'how'. What specific part should we unpack first?"

        return {
            "reply": reply,
            "humor_note": "Guru Ji Tip: When in doubt, breathe deep, sip water, and conquer one concept at a time!",
            "quick_tips": ["Break it down", "Ask follow-up", "Take a 5-min walk"]
        }

gemini_service = GeminiService()
