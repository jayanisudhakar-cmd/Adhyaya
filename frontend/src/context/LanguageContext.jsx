import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);

export const NAVIGATION_LANGUAGES = [
  { id: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { id: "kn", label: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { id: "hi", label: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { id: "ta", label: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { id: "te", label: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" }
];

export const COURSE_LANGUAGES = [
  { id: "kn", label: "Kannada (ಕನ್ನಡ)", speechLang: "Kannada", flag: "🇮🇳", desc: "ಕನ್ನಡದಲ್ಲಿ ಕಲಿಯಿರಿ" },
  { id: "en", label: "English (Indian Accent)", speechLang: "English", flag: "🇮🇳", desc: "Learn in English" },
  { id: "hi", label: "Hindi (हिन्दी)", speechLang: "Hindi", flag: "🇮🇳", desc: "हिन्दी में सीखें" },
  { id: "ta", label: "Tamil (தமிழ்)", speechLang: "Tamil", flag: "🇮🇳", desc: "தமிழில் கற்கவும்" },
  { id: "te", label: "Telugu (తెలుగు)", speechLang: "Telugu", flag: "🇮🇳", desc: "తెలుగులో నేర్చుకోండి" }
];

const TRANSLATIONS = {
  en: {
    // Nav & Sidebar
    navDashboard: "Dashboard",
    navCourses: "My Courses",
    navQuizzes: "Test Series",
    navArcade: "Play & Learn",
    navAvatar: "AI Teacher Studio",
    platformSubtitle: "AI Academy",
    learningDashboard: "Personalized Learning Platform",
    signedInAs: "Signed in as",
    logout: "Log out",

    // Dual Language Labels
    navLangTitle: "Website Language",
    navLangDesc: "Controls menus, buttons, and interface labels",
    courseLangTitle: "Course Content Language",
    courseLangDesc: "Controls generated lessons, quizzes, and teacher speech",

    // Dashboard Banner & Buttons
    welcomeBadge: "Adhyaya • Sanskrit for Chapter of Knowledge",
    bannerTitle: "Personalized Learning For",
    bannerTitleHighlight: "Every Mind",
    bannerDesc: "Welcome to Adhyaya. Whether neurotypical or thriving with Dyslexia, Dyscalculia, ADHD, Sensory needs, or Dysgraphia, study structured courses alongside your animated virtual teacher and AI study mentor.",
    btnCreateCourse: "Create Custom Course",
    btnPlayArcade: "Play & Learn Arcade",
    btnTeacherStudio: "Virtual Teacher Studio",

    // Stats
    statActiveCourses: "Active Courses",
    statQuizzesTaken: "Test Series",
    statProgress: "Overall Progress",
    statLessonsCompleted: "Lessons Completed",

    // Course Generator
    courseGeneratorTitle: "Create Your Personalized AI Course",
    courseTopicLabel: "Course Topic or Subject",
    courseTopicPlaceholder: "e.g. Introduction to Python, Quantum Mechanics, Vedic Math...",
    courseLangLabel: "Instruction / Course Language",
    paceLabel: "Learning Cadence & Pace",
    btnGenerateCourse: "Generate Course Syllabus & Lessons",
    generatingCourse: "Synthesizing Personalized Lessons...",

    // Avatar Studio
    avatarStudioTitle: "Realistic AI Teacher Studio",
    step1Title: "Step 1: Create Realistic AI Teacher Avatar",
    step2Title: "Step 2: Free Speech Audio in Kannada & English",
    step3Title: "Step 3: Render Synced Talking Avatar Video (.mp4)",
    renderVideoBtn: "Render Synced Talking Avatar (.mp4)",
    saveMp4Btn: "Save MP4"
  },
  kn: {
    // Nav & Sidebar
    navDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    navCourses: "ನನ್ನ ಕೋರ್ಸ್‌ಗಳು",
    navQuizzes: "ಪರೀಕ್ಷಾ ಸರಣಿ",
    navArcade: "ಆಟವಾಡಿ ಕಲಿಯಿರಿ",
    navAvatar: "ಎಐ ಶಿಕ್ಷಕರ ಸ್ಟುಡಿಯೋ",
    platformSubtitle: "ಎಐ ಅಕಾಡೆಮಿ",
    learningDashboard: "ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ಕಲಿಕಾ ವೇದಿಕೆ",
    signedInAs: "ಲಾಗಿನ್ ಆಗಿರುವವರು",
    logout: "ನಿರ್ಗಮಿಸಿ",

    // Dual Language Labels
    navLangTitle: "ವೆಬ್‌ಸೈಟ್ ಭಾಷೆ",
    navLangDesc: "ಮೆನುಗಳು, ಬಟನ್‌ಗಳು ಮತ್ತು ಇಂಟರ್‌ಫೇಸ್ ಪಠ್ಯವನ್ನು ಬದಲಾಯಿಸುತ್ತದೆ",
    courseLangTitle: "ಕೋರ್ಸ್ ವಿಷಯ ಭಾಷೆ",
    courseLangDesc: "ರಚಿಸಲಾದ ಪಠ್ಯಕ್ರಮ, ರಸಪ್ರಶ್ನೆಗಳು ಮತ್ತು ಶಿಕ್ಷಕರ ಧ್ವನಿಯನ್ನು ನಿಯಂತ್ರಿಸುತ್ತದೆ",

    // Dashboard Banner & Buttons
    welcomeBadge: "ಅಧ್ಯಾಯ • ಜ್ಞಾನದ ನವ ಅಧ್ಯಾಯ",
    bannerTitle: "ಪ್ರತಿಯೊಬ್ಬರಿಗೂ",
    bannerTitleHighlight: "ವೈಯಕ್ತಿಕ ಕಲಿಕೆ",
    bannerDesc: "ಅಧ್ಯಾಯ ವೇದಿಕೆಗೆ ಸುಸ್ವಾಗತ. ಡಿಸ್ಲೆಕ್ಸಿಯಾ, ಎಡಿಎಚ್‌ಡಿ ಅಥವಾ ಸಾಮಾನ್ಯ ಕಲಿಕಾರ್ಥಿಯಾಗಿರಲಿ, ನಿಮ್ಮದೇ ಎಐ ಶಿಕ್ಷಕರೊಂದಿಗೆ ಸುಲಭವಾಗಿ ಕಲಿಯಿರಿ.",
    btnCreateCourse: "ಹೊಸ ಕೋರ್ಸ್ ರಚಿಸಿ",
    btnPlayArcade: "ಆರ್ಕೇಡ್ ಆಟಗಳು",
    btnTeacherStudio: "ವರ್ಚುವಲ್ ಶಿಕ್ಷಕರ ಸ್ಟುಡಿಯೋ",

    // Stats
    statActiveCourses: "ಸಕ್ರಿಯ ಕೋರ್ಸ್‌ಗಳು",
    statQuizzesTaken: "ಪರೀಕ್ಷಾ ಸರಣಿ",
    statProgress: "ಒಟ್ಟು ಪ್ರಗತಿ",
    statLessonsCompleted: "ಪೂರ್ಣಗೊಂಡ ಪಾಠಗಳು",

    // Course Generator
    courseGeneratorTitle: "ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಎಐ ಕೋರ್ಸ್ ರಚಿಸಿ",
    courseTopicLabel: "ಕೋರ್ಸ್ ವಿಷಯ ಅಥವಾ ಪಾಠ",
    courseTopicPlaceholder: "ಉದಾಹರಣೆಗೆ: ಪೈಥಾನ್ ಪ್ರೋಗ್ರಾಮಿಂಗ್, ಕ್ವಾಂಟಮ್ ಭೌತಶಾಸ್ತ್ರ...",
    courseLangLabel: "ಕಲಿಕೆಯ / ಕೋರ್ಸ್ ಭಾಷೆ",
    paceLabel: "ಕಲಿಕೆಯ ವೇಗ",
    btnGenerateCourse: "ಕೋರ್ಸ್ ಮತ್ತು ಪಾಠಗಳನ್ನು ರಚಿಸಿ",
    generatingCourse: "ಪಾಠಗಳನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ...",

    // Avatar Studio
    avatarStudioTitle: "ನೈಜ ಎಐ ಶಿಕ್ಷಕರ ಸ್ಟುಡಿಯೋ",
    step1Title: "ಹಂತ 1: ನೈಜ ಎಐ ಶಿಕ್ಷಕರ ಅವತಾರ ರಚಿಸಿ",
    step2Title: "ಹಂತ 2: ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಉಚಿತ ಆಡಿಯೋ ಧ್ವನಿ",
    step3Title: "ಹಂತ 3: ಮಾತನಾಡುವ ಅವತಾರ ವೀಡಿಯೊ ರೆಂಡರ್ ಮಾಡಿ (.mp4)",
    renderVideoBtn: "ಮಾತನಾಡುವ ವೀಡಿಯೊ ರೆಂಡರ್ ಮಾಡಿ (.mp4)",
    saveMp4Btn: "ವೀಡಿಯೊ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"
  },
  hi: {
    // Nav & Sidebar
    navDashboard: "डैशबोर्ड",
    navCourses: "मेरे पाठ्यक्रम",
    navQuizzes: "टेस्ट सीरीज़",
    navArcade: "खेलो और सीखो",
    navAvatar: "एआई शिक्षक स्टूडियो",
    platformSubtitle: "एआई अकादमी",
    learningDashboard: "व्यक्तिगत शिक्षण मंच",
    signedInAs: "लॉगिन उपयोगकर्ता",
    logout: "लॉग आउट",

    // Dual Language Labels
    navLangTitle: "वेबसाइट भाषा",
    navLangDesc: "मेनू, बटन और इंटरफ़ेस टेक्स्ट बदलता है",
    courseLangTitle: "पाठ्यक्रम भाषा",
    courseLangDesc: "निर्मित पाठ, प्रश्नोत्तरी और शिक्षक आवाज़ को नियंत्रित करता है",

    // Dashboard Banner & Buttons
    welcomeBadge: "अध्याय • ज्ञान का नया अध्याय",
    bannerTitle: "हर मस्तिष्क के लिए",
    bannerTitleHighlight: "व्यक्तिगत शिक्षण",
    bannerDesc: "अध्याय में आपका स्वागत है। डिस्लेक्सिया, एडीएचडी या सामान्य शिक्षार्थियों के लिए, अपने एआई शिक्षक के साथ सहजता से सीखें।",
    btnCreateCourse: "कस्टम कोर्स बनाएं",
    btnPlayArcade: "आर्केड गेम्स",
    btnTeacherStudio: "वर्चुअल शिक्षक स्टूडियो",

    // Stats
    statActiveCourses: "सक्रिय पाठ्यक्रम",
    statQuizzesTaken: "टेस्ट सीरीज़",
    statProgress: "कुल प्रगति",
    statLessonsCompleted: "पूर्ण किए गए पाठ",

    // Course Generator
    courseGeneratorTitle: "अपना व्यक्तिगत एआई कोर्स बनाएं",
    courseTopicLabel: "पाठ्यक्रम विषय",
    courseTopicPlaceholder: "उदा: पायथन प्रोग्रामिंग, क्वांटम भौतिकी...",
    courseLangLabel: "शिक्षण / पाठ्यक्रम भाषा",
    paceLabel: "सीखने की गति",
    btnGenerateCourse: "कोर्स और पाठ तैयार करें",
    generatingCourse: "पाठ्यक्रम तैयार हो रहा है...",

    // Avatar Studio
    avatarStudioTitle: "सटीक एआई शिक्षक स्टूडियो",
    step1Title: "चरण 1: वास्तविक एआई शिक्षक अवतार बनाएं",
    step2Title: "चरण 2: कन्नड़ और अंग्रेज़ी में मुफ्त आवाज़",
    step3Title: "चरण 3: लिप-सिंक वीडियो तैयार करें (.mp4)",
    renderVideoBtn: "बोलने वाला वीडियो बनाएं (.mp4)",
    saveMp4Btn: "वीडियो सेव करें"
  },
  ta: {
    // Nav & Sidebar
    navDashboard: "டாஷ்போர்டு",
    navCourses: "எனது படிப்புகள்",
    navQuizzes: "தேர்வுத் தொடர்",
    navArcade: "விளையாடி கற்போம்",
    navAvatar: "AI ஆசிரியர் அரங்கம்",
    platformSubtitle: "AI அகாடமி",
    learningDashboard: "தனிப்பயனாக்கப்பட்ட கற்றல் தளம்",
    signedInAs: "உள்நுழைந்துள்ளவர்",
    logout: "வெளியேறு",

    // Dual Language Labels
    navLangTitle: "வலைத்தள மொழி",
    navLangDesc: "மெனுக்கள் மற்றும் பொத்தான்களை மாற்றுகிறது",
    courseLangTitle: "பாடநெறி மொழி",
    courseLangDesc: "பாடங்கள் மற்றும் ஆசிரியர் குரலை மாற்றுகிறது",

    // Dashboard Banner & Buttons
    welcomeBadge: "அத்யாயா • அறிவின் அத்தியாயம்",
    bannerTitle: "அனைவருக்குமான",
    bannerTitleHighlight: "தனிப்பயன் கற்றல்",
    bannerDesc: "அத்யாயாவிற்கு நல்வரவு. உங்கள் விருப்பப்படி AI ஆசிரியருடன் படிப்படியாகக் கற்றுக்கொள்ளுங்கள்.",
    btnCreateCourse: "புதிய பாடம் உருவாக்கு",
    btnPlayArcade: "விளையாட்டுப் பகுதி",
    btnTeacherStudio: "ஆசிரியர் அரங்கம்",

    // Stats
    statActiveCourses: "செயலில் உள்ள படிப்புகள்",
    statQuizzesTaken: "தேர்வுகள்",
    statProgress: "மொத்த முன்னேற்றம்",
    statLessonsCompleted: "முடிந்த பாடங்கள்",

    // Course Generator
    courseGeneratorTitle: "உங்கள் தனிப்பயன் பாடத்தை உருவாக்கவும்",
    courseTopicLabel: "பாடத் தலைப்பு",
    courseTopicPlaceholder: "எ.கா: பைதான் நிரலாக்கம், இயற்பியல்...",
    courseLangLabel: "கற்கும் மொழி",
    paceLabel: "கற்றல் வேகம்",
    btnGenerateCourse: "பாடத்திட்டத்தை உருவாக்கவும்",
    generatingCourse: "பாடங்கள் தயாராகின்றன...",

    // Avatar Studio
    avatarStudioTitle: "AI ஆசிரியர் அரங்கம்",
    step1Title: "படி 1: AI ஆசிரியர் உருவம் உருவாக்குங்கள்",
    step2Title: "படி 2: இலவச குரல் ஒலி",
    step3Title: "படி 3: பேசும் வீடியோவை உருவாக்கவும் (.mp4)",
    renderVideoBtn: "வீடியோ உருவாக்கவும் (.mp4)",
    saveMp4Btn: "வீடியோவைச் சேமி"
  },
  te: {
    // Nav & Sidebar
    navDashboard: "డాష్‌బోర్డ్",
    navCourses: "నా కోర్సులు",
    navQuizzes: "పరీక్షల శ్రేణి",
    navArcade: "ఆడుతూ నేర్చుకోండి",
    navAvatar: "AI ఉపాధ్యాయ స్టూడియో",
    platformSubtitle: "AI అకాడమీ",
    learningDashboard: "వ్యక్తిగతీకరించిన అభ్యాస వేదిక",
    signedInAs: "లాగిన్ అయినవారు",
    logout: "లాగ్ అవుట్",

    // Dual Language Labels
    navLangTitle: "వెబ్‌సైట్ భాష",
    navLangDesc: "మెనూలు మరియు బటన్ల భాషను మారుస్తుంది",
    courseLangTitle: "కోర్సు విషయ భాష",
    courseLangDesc: "పాఠాలు మరియు ఉపాధ్యాయుల స్వరాన్ని మారుస్తుంది",

    // Dashboard Banner & Buttons
    welcomeBadge: "అధ్యాయా • జ్ఞాన నవ అధ్యాయం",
    bannerTitle: "అందరికీ",
    bannerTitleHighlight: "వ్యక్తిగత అభ్యాసం",
    bannerDesc: "అధ్యాయాకు స్వాగతం. మీ AI గురువుతో కలిసి సులభంగా మరియు వేగంగా నేర్చుకోండి.",
    btnCreateCourse: "కొత్త కోర్సు రూపొందించండి",
    btnPlayArcade: "గేమ్స్ ఆర్కేడ్",
    btnTeacherStudio: "వర్చువల్ టీచర్ స్టూడియో",

    // Stats
    statActiveCourses: "యాక్టివ్ కోర్సులు",
    statQuizzesTaken: "పరీక్షలు",
    statProgress: "మొత్తం ప్రగతి",
    statLessonsCompleted: "పూర్తయిన పాఠాలు",

    // Course Generator
    courseGeneratorTitle: "మీ వ్యక్తిగత AI కోర్సును రూపొందించండి",
    courseTopicLabel: "కోర్సు అంశం",
    courseTopicPlaceholder: "ఉదా: పైథాన్ ప్రోగ్రామింగ్, భౌతిక శాస్త్రం...",
    courseLangLabel: "నేర్చుకునే భాష",
    paceLabel: "అభ్యాస వేగం",
    btnGenerateCourse: "కోర్సును రూపొందించండి",
    generatingCourse: "పాఠాలు తయారవుతున్నాయి...",

    // Avatar Studio
    avatarStudioTitle: "రియలిస్టిక్ AI టీచర్ స్టూడియో",
    step1Title: "దశ 1: AI టీచర్ అవతార్ సృష్టించండి",
    step2Title: "దశ 2: ఉచిత ఆడియో వాయిస్",
    step3Title: "దశ 3: మాట్లాడే వీడియోని రూపొందించండి (.mp4)",
    renderVideoBtn: "వీడియోను రెండర్ చేయండి (.mp4)",
    saveMp4Btn: "వీడియోను సేవ్ చేయండి"
  }
};

export function LanguageProvider({ children }) {
  // Mode 1: Website Navigation Language
  const [navLanguage, setNavLanguageState] = useState(() => {
    return localStorage.getItem("adhyaya_nav_lang") || "en";
  });

  // Mode 2: Course Content Language (default to Kannada or English)
  const [courseLanguage, setCourseLanguageState] = useState(() => {
    return localStorage.getItem("adhyaya_course_lang") || "kn";
  });

  const setNavLanguage = (lang) => {
    setNavLanguageState(lang);
    localStorage.setItem("adhyaya_nav_lang", lang);
  };

  const setCourseLanguage = (lang) => {
    setCourseLanguageState(lang);
    localStorage.setItem("adhyaya_course_lang", lang);
  };

  // Translation helper
  const t = (key, fallback = "") => {
    const dict = TRANSLATIONS[navLanguage] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || fallback || key;
  };

  // Get active navigation language object
  const currentNavLang = NAVIGATION_LANGUAGES.find((l) => l.id === navLanguage) || NAVIGATION_LANGUAGES[0];

  // Get active course content language object
  const currentCourseLang = COURSE_LANGUAGES.find((l) => l.id === courseLanguage) || COURSE_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        navLanguage,
        setNavLanguage,
        currentNavLang,
        courseLanguage,
        setCourseLanguage,
        currentCourseLang,
        t,
        NAVIGATION_LANGUAGES,
        COURSE_LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
