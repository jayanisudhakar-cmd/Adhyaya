import React from "react";
import { BookOpen, Trophy, Sparkles, Plus, Play, Award, GraduationCap, Video } from "lucide-react";

export default function Dashboard({ courses, quizzes, setActiveTab, onSelectCourse, avatarVideo }) {
  // Compute basic stats
  const totalCourses = courses.length;
  const totalQuizzes = quizzes.length;
  
  // Calculate general progress (mocked or actual)
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 border border-white/5 bg-gradient-to-r from-slate-900 via-brand-950/20 to-slate-900 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-brand-500/10 to-transparent blur-2xl -z-10 pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-500/20 border border-brand-500/30 px-3 py-1 rounded-full text-xs font-semibold text-brand-300">
            <Sparkles className="w-3.5 h-3.5" />
            Empowered by Gemini 2.5 & D-ID
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Learn Anything, Custom Tailored to <span className="text-gradient-brand">Your Pace</span>.
          </h1>
          <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
            Create completely custom structured courses, take generated tests to assess your knowledge, and study alongside your own generated AI Virtual Teacher!
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setActiveTab("courses")}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-md shadow-brand-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Course
            </button>
            <button
              onClick={() => setActiveTab("avatar")}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all border border-white/5 flex items-center gap-2"
            >
              <Video className="w-4 h-4" /> Custom Teacher Avatar
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Generated Courses</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{totalCourses}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Test Series Generated</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{totalQuizzes}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Platform Progress</p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent || 5}%` }}></div>
              </div>
              <span className="text-sm font-bold text-white text-right">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-400" />
              Active Learning Channels
            </h2>
            <button
              onClick={() => setActiveTab("courses")}
              className="text-brand-400 hover:text-brand-300 text-xs font-semibold transition-colors"
            >
              View All
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center border border-dashed border-white/10">
              <p className="text-gray-400 text-sm">No courses generated yet. Kickstart your learning today!</p>
              <button
                onClick={() => setActiveTab("courses")}
                className="mt-4 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 font-semibold px-4 py-2 rounded-xl text-xs border border-brand-500/20 transition-all"
              >
                + New Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.slice(0, 4).map((course, idx) => {
                // Compute total modules / lessons
                const modulesCount = course.modules?.length || 0;
                let lessonsCount = 0;
                course.modules?.forEach(mod => {
                  lessonsCount += mod.lessons?.length || 0;
                });
                
                return (
                  <div key={idx} className="glass-panel glass-panel-hover rounded-xl p-5 border border-white/5 flex flex-col justify-between h-48">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-white text-base leading-tight truncate-2-lines">{course.title}</h3>
                        <span className="bg-brand-500/10 text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded border border-brand-500/20 uppercase shrink-0">
                          Gemini
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">{course.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                      <div className="text-[10px] text-gray-500 font-semibold">
                        {modulesCount} Modules • {lessonsCount} Lessons
                      </div>
                      <button
                        onClick={() => {
                          onSelectCourse(course);
                          setActiveTab("courses");
                        }}
                        className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-lg transition-all shadow-md shadow-brand-500/10 flex items-center justify-center"
                        title="Resume Course"
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

        {/* Right Column: Mini Widgets */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-400" />
            Recent Assessments
          </h2>

          {quizzes.length === 0 ? (
            <div className="glass-panel rounded-xl p-6 text-center border border-dashed border-white/10">
              <p className="text-gray-400 text-xs">No customized quizzes generated yet.</p>
              <button
                onClick={() => setActiveTab("quizzes")}
                className="mt-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3 py-1.5 rounded-lg text-[10px] border border-white/5 transition-all"
              >
                Create Quiz
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.slice(0, 3).map((quiz, idx) => (
                <div key={idx} className="glass-panel p-4 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white text-xs truncate max-w-[150px]">{quiz.topic}</h4>
                    <span className="text-[10px] text-gray-500 mt-1 block">Level: {quiz.level} • {quiz.questions?.length} Questions</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("quizzes")}
                    className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                  >
                    Open <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Info Teacher Avatar */}
          <div className="glass-panel p-5 rounded-xl bg-gradient-to-tr from-brand-950/10 to-slate-900 border border-white/5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Video className="w-4 h-4 text-brand-400" /> Virtual Avatar Status
            </h3>
            {avatarVideo ? (
              <div className="space-y-2">
                <p className="text-[11px] text-brand-300 font-medium">✅ Custom Virtual Teacher video generated.</p>
                <video src={avatarVideo} controls className="w-full rounded-lg h-24 object-cover border border-white/10" />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-400">❌ No custom video generated yet. Set up your teacher avatar to watch animated course lectures.</p>
                <button
                  onClick={() => setActiveTab("avatar")}
                  className="w-full py-2 bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold rounded-lg hover:bg-brand-500/20 transition-all"
                >
                  Configure Avatar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
