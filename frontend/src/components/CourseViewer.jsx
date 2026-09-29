import React, { useState } from "react";
import { generateCourse, generateAvatarVideo } from "../services/api";
import { useNeuro } from "../context/NeuroContext";
import { 
  BookOpen, 
  Sparkles, 
  Loader2, 
  Play, 
  Pause,
  Video, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Volume2,
  VolumeX,
  Eye,
  Zap,
  Mic
} from "lucide-react";

export default function CourseViewer({ courses, setCourses, activeCourse, setActiveCourse, avatarConfig, globalAvatarVideo }) {
  const { neuroMode } = useNeuro();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("English");
  const [pace, setPace] = useState("Medium");
  const [generating, setGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Selected lesson state
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [generatingLessonVideo, setGeneratingLessonVideo] = useState(false);
  const [lessonVideos, setLessonVideos] = useState({}); // caches generated videos: { lessonTitle: videoUrl }
  const [error, setError] = useState("");
  const [showGenerator, setShowGenerator] = useState(courses.length === 0);

  const toggleLessonSpeech = (textToSpeak) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.includes("en-IN") || v.name.includes("India"));
    if (match) utterance.voice = match;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateCourse = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setError("");
    setGenerating(true);
    try {
      const course = await generateCourse(topic, language, pace);
      // Initialize completion counts
      course.completedCount = 0;
      course.completedLessons = {};
      
      setCourses(prev => [course, ...prev]);
      setActiveCourse(course);
      setShowGenerator(false);
      
      // Auto-select first lesson of first module
      if (course.modules?.[0]?.lessons?.[0]) {
        setSelectedLesson(course.modules[0].lessons[0]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate course syllabus. Check that your API is running and Gemini key is configured.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateLessonVideo = async (lesson) => {
    if (!avatarConfig.imageUrl) {
      setError("Please select an avatar and configure your teacher first in the 'AI Teacher Avatar' tab.");
      return;
    }

    setError("");
    setGeneratingLessonVideo(true);
    try {
      const imageSource = avatarConfig.imageFile || avatarConfig.imageUrl;
      const response = await generateAvatarVideo(
        imageSource,
        lesson.script,
        avatarConfig.voiceId
      );
      if (response.success && response.video_url) {
        setLessonVideos(prev => ({
          ...prev,
          [lesson.title]: response.video_url
        }));
      } else {
        throw new Error("Invalid video generation result.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to animate teacher avatar for this lesson. Check D-ID and ElevenLabs credentials.");
    } finally {
      setGeneratingLessonVideo(false);
    }
  };

  const toggleLessonCompleted = (lessonTitle) => {
    if (!activeCourse) return;
    
    const isCompleted = activeCourse.completedLessons?.[lessonTitle];
    const updatedLessons = {
      ...activeCourse.completedLessons,
      [lessonTitle]: !isCompleted
    };
    
    // Recalculate completed count
    const completedCount = Object.values(updatedLessons).filter(Boolean).length;
    
    const updatedCourse = {
      ...activeCourse,
      completedLessons: updatedLessons,
      completedCount
    };

    setActiveCourse(updatedCourse);
    setCourses(prev => prev.map(c => c.title === activeCourse.title ? updatedCourse : c));
  };

  // If no course is active and we want to generate a new one
  if (!activeCourse) {
    if (showGenerator || courses.length === 0) {
      return (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Generate Custom AI Course</h1>
              <p className="text-gray-400 text-sm mt-1">
                Enter any topic you wish to study. Our Gemini engine will compose a structured syllabus, complete with lessons, reading content, and teacher scripts.
              </p>
            </div>
            {courses.length > 0 && (
              <button
                onClick={() => setShowGenerator(false)}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold bg-slate-900 border border-white/5 py-2 px-4 rounded-xl transition-all"
              >
                Back to My Courses
              </button>
            )}
          </div>

          <form onSubmit={handleGenerateCourse} className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">What do you want to learn?</label>
              <input
                type="text"
                required
                placeholder="e.g. Quantum Physics, Advanced React Patterns, Organic Chemistry"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3.5 px-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Instruction Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
                >
                  <option value="English">English</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Learning Pace</label>
                <select
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
                >
                  <option value="Slow">Slow (Explains details thoroughly)</option>
                  <option value="Medium">Medium (Balanced standard pacing)</option>
                  <option value="Fast">Fast (Summary focus, core points)</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                  <span>Adhyaya AI is synthesizing your syllabus and writing lessons...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  <span>Generate Custom Course with Adhyaya AI</span>
                </>
              )}
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">My Generated Courses</h1>
            <p className="text-gray-400 text-sm mt-1">
              Select an active custom learning channel to enter the AI classroom workspace, or generate a new one.
            </p>
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md shadow-brand-500/20 flex items-center gap-2"
          >
            + Generate Custom Course
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course, idx) => {
            const modulesCount = course.modules?.length || 0;
            let lessonsCount = 0;
            course.modules?.forEach(mod => {
              lessonsCount += mod.lessons?.length || 0;
            });
            return (
              <div key={idx} className="glass-panel glass-panel-hover rounded-2xl p-6 border border-white/5 flex flex-col justify-between h-52">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-white text-lg leading-tight truncate-2-lines">{course.title}</h3>
                    <span className="bg-brand-500/10 text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded border border-brand-500/20 uppercase shrink-0">
                      Pace: {course.pace || "Medium"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-3 line-clamp-2 leading-relaxed">{course.description}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                  <div className="text-[10px] text-gray-500 font-semibold">
                    {modulesCount} Modules • {lessonsCount} Lessons • {course.completedCount || 0} Done
                  </div>
                  <button
                    onClick={() => {
                      setActiveCourse(course);
                      if (course.modules?.[0]?.lessons?.[0]) {
                        setSelectedLesson(course.modules[0].lessons[0]);
                      }
                    }}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-brand-500/10 flex items-center gap-1.5"
                  >
                    Enter Classroom <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active course workspace view
  const cachedVideo = selectedLesson ? lessonVideos[selectedLesson.title] : null;

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Back button & title */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <button
          onClick={() => {
            setActiveCourse(null);
            setSelectedLesson(null);
          }}
          className="p-2 bg-slate-900/80 border border-white/5 hover:border-brand-500/20 rounded-xl hover:text-brand-400 transition-all"
          title="Back to Courses"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">{activeCourse.title}</h1>
          <span className="text-[10px] text-brand-400 font-semibold tracking-wide uppercase">Pace: {activeCourse.pace || pace}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        
        {/* Left Syllabus Column */}
        <div className="glass-panel rounded-xl p-4 overflow-y-auto custom-scrollbar flex flex-col justify-between lg:col-span-1">
          <div className="space-y-6">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider text-gray-400 border-b border-white/5 pb-2">
              Syllabus Outline
            </h3>
            
            <div className="space-y-5">
              {activeCourse.modules?.map((mod, modIdx) => (
                <div key={modIdx} className="space-y-2">
                  <h4 className="text-xs font-extrabold text-brand-300 tracking-tight leading-tight">
                    Module {modIdx + 1}: {mod.module_title}
                  </h4>
                  <div className="pl-2 border-l border-white/5 space-y-1">
                    {mod.lessons?.map((les, lesIdx) => {
                      const isSelected = selectedLesson?.title === les.title;
                      const isCompleted = activeCourse.completedLessons?.[les.title];
                      
                      return (
                        <button
                          key={lesIdx}
                          onClick={() => setSelectedLesson(les)}
                          className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg text-xs transition-all ${
                            isSelected 
                              ? "bg-brand-500/10 text-white font-semibold border border-brand-500/20" 
                              : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <span className="truncate flex-1 mr-2">{lesIdx + 1}. {les.title}</span>
                          {isCompleted ? (
                            <CheckCircle className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-4 text-[10px] text-gray-500">
            Completed: {activeCourse.completedCount || 0} / {activeCourse.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} Lessons
          </div>
        </div>

        {/* Right workspace workspace split: Video + Text */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          
          {/* Main Lesson Content (Text) - Col Span 2 */}
          <div className="md:col-span-2 glass-panel rounded-xl p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            {selectedLesson ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedLesson.title}</h2>
                  <div className="h-0.5 bg-gradient-to-r from-brand-500/40 to-transparent mt-2"></div>
                </div>

                {/* Lesson Reading Material */}
                <div className="text-gray-300 text-sm leading-relaxed space-y-4 font-normal">
                  {selectedLesson.content.split("\n\n").map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between items-center gap-4">
                  <button
                    onClick={() => toggleLessonCompleted(selectedLesson.title)}
                    className={`flex items-center gap-2 text-xs font-semibold py-2 px-4 rounded-xl border transition-all ${
                      activeCourse.completedLessons?.[selectedLesson.title]
                        ? "bg-brand-500/10 border-brand-500 text-brand-400"
                        : "bg-slate-900 border-white/5 hover:border-brand-500/30 text-white"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {activeCourse.completedLessons?.[selectedLesson.title] ? "Completed!" : "Mark Completed"}
                  </button>

                  <button
                    onClick={() => toggleLessonSpeech(selectedLesson.content)}
                    className="flex items-center gap-2 text-xs font-semibold py-2 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isSpeaking ? "Pause Audio" : "Read Aloud"}
                  </button>

                  <span className="text-[10px] text-gray-500 italic hidden sm:inline">Adhyaya Adaptive Learning</span>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <BookOpen className="w-12 h-12 text-gray-600 mb-2" />
                <p className="text-gray-400 text-sm">Please select a lesson from the syllabus outline to start reading.</p>
              </div>
            )}
          </div>

          {/* AI Virtual Teacher Panel - Col Span 1 */}
          <div className="glass-panel rounded-xl p-5 overflow-y-auto custom-scrollbar flex flex-col items-center justify-between">
            <div className="w-full space-y-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-gray-400 border-b border-white/5 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-brand-400" />
                  AI Classroom Figurine
                </span>
                {isSpeaking && (
                  <span className="text-[9px] text-brand-400 font-bold uppercase animate-pulse">
                    Speaking
                  </span>
                )}
              </h3>

              {selectedLesson && (
                <div className="space-y-4">
                  {/* Video Screen Container */}
                  <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-slate-950 border border-white/10 w-full shadow-inner flex flex-col items-center justify-center text-center">
                    {cachedVideo ? (
                      <video src={cachedVideo} controls autoPlay className="w-full h-full object-cover" />
                    ) : avatarConfig.imageUrl ? (
                      <div className="w-full h-full relative group flex flex-col items-center justify-center">
                        <img 
                          src={avatarConfig.imageUrl} 
                          alt="Teacher Face" 
                          className={`w-full h-full object-cover transition-all ${isSpeaking ? "scale-105" : ""}`} 
                        />
                        <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center p-4">
                          <button
                            onClick={() => toggleLessonSpeech(selectedLesson.script)}
                            className="bg-brand-500 hover:bg-brand-600 p-3.5 rounded-full text-white shadow-xl shadow-brand-500/30 transition-transform hover:scale-110"
                            title={isSpeaking ? "Pause Figurine" : "Speak Lesson Script"}
                          >
                            {isSpeaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                          </button>
                          <p className="text-[11px] text-white font-bold mt-3">
                            {isSpeaking ? "Teacher is Lecturing..." : "Play Live Teacher Lecture"}
                          </p>
                          <p className="text-[9px] text-gray-300 mt-1 max-w-[150px]">
                            Voice synthesis + synchronized lecture narration
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Unconfigured state
                      <div className="p-4 space-y-2">
                        <AlertCircle className="w-8 h-8 text-gray-500 mx-auto" />
                        <p className="text-gray-400 text-[10px]">No teacher avatar has been configured.</p>
                        <p className="text-[9px] text-gray-500">Drop an image in the 'AI Teacher Figurine' tab to activate your classroom avatar.</p>
                      </div>
                    )}

                    {generatingLessonVideo && (
                      <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-10">
                        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
                        <p className="text-white text-xs font-semibold">Creating Lesson Lecture Video...</p>
                        <p className="text-[8px] text-gray-400 mt-1 max-w-[150px]">Rendering D-ID cloud talk...</p>
                      </div>
                    )}
                  </div>

                  {/* Speech Script Readout */}
                  <div className="bg-slate-950/60 border border-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">Teacher's Script</p>
                      <button
                        onClick={() => toggleLessonSpeech(selectedLesson.script)}
                        className="text-[10px] text-amber-300 hover:text-white flex items-center gap-1"
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        {isSpeaking ? "Stop" : "Listen"}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar italic">
                      "{selectedLesson.script}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!generatingLessonVideo && selectedLesson && !cachedVideo && avatarConfig.imageUrl && (
              <button
                onClick={() => handleGenerateLessonVideo(selectedLesson)}
                className="w-full mt-4 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 text-xs font-bold py-2 border border-brand-500/20 rounded-lg transition-all"
              >
                Render HD D-ID Video
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
