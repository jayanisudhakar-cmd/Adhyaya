/**
 * Multi-lingual structured course curricula for Adhyaya.
 * Instantly supplies syllabus, module titles, lesson content, and teacher scripts
 * in Kannada (kn), Hindi (hi), and English (en) whenever the Course Content Language is switched.
 */

export const BUILTIN_COURSES = {
  kn: {
    title: "ಪೈಥಾನ್ ಪ್ರೋಗ್ರಾಮಿಂಗ್ ಮತ್ತು ತಾರ್ಕಿಕ ಚಿಂತನೆ",
    topic: "Python",
    language: "Kannada",
    langCode: "kn",
    description: "ವೇರಿಯೇಬಲ್‌ಗಳು, ನಿಯಂತ್ರಣ ಹರಿವು, ಫಂಕ್ಷನ್‌ಗಳು ಮತ್ತು ಅಲ್ಗಾರಿದಮಿಕ್ ತರ್ಕವನ್ನು ಸ್ಪಷ್ಟ ಮಾನಸಿಕ ಮಾದರಿಗಳ ಮೂಲಕ ಕಲಿಯಿರಿ.",
    pace: "Medium",
    completedCount: 1,
    completedLessons: {
      "1. ಪ್ರೋಗ್ರಾಮಿಂಗ್ ಎಂದರೇನು?": true
    },
    modules: [
      {
        module_title: "ಮಾಡ್ಯೂಲ್ 1: ಗಣಕ ತಾರ್ಕಿಕತೆಯ ಅಡಿಪಾಯ",
        lessons: [
          {
            title: "1. ಪ್ರೋಗ್ರಾಮಿಂಗ್ ಎಂದರೇನು?",
            content: "### ಪ್ರೋಗ್ರಾಮಿಂಗ್ ಎಂದರೇನು?\n\nಕಂಪ್ಯೂಟರ್‌ಗೆ ಅರ್ಥವಾಗುವಂತಹ ತಾರ್ಕಿಕ ಸೂಚನೆಗಳನ್ನು ನೀಡಿ ನೈಜ ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಹರಿಸುವುದೇ ಪ್ರೋಗ್ರಾಮಿಂಗ್.\n\n#### ಪ್ರಮುಖ ಆಧಾರಸ್ತಂಭಗಳು\n- **ಇನ್‌ಪುಟ್ (ಆದಾನ)**: ವ್ಯವಸ್ಥೆಗೆ ನೀಡಲಾಗುವ ಕಚ್ಚಾ ಮಾಹಿತಿ.\n- **ರೂಪಾಂತರ (ಪ್ರಕ್ರಿಯೆ)**: ತರ್ಕ ಮತ್ತು ಲೆಕ್ಕಾಚಾರದ ಮೂಲಕ ಬದಲಾವಣೆ.\n- **ಔಟ್‌ಪುಟ್ (ಫಲಿತಾಂಶ)**: ಅಂತಿಮವಾಗಿ ಪಡೆಯುವ ಪರಿಹಾರ.\n\nಪ್ರೋಗ್ರಾಮಿಂಗ್ ಕಲಿಯುವುದು ಅಡುಗೆ ವಿಧಾನವನ್ನು ಹಂತ-ಹಂತವಾಗಿ ಪಾಲಿಸಿದಂತೆ ಸುಲಭ ಮತ್ತು ಸ್ಪಷ್ಟವಾಗಿರುತ್ತದೆ.",
            script: "ನಮಸ್ಕಾರ ಮತ್ತು ಅಧ್ಯಾಯಕ್ಕೆ ಸುಸ್ವಾಗತ! ಇಂದು ನಾವು ಪೈಥಾನ್ ಮತ್ತು ತಾರ್ಕಿಕ ಚಿಂತನೆಯ ಮೂಲ ತತ್ವಗಳನ್ನು ಕಲಿಯಲಿದ್ದೇವೆ. ಪ್ರತಿಯೊಂದು ಹಂತವನ್ನು ಸುಲಭವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ."
          },
          {
            title: "2. ವೇರಿಯೇಬಲ್‌ಗಳು ಮತ್ತು ಮೆಮೊರಿ ತತ್ವಗಳು",
            content: "### ವೇರಿಯೇಬಲ್‌ಗಳು: ಕಂಪ್ಯೂಟರ್ ಮೆಮೊರಿಯ ಪೆಟ್ಟಿಗೆಗಳು\n\nವೇರಿಯೇಬಲ್ ಎಂದರೆ ಕಂಪ್ಯೂಟರ್ ಮೆಮೊರಿಯಲ್ಲಿ ಡೇಟಾವನ್ನು ಸಂಗ್ರಹಿಸಲು ನೀಡಲಾಗುವ ಒಂದು ಹೆಸರಿಸಲಾದ ಲೇಬಲ್ ಆಗಿದೆ.\n\n#### ಪ್ರಮುಖ ಅಂಶಗಳು\n1. **ಮಾಹಿತಿ ಶೇಖರಣೆ**: ಸಂಖ್ಯೆಗಳು, ಹೆಸರುಗಳು ಮತ್ತು ಸತ್ಯಾಸತ್ಯತೆಗಳನ್ನು ನೆನಪಿನಲ್ಲಿಡುತ್ತದೆ.\n2. **ಗತಿಶೀಲ ಬದಲಾವಣೆ**: ಪ್ರೋಗ್ರಾಂ ಚಾಲನೆಯಲ್ಲಿರುವಾಗ ಮೌಲ್ಯಗಳನ್ನು ಬದಲಾಯಿಸಬಹುದು.\n\nನಿಮ್ಮ ಮೇಜಿನ ಮೇಲಿರುವ ಲೇಬಲ್ ಮಾಡಿದ ಡಬ್ಬಿಗಳಂತೆ ವೇರಿಯೇಬಲ್‌ಗಳು ಕೆಲಸ ಮಾಡುತ್ತವೆ.",
            script: "ಎರಡನೇ ಪಾಠಕ್ಕೆ ಸುಸ್ವಾಗತ! ಇಲ್ಲಿ ನಾವು ವೇರಿಯೇಬಲ್‌ಗಳ ಬಗ್ಗೆ ಕಲಿಯುತ್ತೇವೆ. ನಿಮ್ಮ ಸ್ಟಡಿ ಡೆಸ್ಕ್‌ನಲ್ಲಿರುವ ಲೇಬಲ್ ಬಾಕ್ಸ್‌ಗಳಂತೆ ಇವು ಮಾಹಿತಿ ಸಂಗ್ರಹಿಸುತ್ತವೆ."
          }
        ]
      },
      {
        module_title: "ಮಾಡ್ಯೂಲ್ 2: ನಿರ್ಧಾರಗಳು ಮತ್ತು ಪುನರಾವರ್ತನೆಗಳು",
        lessons: [
          {
            title: "3. ಷರತ್ತುಬದ್ಧ ತರ್ಕ (If-Else ನಿರ್ಧಾರಗಳು)",
            content: "### ಕಂಪ್ಯೂಟರ್ ಹೇಗೆ ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ?\n\nನೈಜ ಜಗತ್ತಿನಲ್ಲಿ ನಾವು ಹವಾಮಾನವನ್ನು ನೋಡಿ ಛತ್ರಿ ತೆಗೆದುಕೊಂಡು ಹೋಗುವಂತೆ, ಪ್ರೋಗ್ರಾಂಗಳು ಷರತ್ತುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮುಂದಿನ ಹಂತವನ್ನು ನಿರ್ಧರಿಸುತ್ತವೆ.\n\n#### ತಾರ್ಕಿಕ ಮಾದರಿಗಳು\n- **If (ಷರತ್ತು)**: ಸತ್ಯವಾಗಿದ್ದರೆ ಮೊದಲ ಕೆಲಸ ನಿರ್ವಹಿಸಿ.\n- **Else (ಇಲ್ಲದಿದ್ದರೆ)**: ಪರ್ಯಾಯ ಕೆಲಸ ನಿರ್ವಹಿಸಿ.",
            script: "ಮೂರನೇ ಪಾಠದಲ್ಲಿ ನಾವು ಷರತ್ತುಬದ್ಧ ತರ್ಕವನ್ನು ನೋಡಲಿದ್ದೇವೆ. ಕಂಪ್ಯೂಟರ್ ಹೇಗೆ ಸಂದರ್ಭಕ್ಕೆ ತಕ್ಕಂತೆ ನಿರ್ಧಾರ ಕೈಗೊಳ್ಳುತ್ತದೆ ಎಂಬುದನ್ನು ಕಲಿಯೋಣ."
          },
          {
            title: "4. ಲೂಪ್‌ಗಳು (ಪುನರಾವರ್ತಿತ ಕ್ರಿಯೆಗಳು)",
            content: "### ಸ್ವಯಂಚಾಲಿತ ಪುನರಾವರ್ತನೆ: For ಮತ್ತು While ಲೂಪ್‌ಗಳು\n\nಒಂದೇ ಕೆಲಸವನ್ನು ನೂರಾರು ಬಾರಿ ಮಾಡುವಾಗ ಸಮಯ ಉಳಿಸಲು ಲೂಪ್‌ಗಳನ್ನು ಬಳಸಲಾಗುತ್ತದೆ.\n\n- **For ಲೂಪ್**: ನಿರ್ದಿಷ್ಟ ಸಂಖ್ಯೆಯ ಬಾರಿ ಪುನರಾವರ್ತಿಸಲು.\n- **While ಲೂಪ್**: ನಿರ್ದಿಷ್ಟ ಷರತ್ತು ಇರುವವರೆಗೆ ಮುಂದುವರಿಯಲು.",
            script: "ನಾಲ್ಕನೇ ಪಾಠದಲ್ಲಿ ಪುನರಾವರ್ತನೆ ಅಥವಾ ಲೂಪ್‌ಗಳ ಮಹತ್ವವನ್ನು ತಿಳಿಯೋಣ. ಶ್ರಮವಿಲ್ಲದೆ ಸಾವಿರಾರು ಕ್ರಿಯೆಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತಗೊಳಿಸುವುದು ಹೇಗೆ ನೋಡಿ."
          }
        ]
      },
      {
        module_title: "ಮಾಡ್ಯೂಲ್ 3: ಸುಧಾರಿತ ಅನ್ವಯಗಳು ಮತ್ತು ಸಾರಾಂಶ",
        lessons: [
          {
            title: "5. ಫಂಕ್ಷನ್‌ಗಳು: ಮರುಬಳಕೆಯ ತಾರ್ಕಿಕ ಬ್ಲಾಕ್‌ಗಳು",
            content: "### ಫಂಕ್ಷನ್‌ಗಳ ಪರಿಕಲ್ಪನೆ\n\nಒಮ್ಮೆ ಬರೆದ ಕೋಡ್ ಅನ್ನು ಪದೇ ಪದೇ ಬಳಸಲು ಫಂಕ್ಷನ್ ರಚಿಸಲಾಗುತ್ತದೆ.\n\n#### ಪ್ರಯೋಜನಗಳು\n- ಕೋಡ್ ಗಾತ್ರ ಕಡಿತ ಮತ್ತು ಸುಂದರ ಸಂಘಟನೆ.\n- ದೋಷಗಳನ್ನು ಸುಲಭವಾಗಿ ಸರಿಪಡಿಸುವುದು.",
            script: "ಐದನೇ ಪಾಠದಲ್ಲಿ ನಾವು ಫಂಕ್ಷನ್‌ಗಳನ್ನು ಅನ್ವೇಷಿಸುತ್ತೇವೆ. ಪುನರಾವರ್ತನೆಯನ್ನು ತಪ್ಪಿಸಿ ಕೋಡ್ ಅನ್ನು ಸಂಘಟಿತವಾಗಿಡುವುದು ಹೇಗೆ ತಿಳಿಯಿರಿ."
          },
          {
            title: "6. ಅಂತಿಮ ಸಾರಾಂಶ ಮತ್ತು ಅಭ್ಯಾಸ ಪರೀಕ್ಷೆ",
            content: "### ಪೈಥಾನ್ ಮೂಲ ತತ್ವಗಳ ಸಂಪೂರ್ಣ ಸಾರಾಂಶ\n\nಅಭಿನಂದನೆಗಳು! ನೀವು ಈ ಕೋರ್ಸ್‌ನ ಎಲ್ಲಾ ಪ್ರಮುಖ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮುಗಿಸಿದ್ದೀರಿ.\n\nಈಗ ನಿಮ್ಮ ಜ್ಞಾನವನ್ನು ಪರೀಕ್ಷಿಸಲು ಅಧ್ಯಾಯದ ಟೆಸ್ಟ್ ಸರಣಿಯನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ!",
            script: "ಅಭಿನಂದನೆಗಳು, ಶಿಕ್ಷಾರ್ಥಿಯೇ! ನೀವು ಪೈಥಾನ್ ಮೂಲ ಪಾಠಗಳನ್ನು ಮುಗಿಸಿದ್ದೀರಿ. ಈಗ ಟೆಸ್ಟ್ ಸರಣಿಗೆ ತೆರಳಿ ನಿಮ್ಮ ಸಾಮರ್ಥ್ಯ ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳಿ!"
          }
        ]
      }
    ]
  },
  hi: {
    title: "पायथन और तार्किक सोच की आधारशिला",
    topic: "Python",
    language: "Hindi",
    langCode: "hi",
    description: "वेरिएबल्स, फ्लो कंट्रोल, फंक्शन्स और एल्गोरिथम समझ को स्पष्ट मानसिक मॉडल के साथ सीखें।",
    pace: "Medium",
    completedCount: 1,
    completedLessons: {
      "1. प्रोग्रामिंग क्या है?": true
    },
    modules: [
      {
        module_title: "मॉड्यूल 1: कम्प्यूटेशनल सोच के मूल सिद्धांत",
        lessons: [
          {
            title: "1. प्रोग्रामिंग क्या है?",
            content: "### प्रोग्रामिंग का परिचय\n\nप्रोग्रामिंग कंप्यूटर के साथ संरचित तर्क में संवाद करने की कला है जिससे वास्तविक समस्याओं को हल किया जा सके।\n\n#### प्रमुख स्तंभ\n- **इनपुट**: कंप्यूटर को दी जाने वाली सामग्री।\n- **रूपांतरण**: तार्किक नियमों के तहत गणना।\n- **आउटपुट**: अंतिम परिणाम या समाधान।\n\nप्रोग्रामिंग को एक रेसिपी का पालन करने जैसा समझें—हर कदम स्पष्ट और उद्देश्यपूर्ण होता है।",
            script: "नमस्ते और अध्याय में आपका स्वागत है! आज हम पायथन और तार्किक सोच की शुरुआत कर रहे हैं। हम हर विषय को आसान उदाहरणों से समझेंगे।"
          },
          {
            title: "2. वेरिएबल्स और स्टेट मैनेजमेंट",
            content: "### वेरिएबल्स: मेमोरी के लेबल किए गए डिब्बे\n\nवेरिएबल कंप्यूटर की मेमोरी में डेटा सुरक्षित रखने के लिए दिए गए लेबल की तरह काम करते हैं।\n\n#### मुख्य बातें\n1. **डेटा स्टोरेज**: संख्याएं, नाम और स्थितियां याद रखना।\n2. **परिवर्तनशीलता**: आवश्यकतानुसार मान बदलना।",
            script: "दूसरे पाठ में हम वेरिएबल्स के बारे में जानेंगे। जैसे आपकी मेज पर लेबल किए डिब्बे होते हैं, वैसे ही वेरिएबल्स डेटा संभालते हैं।"
          }
        ]
      },
      {
        module_title: "मॉड्यूल 2: निर्णय और लूप्स",
        lessons: [
          {
            title: "3. सशर्त तर्क (If-Else)",
            content: "### निर्णय कैसे लिए जाते हैं?\n\nवास्तविक जीवन की तरह कंप्यूटर भी परिस्थितियों की जांच करके उचित निर्णय लेता है।\n\n- **If**: शर्त सही होने पर पहला कार्य करें।\n- **Else**: अन्यथा दूसरा कार्य करें।",
            script: "तीसरे पाठ में आपका स्वागत है! आइए समझें कि कंप्यूटर कैसे विभिन्न परिस्थितियों में निर्णय लेता है।"
          },
          {
            title: "4. लूप्स (पुनरावृत्ति)",
            content: "### दोहराए जाने वाले कार्य: For और While लूप्स\n\nजब एक ही काम को कई बार करना हो तो लूप्स समय और ऊर्जा दोनों की बचत करते हैं।",
            script: "चौथे पाठ में हम लूप्स सीखेंगे। एक ही क्लिक में हजारों क्रियाओं को स्वचालित करना कितना आसान है, यह देखें।"
          }
        ]
      },
      {
        module_title: "मॉड्यूल 3: उन्नत अनुप्रयोग और सारांश",
        lessons: [
          {
            title: "5. फंक्शन्स: पुन: प्रयोज्य कोड ब्लॉक्स",
            content: "### फंक्शन्स का महत्व\n\nएक बार लिखा गया कोड बार-बार उपयोग करने के लिए फंक्शन बनाए जाते हैं। इससे कोड सुव्यवस्थित रहता है।",
            script: "पांचवें पाठ में हम फंक्शन्स का उपयोग सीखेंगे ताकि आप कुशल और साफ़-सुथरा कोड लिख सकें।"
          },
          {
            title: "6. अंतिम निष्कर्ष और टेस्ट सीरीज",
            content: "### पाठ्यक्रम का सारांश\n\nबधाई हो! आपने पायथन के आधारभूत सिद्धांतों को सफलता से पूरा कर लिया है।\n\nअब अपनी तैयारी जांचने के लिए टेस्ट सीरीज हल करें!",
            script: "बधाई हो! आपने पाठ्यक्रम पूरा कर लिया है। अब अध्याय की टेस्ट सीरीज में जाकर अपने ज्ञान का परीक्षण करें।"
          }
        ]
      }
    ]
  },
  en: {
    title: "Foundations of Python & Logical Thinking",
    topic: "Python",
    language: "English",
    langCode: "en",
    description: "Learn foundational concepts of programming: variables, flow control, functions, and algorithmic intuition designed for clear mental models.",
    pace: "Medium",
    completedCount: 1,
    completedLessons: {
      "1. What is Programming?": true
    },
    modules: [
      {
        module_title: "Module 1: Core Computational Thinking",
        lessons: [
          {
            title: "1. What is Programming?",
            content: "### What is Programming?\n\nProgramming is the art of communicating structured logic to a computer to solve meaningful problems.\n\n#### Key Pillars\n- **Input**: The raw information provided to the system.\n- **Transformation**: Algorithmic rules processing the information.\n- **Output**: The meaningful result returned to the user.\n\nThink of programming like following a well-tested cooking recipe or coordinating a team.",
            script: "Namaste and welcome to Adhyaya! Today we are exploring the foundations of logical thinking and programming. We will break down instructions into clean, bite-sized steps. Let's get started!"
          },
          {
            title: "2. Variables and State",
            content: "### Variables: Labeled Memory Containers\n\nVariables act like labeled storage boxes in your computer's memory.\n\n#### Key Mechanics\n1. **Data Storage**: Storing numbers, text, and boolean states.\n2. **Dynamic Recall**: Retrieving and updating values as calculations progress.",
            script: "In this second lesson, we look at variables. Think of them like labeled containers in your study desk—each one holds a specific item for quick retrieval whenever you need it."
          }
        ]
      },
      {
        module_title: "Module 2: Practical Application & Workflows",
        lessons: [
          {
            title: "3. Conditional Logic & Branching",
            content: "### Decision-Making in Code\n\nJust as humans check the weather before choosing an outfit, programs use conditions to execute specific paths.\n\n- **If Statement**: Executes when a test is true.\n- **Else Statement**: Handles alternative fallback scenarios.",
            script: "Welcome to lesson three! We are exploring conditional branching—how your code makes intelligent decisions based on runtime data."
          },
          {
            title: "4. Loops and Iteration",
            content: "### Automating Repetition: For and While Loops\n\nComputers excel at repeating calculations millions of times without fatigue.\n\n- **For Loops**: Ideal when the count of iterations is known.\n- **While Loops**: Ideal when continuing until a state condition changes.",
            script: "In lesson four, we tackle loops. Discover how to automate repetitive computational workloads with just a few elegant lines of code."
          }
        ]
      },
      {
        module_title: "Module 3: Advanced Synthesis & Next Steps",
        lessons: [
          {
            title: "5. Functions and Modular Architecture",
            content: "### Reusable Code Blocks\n\nFunctions package logic so it can be called anywhere without repeating code.\n\n#### Benefits\n- Reduces clutter and bugs.\n- Simplifies collaborative development.",
            script: "You have reached Module Three! Now we look at functions—how to encapsulate your code into tidy, reusable building blocks."
          },
          {
            title: "6. Summary Checkpoint and Next Steps",
            content: "### Celebrating Your Milestone\n\nCongratulations on completing the core foundations of programming!\n\nPut your new skills to the test right now by launching the Adhyaya Test Series.",
            script: "Congratulations! You have completed the foundational pathway. Head over to the Test Series tab now to test your knowledge!"
          }
        ]
      }
    ]
  }
};

/**
 * Returns the localized version of a course given language code ('kn', 'hi', 'en').
 */
export function getBuiltinCourse(langCode = "en") {
  return BUILTIN_COURSES[langCode] || BUILTIN_COURSES.en;
}
