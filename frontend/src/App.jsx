import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NeuroProvider } from "./context/NeuroContext";
import { LanguageProvider } from "./context/LanguageContext";
import Auth from "./components/Auth";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import CourseViewer from "./components/CourseViewer";
import TestGenerator from "./components/TestGenerator";
import AvatarUpload from "./components/AvatarUpload";
import Chatbot from "./components/Chatbot";
import GameArcade from "./components/GameArcade";

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [arcadeGame, setArcadeGame] = useState("math");
  
  // Custom courses and quizzes generated in session
  const [courses, setCourses] = useState([
    {
      title: "Foundations of Python & Logical Thinking",
      description: "Learn foundational concepts of programming: variables, flow control, functions, and algorithmic intuition designed for clear mental models.",
      pace: "Medium",
      completedCount: 1,
      completedLessons: {
        "What is Programming?": true
      },
      modules: [
        {
          module_title: "Core Computational Thinking",
          lessons: [
            {
              title: "What is Programming?",
              content: "Programming is the art of communicating structured logic to a computer to solve meaningful problems.\n\nKey pillars include input, transformation, state management, and output. In this lesson, we demystify algorithms through intuitive everyday analogies like following a cooking recipe or coordinating a team.",
              script: "Namaste and welcome to Adhyaya! Today we are exploring the foundations of logical thinking and programming. We will break down instructions into clean, bite-sized steps. Let's get started!"
            },
            {
              title: "Variables and State",
              content: "Variables act like labeled storage boxes in your computer's memory.\n\nWhether holding text, numbers, or true/false conditions, understanding variables allows your programs to remember facts, track scores, and adapt dynamically to student inputs.",
              script: "In this second lesson, we look at variables. Think of them like labeled containers in your study desk—each one holds a specific item for quick retrieval whenever you need it."
            }
          ]
        }
      ]
    }
  ]);

  const [quizzes, setQuizzes] = useState([
    {
      topic: "Python & Logic Basics",
      level: "Easy",
      questions: [
        {
          question_text: "What is the primary role of a variable in a computer program?",
          options: ["To store and reference data in memory", "To delete files randomly", "To slow down execution", "To turn off the screen"],
          correct_option: "To store and reference data in memory",
          explanation: "Variables act as labeled storage locations in memory that hold data values for computation and recall."
        }
      ]
    }
  ]);

  // Global avatar configurations - stored in localStorage for persistence across reloads/sessions
  const [avatarConfig, setAvatarConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("adhyaya_avatar_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.imageUrl || parsed.name)) {
          return parsed;
        }
      }
    } catch (e) {}
    return {
      imageUrl: "/avatars/figurine_male.jpg",
      imageFile: null,
      name: "Realistic AI Teacher",
      voiceGender: "male",
      voiceId: "en-IN-PrabhatNeural",
      voiceName: "Prabhat (Male Indian Neural)"
    };
  });

  const [globalAvatarVideo, setGlobalAvatarVideo] = useState(() => {
    try {
      return localStorage.getItem("adhyaya_global_avatar_video") || "";
    } catch (e) {
      return "";
    }
  });

  // Save avatarConfig to localStorage
  React.useEffect(() => {
    try {
      const { imageFile, ...serializable } = avatarConfig;
      localStorage.setItem("adhyaya_avatar_config", JSON.stringify(serializable));
    } catch (e) {}
  }, [avatarConfig]);

  // Save globalAvatarVideo to localStorage
  React.useEffect(() => {
    try {
      if (globalAvatarVideo) {
        localStorage.setItem("adhyaya_global_avatar_video", globalAvatarVideo);
      }
    } catch (e) {}
  }, [globalAvatarVideo]);

  const [activeCourse, setActiveCourse] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080c14] text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center text-3xl font-black mb-4 animate-pulse">
          अ
        </div>
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Loading Adhyaya...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "dashboard" && (
        <Dashboard
          courses={courses}
          quizzes={quizzes}
          setActiveTab={setActiveTab}
          onSelectCourse={setActiveCourse}
          avatarVideo={globalAvatarVideo}
          onOpenArcade={(gameId) => {
            setArcadeGame(gameId || "math");
            setActiveTab("arcade");
          }}
        />
      )}

      {activeTab === "courses" && (
        <CourseViewer
          courses={courses}
          setCourses={setCourses}
          activeCourse={activeCourse}
          setActiveCourse={setActiveCourse}
          avatarConfig={avatarConfig}
          setAvatarConfig={setAvatarConfig}
          globalAvatarVideo={globalAvatarVideo}
          setGlobalAvatarVideo={setGlobalAvatarVideo}
        />
      )}

      {activeTab === "quizzes" && (
        <TestGenerator
          quizzes={quizzes}
          setQuizzes={setQuizzes}
        />
      )}

      {activeTab === "arcade" && (
        <GameArcade
          initialGame={arcadeGame}
        />
      )}

      {activeTab === "avatar" && (
        <AvatarUpload
          avatarConfig={avatarConfig}
          setAvatarConfig={setAvatarConfig}
          setGlobalAvatarVideo={setGlobalAvatarVideo}
        />
      )}

      {/* Indianized Humorous Chatbot Guru Ji */}
      <Chatbot />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NeuroProvider>
          <MainApp />
        </NeuroProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
