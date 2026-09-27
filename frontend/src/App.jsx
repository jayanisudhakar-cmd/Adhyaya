import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Auth from "./components/Auth";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import CourseViewer from "./components/CourseViewer";
import TestGenerator from "./components/TestGenerator";
import AvatarUpload from "./components/AvatarUpload";

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Custom courses and quizzes generated in session
  const [courses, setCourses] = useState([
    {
      title: "Introduction to FastAPI Framework",
      description: "Learn the core concepts of FastAPI: path parameters, query parameters, Pydantic validation, and setting up clean routers.",
      pace: "Medium",
      completedCount: 1,
      completedLessons: {
        "What is FastAPI?": true
      },
      modules: [
        {
          module_title: "Getting Started",
          lessons: [
            {
              title: "What is FastAPI?",
              content: "FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.8+ based on standard Python type hints.\n\nKey features include extreme speed, high code-readability, automated Swagger documentation, and robust Pydantic schemas validation. In this lesson, we will set up our first endpoint returning a classic Hello World dictionary object.",
              script: "Welcome to Namma Guru! Today we are exploring FastAPI, a lightning-fast framework for building modern Python APIs. We'll set up a simple endpoint and look at how Python type hints automate API validation. Let's get started!"
            },
            {
              title: "Path and Query Parameters",
              content: "FastAPI allows capturing variables in the URL path, as well as optional query parameters.\n\nPath parameters are declared inside curly brackets (e.g. `/items/{item_id}`) and map to python function parameters. Query parameters are any parameters not matching path placeholders. FastAPI automatically validates type hints and displays parameters cleanly inside the automated Swagger docs.",
              script: "In this lesson, we will learn about URL path variables and query parameters. FastAPI validates these automatically using Python's native type annotations, ensuring client requests are format-validated before reaching your route logic."
            }
          ]
        }
      ]
    }
  ]);

  const [quizzes, setQuizzes] = useState([
    {
      topic: "FastAPI Basics",
      level: "Easy",
      questions: [
        {
          question_text: "Which Python package validates data schemas in FastAPI?",
          options: ["Pydantic", "SQLAlchemy", "Jinja2", "Requests"],
          correct_option: "Pydantic",
          explanation: "FastAPI relies on Pydantic schemas to validate query, path, and request body parameters automatically."
        }
      ]
    }
  ]);

  // Global avatar configurations
  const [avatarConfig, setAvatarConfig] = useState({
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face", // default Sarah image
    imageFile: null, // holds local File objects uploaded via Dropbox
    name: "Sarah (Math & Sci)",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    voiceName: "Rachel (Warm, Professional)"
  });

  const [globalAvatarVideo, setGlobalAvatarVideo] = useState("");
  const [activeCourse, setActiveCourse] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080c14] text-white">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Loading Namma Guru...</p>
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
        />
      )}

      {activeTab === "courses" && (
        <CourseViewer
          courses={courses}
          setCourses={setCourses}
          activeCourse={activeCourse}
          setActiveCourse={setActiveCourse}
          avatarConfig={avatarConfig}
          globalAvatarVideo={globalAvatarVideo}
        />
      )}

      {activeTab === "quizzes" && (
        <TestGenerator
          quizzes={quizzes}
          setQuizzes={setQuizzes}
        />
      )}

      {activeTab === "avatar" && (
        <AvatarUpload
          avatarConfig={avatarConfig}
          setAvatarConfig={setAvatarConfig}
          setGlobalAvatarVideo={setGlobalAvatarVideo}
        />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
