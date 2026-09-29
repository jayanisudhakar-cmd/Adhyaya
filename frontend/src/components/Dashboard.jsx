import React from "react";
import { BookOpen, Trophy, Sparkles, Plus, Play, Award, GraduationCap, Video, MessageSquare } from "lucide-react";
import NeuroInclusionHub from "./NeuroInclusionHub";
import { useNeuro } from "../context/NeuroContext";

export default function Dashboard({ courses, quizzes, setActiveTab, onSelectCourse, avatarVideo }) {
  const { neuroMode } = useNeuro();

  const totalCourses = courses.length;
  const totalQuizzes = quizzes.length;
  
  const completedLessons = courses.reduce((acc, course) => {
    return acc + (course.completedCount || 0);
  }, 0);
  
  const totalLessons = courses.reduce((acc, course) => {
    let count = 0;
    course.modules?.forEach(mod => {
      count += mod.lessons?.length || 0;
    });
    return acc + count;
  }, 0);

  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 border border-white/10 bg-gradient-to-r from-slate-900 via-brand-950/20 to-slate-900 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-brand-500/10 via-blue-500/5 to-transparent blur-3xl -z-10 pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-500/20 border border-brand-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Adhyaya • Sanskrit for Chapter of Knowledge
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Personalized Learning For <span className="text-gradient-brand">Every Mind</span>.
          </h1>
          <p className="text-gray-400 max-w-2xl text-xs sm:text-sm leading-relaxed">
            Welcome to Adhyaya. Whether neurotypical or thriving with Dyslexia, Dyscalculia, ADHD, Sensory needs, or Dysgraphia, study structured courses alongside your animated virtual teacher figurine and humorous AI study mentor.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setActiveTab("courses")}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md shadow-brand-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Custom Course
            </button>
            <button
              onClick={() => setActiveTab("avatar")}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all border border-white/10 flex items-center gap-2"
            >
              <Video className="w-4 h-4" /> Virtual Teacher Studio
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Active Courses</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{totalCourses}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Test Series Generated</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{totalQuizzes}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Mastery Progress</p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent || 8}%` }}></div>
              </div>
              <span className="text-xs font-bold text-white text-right">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Side Neuro-Inclusion Hub + Right Side Learning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Span 4): Dedicated Neuro-Inclusion Hub */}
        <div className="lg:col-span-4 space-y-6">
          <NeuroInclusionHub />

          {/* Quick Guru Ji Prompt Box */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-gradient-to-tr from-amber-950/20 to-slate-900 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">👳🏽‍♂️</span>
              <div>
                <h4 className="font-bold text-white text-xs">Guru Ji's Quick Word</h4>
                <p className="text-[10px] text-amber-300/80">Humorous AI Study Mitra</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed italic">
              "Arre, studying is not a chore—it is an art! Take 15 minutes today, crack one concept, and celebrate with a good snack. Ready?"
            </p>
          </div>
        </div>

        {/* Right Columns (Span 8): Courses & Assessments */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Courses List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-brand-400" />
                Active Learning Channels
              </h2>
              <button
                onClick={() => setActiveTab("courses")}
                className="text-brand-400 hover:text-brand-300 text-xs font-semibold transition-colors"
              >
                View All Courses →
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center border border-dashed border-white/10 space-y-3">
                <p className="text-gray-400 text-xs">No courses generated yet. Kickstart your learning today!</p>
                <button
                  onClick={() => setActiveTab("courses")}
                  className="bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 font-semibold px-4 py-2 rounded-xl text-xs border border-brand-500/20 transition-all"
                >
                  + Generate First Course
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {courses.slice(0, 4).map((course, idx) => {
                  const modulesCount = course.modules?.length || 0;
                  let lessonsCount = 0;
                  course.modules?.forEach(mod => {
                    lessonsCount += mod.lessons?.length || 0;
                  });
                  
                  return (
                    <div key={idx} className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/5 flex flex-col justify-between h-48">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">{course.title}</h3>
                          <span className="bg-brand-500/10 text-brand-400 text-[9px] font-bold px-2 py-0.5 rounded border border-brand-500/20 uppercase shrink-0">
                            {course.pace || "Medium"}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">{course.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                        <div className="text-[10px] text-gray-500 font-semibold">
                          {modulesCount} Modules • {lessonsCount} Lessons
                        </div>
                        <button
                          onClick={() => {
                            onSelectCourse(course);
                            setActiveTab("courses");
                          }}
                          className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-lg transition-all shadow-md shadow-brand-500/10 flex items-center justify-center"
                          title="Open Course Classroom"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quizzes & Avatar Status Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Recent Quizzes */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-brand-400" />
                Assessment Series
              </h3>

              {quizzes.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-white/10 rounded-xl space-y-2">
                  <p className="text-gray-400 text-xs">No customized quizzes yet.</p>
                  <button
                    onClick={() => setActiveTab("quizzes")}
                    className="bg-slate-800 text-white px-3 py-1 rounded-lg text-xs hover:bg-slate-700"
                  >
                    Generate Quiz
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.slice(0, 2).map((quiz, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex justify-between items-center">
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-white text-xs truncate">{quiz.topic}</h4>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Level: {quiz.level} • {quiz.questions?.length} Qs</span>
                      </div>
                      <button
                        onClick={() => setActiveTab("quizzes")}
                        className="text-xs text-brand-400 hover:text-brand-300 font-bold shrink-0"
                      >
                        Retake
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Teacher Avatar Status */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-brand-400" />
                  Virtual Figurine Studio
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Upload a photo of any teacher to generate an animated virtual AI figurine with real-time lip-sync to teach your lessons.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("avatar")}
                className="w-full py-2.5 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/30 rounded-xl text-xs font-bold transition-all text-center"
              >
                Open Figurine Studio →
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
