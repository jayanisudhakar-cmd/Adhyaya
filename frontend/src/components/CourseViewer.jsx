import React, { useState, useRef, useEffect } from "react";
import { generateCourse, generateAvatarVideo, speakAvatarText, generateFreeTtsAudio } from "../services/api";
import { useNeuro } from "../context/NeuroContext";
import { useLanguage } from "../context/LanguageContext";
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
  Mic,
  GraduationCap
} from "lucide-react";

/**
 * Strips markdown syntax into smooth, natural spoken lecture narration.
 * Ensures the AI teacher reads real course lesson content fluently without reading symbols.
 */
export const cleanMarkdownForSpeech = (markdown) => {
  if (!markdown) return "";
  return markdown
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_{1,2}(.*?)_{1,2}/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s+/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .replace(/\.+/g, ".")
    .trim();
};

export default function CourseViewer({
  courses,
  setCourses,
  activeCourse,
  setActiveCourse,
  avatarConfig,
  setAvatarConfig,
  globalAvatarVideo,
  setGlobalAvatarVideo
}) {
  const { neuroMode } = useNeuro();
  const { courseLanguage, setCourseLanguage, currentCourseLang, COURSE_LANGUAGES, t } = useLanguage();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState(currentCourseLang?.speechLang || "English");
  const [pace, setPace] = useState("Medium");

  // Narration Mode: 'content' (Default: reads full course lesson content) or 'script' (short intro)
  const [narrationMode, setNarrationMode] = useState("content");

  // Keep local language in sync with global courseLanguage
  React.useEffect(() => {
    if (currentCourseLang?.speechLang) {
      setLanguage(currentCourseLang.speechLang);
    }
  }, [currentCourseLang]);

  // Voice Gender: Male / Female selector (default to male or avatarConfig)
  const [voiceGender, setVoiceGender] = useState(() => avatarConfig?.voiceGender || "male");
  const [speakingStatus, setSpeakingStatus] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    if (avatarConfig?.voiceGender && avatarConfig.voiceGender !== voiceGender) {
      setVoiceGender(avatarConfig.voiceGender);
    }
  }, [avatarConfig?.voiceGender]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const [generating, setGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Selected lesson state
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [generatingLessonVideo, setGeneratingLessonVideo] = useState(false);
  const [lessonVideos, setLessonVideos] = useState({}); // caches generated videos: { lessonTitle: videoUrl }
  const [error, setError] = useState("");
  const [showGenerator, setShowGenerator] = useState(courses.length === 0);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingStatus("");
  };

  const toggleLessonSpeech = async (textToSpeak) => {
    if (!textToSpeak) return;

    if (isSpeaking) {
      stopAudio();
      return;
    }

    stopAudio();
    setIsSpeaking(true);
    const langToUse = currentCourseLang?.speechLang || language || "English";
    setSpeakingStatus(`Synthesizing ${voiceGender === "male" ? "👨‍🏫 Male" : "👩‍🏫 Female"} neural voice in ${langToUse}...`);

    try {
      // 1. Primary: Edge-TTS Neural Voice (/api/avatar/speak)
      const res = await speakAvatarText(textToSpeak, voiceGender, langToUse, pace);
      if (res && res.audio_url) {
        const audio = new Audio(res.audio_url);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          const voiceLabel = res.voice_used || (voiceGender === "male" ? "Male Neural" : "Female Neural");
          setSpeakingStatus(`🔊 Speaking (${voiceLabel})`);
        };
        audio.onended = () => {
          setIsSpeaking(false);
          setSpeakingStatus("");
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setSpeakingStatus("");
        };

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn("Edge-TTS speech fallback:", err);
    }

    // 2. Secondary fallback: Free TTS (/api/avatar/free-tts)
    try {
      const langCode = currentCourseLang?.id || "kn";
      const freeRes = await generateFreeTtsAudio(textToSpeak, langCode, "edge_tts", voiceGender, pace);
      if (freeRes && freeRes.audio_url) {
        const audio = new Audio(freeRes.audio_url);
        audioRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          setSpeakingStatus("");
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setSpeakingStatus("");
        };
        await audio.play();
        return;
      }
    } catch (fallbackErr) {
      console.warn("Free TTS fallback notice:", fallbackErr);
    }

    // 3. Tertiary fallback: Browser SpeechSynthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = pace === "Slow" ? 0.8 : (pace === "Fast" ? 1.2 : 1.0);

      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => (
        voiceGender === "male"
          ? (v.name.includes("David") || v.name.includes("Male") || v.name.includes("Prabhat"))
          : (v.name.includes("Zira") || v.name.includes("Female") || v.name.includes("Neerja"))
      ));
      if (match) utterance.voice = match;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingStatus("");
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingStatus("");
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
      setSpeakingStatus("");
    }
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
      setError(err.message || "Failed to generate course syllabus. Check that your backend is running.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateLessonVideo = async (lesson) => {
    const teacherImage = avatarConfig?.imageUrl || "/avatars/figurine_male.jpg";

    setError("");
    setGeneratingLessonVideo(true);
    try {
      const imageSource = avatarConfig?.imageFile || teacherImage;
      const langCode = currentCourseLang?.id || "kn";

      // Always read the full course content when in content mode (default)
      const textToSynthesize = narrationMode === "content"
        ? cleanMarkdownForSpeech(lesson.content)
        : (lesson.script || cleanMarkdownForSpeech(lesson.content));

      const response = await generateAvatarVideo({
        imageSource,
        script: textToSynthesize,
        language: langCode,
        engine: "edge_tts",
        voiceGender,
        pace
      });

      if (response && response.video_url) {
        setLessonVideos(prev => ({
          ...prev,
          [lesson.title]: response.video_url
        }));
        if (setGlobalAvatarVideo) {
          setGlobalAvatarVideo(response.video_url);
        }
      } else {
        throw new Error(response?.message || "Invalid video generation result.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to animate teacher avatar for this lesson: " + (err.message || "Please check connection."));
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
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {t("courseLangLabel", "Instruction / Course Language")}
                  </label>
                  <span className="text-[10px] font-bold text-purple-300">
                    Mode: Course Content
                  </span>
                </div>
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    const matched = COURSE_LANGUAGES.find(l => l.speechLang === e.target.value);
                    if (matched) setCourseLanguage(matched.id);
                  }}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-all font-medium"
                >
                  {COURSE_LANGUAGES.map((cl) => (
                    <option key={cl.id} value={cl.speechLang} className="bg-slate-900 text-white">
                      {cl.flag} {cl.label}
                    </option>
                  ))}
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

  // Active course workspace view - checks if talking video has been generated specifically for THIS lesson
  const activeVideo = (selectedLesson && lessonVideos[selectedLesson.title]);
  const teacherImage = avatarConfig?.imageUrl || "/avatars/figurine_male.jpg";

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Back button & title */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <button
          onClick={() => {
            setActiveCourse(null);
            setSelectedLesson(null);
            stopAudio();
          }}
          className="p-2 bg-slate-900/80 border border-white/5 hover:border-brand-500/20 rounded-xl hover:text-brand-400 transition-all"
          title="Back to Courses"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">{activeCourse.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-brand-400 font-semibold tracking-wide uppercase">Pace: {activeCourse.pace || pace}</span>
            <span className="text-[10px] text-purple-300 font-medium bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded-full">
              🎓 {currentCourseLang?.label || "Course Content"}
            </span>
          </div>
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
                          onClick={() => {
                            stopAudio();
                            setSelectedLesson(les);
                          }}
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

        {/* Right workspace split: Video + Text */}
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

                <div className="pt-6 border-t border-white/5 flex flex-wrap justify-between items-center gap-3">
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
                    onClick={() => toggleLessonSpeech(cleanMarkdownForSpeech(selectedLesson.content))}
                    className="flex items-center gap-2 text-xs font-semibold py-2 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all shadow-sm"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isSpeaking ? "Pause Audio" : `Read Aloud (${voiceGender === "male" ? "👨‍🏫 Male" : "👩‍🏫 Female"})`}
                  </button>

                  <span className="text-[10px] text-gray-500 italic hidden sm:inline">Adhyaya Neural Classroom</span>
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
              
              {/* Header with Speaking indicator */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Video className="w-4 h-4 text-brand-400" />
                  AI Classroom Teacher
                </span>
                {isSpeaking && (
                  <span className="text-[9px] text-brand-400 font-bold uppercase animate-pulse flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Speaking
                  </span>
                )}
              </div>

              {/* Male / Female Voice Selector */}
              <div className="flex items-center justify-between bg-slate-900/90 border border-white/10 rounded-xl p-1 text-xs">
                <span className="text-[10px] font-semibold text-gray-400 pl-2">Voice:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceGender("male");
                      if (setAvatarConfig) setAvatarConfig(prev => ({ ...prev, voiceGender: "male" }));
                      stopAudio();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      voiceGender === "male"
                        ? "bg-brand-500 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>👨‍🏫 Male</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceGender("female");
                      if (setAvatarConfig) setAvatarConfig(prev => ({ ...prev, voiceGender: "female" }));
                      stopAudio();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      voiceGender === "female"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>👩‍🏫 Female</span>
                  </button>
                </div>
              </div>

              {selectedLesson && (
                <div className="space-y-4">
                  {/* Video / Photo Container */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-slate-950 border border-white/15 w-full shadow-2xl flex flex-col items-center justify-center text-center">
                    {activeVideo ? (
                      <div className="relative w-full h-full">
                        <video
                          src={activeVideo}
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm border border-brand-500/30 text-[9px] text-brand-300 px-2 py-0.5 rounded-full font-bold">
                          🎬 Synced Talking Video
                        </div>
                      </div>
                    ) : teacherImage ? (
                      <div className="w-full h-full relative group flex flex-col items-center justify-center bg-slate-900">
                        <img 
                          src={teacherImage} 
                          alt={avatarConfig?.name || "AI Teacher"} 
                          className={`w-full h-full object-cover transition-all duration-300 ${isSpeaking ? "scale-105" : ""}`} 
                        />
                        {/* Elegant bottom control bar */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3 pt-6 flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-white truncate max-w-[130px]">
                              {avatarConfig?.name || "AI Teacher"}
                            </p>
                            <p className="text-[9px] text-purple-300 truncate max-w-[130px]">
                              {isSpeaking ? (speakingStatus || "Speaking lecture...") : `${voiceGender === "male" ? "Male" : "Female"} • ${currentCourseLang?.speechLang || "Neural"}`}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const textToSpeak = narrationMode === "content"
                                ? cleanMarkdownForSpeech(selectedLesson.content)
                                : (selectedLesson.script || cleanMarkdownForSpeech(selectedLesson.content));
                              toggleLessonSpeech(textToSpeak);
                            }}
                            className="bg-brand-500 hover:bg-brand-600 p-2.5 rounded-full text-white shadow-lg shadow-brand-500/30 transition-transform hover:scale-110 shrink-0"
                            title={isSpeaking ? "Pause Audio" : "Play Teacher Lecture"}
                          >
                            {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Unconfigured state
                      <div className="p-4 space-y-2">
                        <AlertCircle className="w-8 h-8 text-gray-500 mx-auto" />
                        <p className="text-gray-400 text-[10px]">No teacher avatar has been configured.</p>
                        <p className="text-[9px] text-gray-500">Drop an image in the 'AI Teacher Studio' tab to activate your classroom avatar.</p>
                      </div>
                    )}

                    {/* Rendering Progress Overlay */}
                    {generatingLessonVideo && (
                      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
                        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
                        <p className="text-white text-xs font-semibold">Creating Lesson Lecture Video...</p>
                        <p className="text-[9px] text-purple-300 mt-1">
                          Narrating {narrationMode === "content" ? "Course Content" : "Intro Script"} in {currentCourseLang?.speechLang || "Indian Neural"} ({voiceGender === "male" ? "Male" : "Female"})...
                        </p>
                        <span className="text-[8px] text-gray-400 mt-2 font-mono">100% Free & Open-Source</span>
                      </div>
                    )}
                  </div>

                  {/* Narration Mode Selector & Readout */}
                  <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setNarrationMode("content");
                            if (isSpeaking) stopAudio();
                          }}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all ${
                            narrationMode === "content"
                              ? "bg-brand-500 text-white shadow-sm"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          📖 Lesson Content
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNarrationMode("script");
                            if (isSpeaking) stopAudio();
                          }}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all ${
                            narrationMode === "script"
                              ? "bg-purple-600 text-white shadow-sm"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          🎙️ Intro Script
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          const textToSpeak = narrationMode === "content"
                            ? cleanMarkdownForSpeech(selectedLesson.content)
                            : (selectedLesson.script || cleanMarkdownForSpeech(selectedLesson.content));
                          toggleLessonSpeech(textToSpeak);
                        }}
                        className="text-[10px] text-amber-300 hover:text-white flex items-center gap-1 font-medium bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20"
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        {isSpeaking ? "Stop" : `Listen (${voiceGender === "male" ? "Male" : "Female"})`}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar italic font-normal">
                      {narrationMode === "content"
                        ? cleanMarkdownForSpeech(selectedLesson.content)
                        : `"${selectedLesson.script}"`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Animate Teacher Button */}
            {!generatingLessonVideo && selectedLesson && (
              <button
                onClick={() => handleGenerateLessonVideo(selectedLesson)}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 via-pink-600 to-brand-500 hover:from-purple-700 hover:to-brand-600 text-white text-xs font-extrabold py-2.5 px-3 rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 transform hover:scale-[1.01]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>🎬 Animate Teacher for This Lesson (Synced MP4)</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
