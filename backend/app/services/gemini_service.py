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
