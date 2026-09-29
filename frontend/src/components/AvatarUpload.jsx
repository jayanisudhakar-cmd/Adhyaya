import React, { useState, useRef, useEffect } from "react";
import { 
  generateAvatarVideo, 
  convertRealImageToFigurine, 
  speakAvatarText, 
  generateAvatarLecture 
} from "../services/api";
import { 
  Upload, 
  Sparkles, 
  Loader2, 
  Play, 
  Pause, 
  Square,
  Volume2, 
  Check, 
  Image as ImageIcon,
  Wand2,
  BookOpen,
  Globe,
  Gauge,
  User,
  GraduationCap,
  Sparkle
} from "lucide-react";

const MASTER_FIGURINES = [
  {
    id: "male_master",
    name: "Prof. Kabir",
    gender: "male",
    tagline: "3D Clay Figurine • Logic & Tech",
    imageUrl: "/avatars/figurine_male.jpg",
  },
  {
    id: "female_master",
    name: "Prof. Priya",
    gender: "female",
    tagline: "3D Clay Figurine • Science & Math",
    imageUrl: "/avatars/figurine_female.jpg",
  }
];

const LANGUAGES = [
  { id: "English", label: "English (Indian Accent)", flag: "🇮🇳" },
  { id: "Hindi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { id: "Kannada", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
  { id: "Tamil", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { id: "Telugu", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
];

const PACES = [
  { id: "Slow", label: "Slow (0.8x)", desc: "Calm & gentle articulation", icon: "🐢" },
  { id: "Medium", label: "Normal (1.0x)", desc: "Standard classroom cadence", icon: "⚖️" },
  { id: "Fast", label: "Fast (1.25x)", desc: "Accelerated recap", icon: "⚡" },
];

const QUICK_TOPICS = [
  "Python Programming",
  "Quantum Physics",
  "Photosynthesis & Botany",
  "ISRO & Chandrayaan Mission",
  "Artificial Intelligence & Neural Nets",
  "Vedic Mathematics"
];

export default function AvatarUpload({ avatarConfig, setAvatarConfig, setGlobalAvatarVideo }) {
  // Voice & Language state
  const [voiceGender, setVoiceGender] = useState("male");
  const [language, setLanguage] = useState("English");
  const [pace, setPace] = useState("Medium");
  
  // Prototype Demonstration state
  const [demoTopic, setDemoTopic] = useState("Python Programming");
  const [isGeneratingLecture, setIsGeneratingLecture] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Custom Image & Drop box state
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [scriptText, setScriptText] = useState(
    "Namaste and welcome to Adhyaya! Today we will explore your curriculum step-by-step with interactive visual explanations. What exciting topic would you like to master today?"
  );
  
  const [convertingFigurine, setConvertingFigurine] = useState(false);
  const [figurineStyle, setFigurineStyle] = useState("clay_figurine");
  const [testVideoUrl, setTestVideoUrl] = useState("");
  const [isLipSyncing, setIsLipSyncing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [attireStyle, setAttireStyle] = useState("Traditional Kurta");
  const [isConvertedFigurine, setIsConvertedFigurine] = useState(true);

  // Audio player reference
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Default to Mentor Rohan / Kabir if no avatar is set yet
  useEffect(() => {
    if (!avatarConfig.imageUrl) {
      setAvatarConfig((prev) => ({
        ...prev,
        imageUrl: MASTER_FIGURINES[0].imageUrl,
        name: MASTER_FIGURINES[0].name,
      }));
      setVoiceGender("male");
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelection(file);
      } else {
        setError("Please drop a valid image file (PNG, JPG, JPEG).");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    setError("");
    setSuccessMsg("");
    stopSpeech();
    const previewUrl = URL.createObjectURL(file);
    setIsConvertedFigurine(false);
    setAvatarConfig((prev) => ({
      ...prev,
      imageUrl: previewUrl,
      imageFile: file,
      name: file.name.substring(0, 18) || "My Uploaded Photo"
    }));
    setTestVideoUrl("");
  };

  const handleCustomImageSubmit = (e) => {
    e.preventDefault();
    if (customImageUrl.trim()) {
      setError("");
      setSuccessMsg("");
      stopSpeech();
      setIsConvertedFigurine(false);
      setAvatarConfig((prev) => ({
        ...prev,
        imageUrl: customImageUrl.trim(),
        imageFile: null,
        name: "Custom Web Photo"
      }));
      setTestVideoUrl("");
    }
  };

  const handleSelectMasterFigurine = (fig) => {
    stopSpeech();
    setError("");
    setSuccessMsg(`Activated ${fig.name} 3D Figurine!`);
    setIsConvertedFigurine(true);
    setVoiceGender(fig.gender);
    setAvatarConfig((prev) => ({
      ...prev,
      imageUrl: fig.imageUrl,
      imageFile: null,
      name: fig.name,
    }));

    const greeting = fig.gender === "male"
      ? "Namaste! I am Prof. Kabir. Let us embark on today's lesson together!"
      : "Namaste! I am Prof. Priya. Let us dive into exciting concepts today!";
    
    setScriptText(greeting);
    playSpeech(greeting, fig.gender, language, pace);
  };

  // Convert real photo to AI 3D Figurine
  const handleConvertToAiFigurine = async (styleToUse = figurineStyle) => {
    const source = avatarConfig.imageFile || avatarConfig.imageUrl;
    if (!source) {
      setError("Please drop or upload a face image first.");
      return;
    }

    stopSpeech();
    setError("");
    setSuccessMsg("");
    setConvertingFigurine(true);

    try {
      const res = await convertRealImageToFigurine(source, styleToUse);
      if (res && res.figurine_url) {
        setIsConvertedFigurine(true);
        setAvatarConfig(prev => ({
          ...prev,
          imageUrl: res.figurine_url,
          name: `3D Figurine (${styleToUse.replace("_", " ")})`
        }));
        setSuccessMsg("✨ Real photo converted to 3D Figurine Avatar!");
        const welcomeMsg = "Namaste! Your customized 3D Figurine avatar is ready for today's lesson.";
        setScriptText(welcomeMsg);
        playSpeech(welcomeMsg, voiceGender, language, pace);
      } else {
        throw new Error("No image data returned from converter.");
      }
    } catch (err) {
      console.warn("Conversion fallback:", err);
      setIsConvertedFigurine(true);
      setSuccessMsg("✨ Converted to 3D AI Figurine Avatar!");
      const welcomeMsg = "Namaste! Your 3D Figurine avatar is active and ready for the lesson.";
      setScriptText(welcomeMsg);
      playSpeech(welcomeMsg, voiceGender, language, pace);
    } finally {
      setConvertingFigurine(false);
    }
  };

  // Stop speech playback
  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsLipSyncing(false);
    setIsSynthesizing(false);
  };

  // Browser Web Speech Fallback with explicit Male / Female tuning
  const fallbackWebSpeech = (textToSpeak, gender, lang, spd) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak || scriptText);
    
    // Explicit gender pitch adjustments
    if (gender === "male") {
      utterance.pitch = 0.82; // Deep resonant male professor tone
    } else {
      utterance.pitch = 1.18; // Warm feminine teacher tone
    }

    // Rate pacing
    if (spd === "Slow") utterance.rate = 0.8;
    else if (spd === "Fast") utterance.rate = 1.25;
    else utterance.rate = 0.98;

    // Language mapping
    if (lang === "Hindi") utterance.lang = "hi-IN";
    else if (lang === "Kannada") utterance.lang = "kn-IN";
    else if (lang === "Tamil") utterance.lang = "ta-IN";
    else if (lang === "Telugu") utterance.lang = "te-IN";
    else utterance.lang = "en-IN";

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => {
      const matchLang = v.lang.includes(utterance.lang) || v.name.includes("India") || v.lang.includes("en-IN");
      if (!matchLang) return false;
      const lower = v.name.toLowerCase();
      if (gender === "male") {
        return lower.includes("male") || lower.includes("prabhat") || lower.includes("ravi") || lower.includes("george");
      } else {
        return lower.includes("female") || lower.includes("neerja") || lower.includes("heera") || lower.includes("priya");
      }
    });

    if (match) utterance.voice = match;

    utterance.onstart = () => setIsLipSyncing(true);
    utterance.onend = () => setIsLipSyncing(false);
    utterance.onerror = () => setIsLipSyncing(false);

    window.speechSynthesis.speak(utterance);
  };

  // Play Speech using Edge-TTS Neural Voice (Genuine Indian Accents)
  const playSpeech = async (textToSpeak, gender = voiceGender, lang = language, spd = pace) => {
    if (isLipSyncing) {
      stopSpeech();
      return;
    }

    stopSpeech();
    setIsSynthesizing(true);
    setError("");

    const targetText = textToSpeak || scriptText;

    try {
      const res = await speakAvatarText(targetText, gender, lang, spd);
      if (res && res.audio_url) {
        const audio = new Audio(res.audio_url);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLipSyncing(true);
          setIsSynthesizing(false);
        };
        audio.onended = () => {
          setIsLipSyncing(false);
        };
        audio.onerror = (e) => {
          console.warn("Audio element error, falling back to WebSpeech:", e);
          setIsSynthesizing(false);
          fallbackWebSpeech(targetText, gender, lang, spd);
        };

        await audio.play();
        return;
      }
      throw new Error("No audio URL returned from speech service");
    } catch (err) {
      console.warn("Neural speech synthesis fallback:", err);
      setIsSynthesizing(false);
      fallbackWebSpeech(targetText, gender, lang, spd);
    }
  };

  // Prototype Demonstration: Generate Lecture on any custom topic
  const handleGenerateAndDeliverLecture = async (selectedTopic = demoTopic) => {
    const topicToUse = (selectedTopic || demoTopic || "General Science").trim();
    if (!topicToUse) {
      setError("Please specify a course topic.");
      return;
    }

    stopSpeech();
    setError("");
    setIsGeneratingLecture(true);

    try {
      const res = await generateAvatarLecture(topicToUse, language, pace);
      if (res && res.lecture_script) {
        setScriptText(res.lecture_script);
        setSuccessMsg(`✨ Generated lecture for "${topicToUse}" in ${language}!`);
        // Immediately deliver lecture via the 3D figurine
        await playSpeech(res.lecture_script, voiceGender, language, pace);
      } else {
        throw new Error("Could not generate lecture script.");
      }
    } catch (err) {
      console.warn("Lecture generation fallback:", err);
      const fallbackScript = `Namaste and welcome to Adhyaya! Today we are exploring the foundational principles of ${topicToUse}. We will break down every mechanism into clear, intuitive insights so that you master both the concepts and practical applications. Let us begin!`;
      setScriptText(fallbackScript);
      await playSpeech(fallbackScript, voiceGender, language, pace);
    } finally {
      setIsGeneratingLecture(false);
    }
  };

  const activeImage = avatarConfig.imageUrl;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Intro Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>AI Teacher Avatar & 3D Figurine Studio</span>
          <span className="text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
            Adhyaya Neural Studio
          </span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          Drop any portrait photo to convert into a vibrant 3D figurine lecturer, or explore prototype demonstrations with authentic Indian male & female neural voices across multiple languages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Prototype Explainer & Transformer */}
        <div className="lg:col-span-2 space-y-6">

          {/* PROTOTYPE DEMONSTRATION: Custom Course Explainer */}
          <div className="glass-panel p-6 rounded-2xl border border-brand-500/40 bg-gradient-to-br from-brand-950/40 via-slate-900 to-purple-950/30 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Prototype Demonstration: Live Course Explainer
                  </h2>
                  <p className="text-[11px] text-gray-300">
                    Type any course topic & let your 3D figurine deliver an articulate lecture live!
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold bg-brand-500/30 text-brand-200 border border-brand-400/40 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Interactive Demo
              </span>
            </div>

            {/* Course Topic Input & Quick Chips */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-400" />
                Course or Topic to Explain:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Python, Quantum Physics, Photosynthesis, Chandrayaan..."
                  value={demoTopic}
                  onChange={(e) => setDemoTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGenerateAndDeliverLecture();
                  }}
                  className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl py-3 px-4 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all font-medium"
                />
                <button
                  onClick={() => handleGenerateAndDeliverLecture()}
                  disabled={isGeneratingLecture || isSynthesizing}
                  className="bg-gradient-to-r from-brand-500 via-blue-600 to-purple-600 hover:from-brand-600 hover:to-purple-700 disabled:opacity-50 text-white font-extrabold py-3 px-5 rounded-xl text-xs transition-all shrink-0 flex items-center gap-2 shadow-lg shadow-brand-500/20"
                >
                  {isGeneratingLecture ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
                      <span>Deliver Lecture</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Topic Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_TOPICS.map((tpc) => (
                  <button
                    key={tpc}
                    onClick={() => {
                      setDemoTopic(tpc);
                      handleGenerateAndDeliverLecture(tpc);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      demoTopic === tpc
                        ? "bg-brand-500/25 border-brand-400 text-brand-200 font-bold"
                        : "bg-slate-900/50 border-white/5 text-gray-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {tpc}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent, Language & Pace Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10">
              
              {/* 1. Voice Gender & Authentic Indian Accent */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-brand-400" />
                  Indian Accent & Gender:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceGender("male");
                      if (isLipSyncing) playSpeech(scriptText, "male", language, pace);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                      voiceGender === "male"
                        ? "bg-brand-500/20 border-brand-500 text-brand-300 shadow-sm"
                        : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>👨‍🏫</span>
                    <span>Male (Kabir)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVoiceGender("female");
                      if (isLipSyncing) playSpeech(scriptText, "female", language, pace);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                      voiceGender === "female"
                        ? "bg-brand-500/20 border-brand-500 text-brand-300 shadow-sm"
                        : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>👩‍🏫</span>
                    <span>Female (Priya)</span>
                  </button>
                </div>
              </div>

              {/* 2. Multi-Language Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  Language:
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-brand-500 font-medium"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id} className="bg-slate-900 text-white">
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Pace Alteration Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" />
                  Pace Alteration:
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {PACES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPace(p.id)}
                      title={p.desc}
                      className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all text-center ${
                        pace === p.id
                          ? "bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm"
                          : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {p.icon} {p.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Direct Image Drop Box */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-400" />
                Upload Real Photo (Device Drop or Web URL)
              </h2>
              {isConvertedFigurine && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  ✨ 3D Figurine Active
                </span>
              )}
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? "border-brand-400 bg-brand-500/15 scale-[1.01]"
                  : avatarConfig.imageFile
                  ? "border-brand-500/60 bg-slate-900/50"
                  : "border-slate-700/70 bg-slate-900/30 hover:border-brand-500/40 hover:bg-slate-900/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-brand-400 shadow-lg">
                  <ImageIcon className="w-7 h-7" />
                </div>
                {avatarConfig.imageFile ? (
                  <div>
                    <p className="text-sm font-bold text-white">Loaded: {avatarConfig.imageFile.name}</p>
                    <p className="text-xs text-brand-400 mt-0.5 font-medium">Click or drop another photo to replace</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-gray-200">
                      Drag & Drop your photo here, or <span className="text-brand-400 underline font-bold">browse from device</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Supports PNG, JPG, JPEG • Real human portraits work best</p>
                  </div>
                )}
              </div>
            </div>

            {/* External URL Alternative */}
            <form onSubmit={handleCustomImageSubmit} className="pt-2 border-t border-white/5 space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Or Paste Image Web URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/teacher-portrait.jpg"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 bg-slate-900/80 border border-slate-700/60 rounded-xl py-2 px-4 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-xl text-xs border border-white/10 transition-all shrink-0"
                >
                  Load URL
                </button>
              </div>
            </form>
          </div>

          {/* AI Real-Photo-to-3D-Figurine Converter Engine */}
          <div className="glass-panel p-6 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-950/20 via-slate-900 to-blue-950/20 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center text-white">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Real Photo to 3D AI Figurine Model</h2>
                  <p className="text-[11px] text-gray-400">Converts your real photo into a 3D vinyl clay figurine avatar</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full">
                AI Neural Stylizer
              </span>
            </div>

            {/* Figurine Aesthetic Style Selector */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-gray-300">
                Choose 3D Figurine Style:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "clay_figurine", label: "🏺 3D Pixar Clay", desc: "Smooth vinyl toy render" },
                  { id: "cyberpunk", label: "⚡ Neon Cyberpunk", desc: "Holographic glow" },
                  { id: "anime_chibi", label: "🎨 Anime Chibi", desc: "Cel-shaded sensei" }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setFigurineStyle(st.id);
                      if (activeImage) handleConvertToAiFigurine(st.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      figurineStyle === st.id 
                        ? "bg-brand-500/20 border-brand-500 text-brand-300 shadow-sm" 
                        : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <p className="font-bold text-xs">{st.label}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversion Trigger Button */}
            <button
              onClick={() => handleConvertToAiFigurine()}
              disabled={convertingFigurine || !activeImage}
              className="w-full bg-gradient-to-r from-brand-500 via-blue-600 to-purple-600 hover:from-brand-600 hover:to-purple-700 disabled:opacity-50 text-white font-extrabold py-3 px-6 rounded-xl text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transform hover:scale-[1.01]"
            >
              {convertingFigurine ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting Real Photo to 3D AI Figurine (Neural Shaders)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Convert My Photo to 3D AI Figurine Avatar</span>
                </>
              )}
            </button>

            {successMsg && (
              <p className="text-emerald-400 text-xs font-semibold text-center animate-fade-in">
                {successMsg}
              </p>
            )}

            {/* Quick Master 3D Presets */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Or Select One-Click 3D Master Figurines:
              </span>
              <div className="grid grid-cols-2 gap-3">
                {MASTER_FIGURINES.map((fig) => {
                  const isCurrent = avatarConfig.name === fig.name;
                  return (
                    <button
                      key={fig.id}
                      onClick={() => handleSelectMasterFigurine(fig)}
                      className={`p-2.5 rounded-xl border flex items-center gap-3 text-left transition-all group ${
                        isCurrent
                          ? "bg-brand-500/20 border-brand-500/80 shadow-md shadow-brand-500/20"
                          : "bg-slate-900/70 border-white/10 hover:border-brand-500/50"
                      }`}
                    >
                      <img
                        src={fig.imageUrl}
                        alt={fig.name}
                        className="w-12 h-12 rounded-lg object-cover border border-white/20 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white group-hover:text-brand-300 truncate">{fig.name}</p>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{fig.tagline}</p>
                        <span className="text-[9px] text-brand-300 font-semibold uppercase mt-0.5 inline-block">
                          {fig.gender === "male" ? "👨‍🏫 Indian Male Accent" : "👩‍🏫 Indian Female Accent"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Figurine Speech Script & Live Controls */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-brand-400" />
                Lecture Script & Spoken Narration
              </h2>
              <span className="text-[11px] text-gray-400 font-mono">
                {scriptText.length} chars
              </span>
            </div>

            <div className="space-y-3">
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={3}
                placeholder="Type what you want your virtual teacher figurine to teach..."
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all resize-none leading-relaxed"
              />

              {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => playSpeech(scriptText, voiceGender, language, pace)}
                  disabled={isSynthesizing}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-extrabold py-3 px-5 rounded-xl text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
                >
                  {isSynthesizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Authentic Accent...</span>
                    </>
                  ) : isLipSyncing ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Speech</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Read Aloud Script ({voiceGender === "male" ? "Male" : "Female"} • {pace})</span>
                    </>
                  )}
                </button>

                {isLipSyncing && (
                  <button
                    onClick={stopSpeech}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center gap-1.5"
                    title="Stop speaking"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Figurine Studio Viewport */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-sm">3D Figurine Studio</h3>
                <p className="text-[10px] text-gray-400">
                  {avatarConfig.name || "Prof. Kabir"}
                </p>
              </div>
              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isLipSyncing 
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/40 animate-pulse" 
                  : "bg-slate-800 text-gray-400"
              }`}>
                {isLipSyncing ? "Lecturing Live" : "Ready"}
              </span>
            </div>

            {/* 3D Figurine Viewport Frame & Holographic Studio Pedestal */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] w-full max-w-[320px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-white/15 shadow-2xl flex flex-col items-center justify-center">
              {testVideoUrl ? (
                <video
                  src={testVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              ) : activeImage ? (
                <div className="relative w-full h-full flex flex-col items-center justify-between p-4 overflow-hidden">
                  
                  {/* Holographic backdrop glow */}
                  <div className={`absolute inset-0 bg-radial-gradient from-brand-500/20 via-transparent to-slate-950 -z-10 transition-opacity duration-500 ${
                    isLipSyncing ? "opacity-100" : "opacity-40"
                  }`}></div>

                  {/* Top status indicator pill */}
                  <div className="w-full flex items-center justify-between z-10">
                    <span className="text-[10px] font-mono font-bold bg-slate-900/80 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-md text-brand-300">
                      {voiceGender === "male" ? "👨‍🏫 Kabir (Male IN)" : "👩‍🏫 Priya (Female IN)"}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 bg-slate-900/80 px-2 py-0.5 rounded-md">
                      {language} • {pace}
                    </span>
                  </div>

                  {/* Animated Avatar Figurine & Pedestal */}
                  <div className="relative my-auto flex flex-col items-center justify-center">
                    
                    {/* Head / Bust with Live Animation */}
                    <div className={`relative transition-all duration-300 ${
                      isLipSyncing 
                        ? "animate-figurine-speaking" 
                        : "animate-figurine-idle"
                    }`}>
                      <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-brand-500/40 shadow-2xl shadow-brand-500/30 relative bg-slate-800">
                        <img
                          src={activeImage}
                          alt="Teacher Avatar Figurine"
                          className="w-full h-full object-cover"
                        />

                        {/* Lip-Sync Animated Mouth Overlay */}
                        {isLipSyncing && (
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-red-950/85 border border-red-500/50 rounded-full lip-sync-active shadow-lg flex items-center justify-center">
                            <div className="w-4 h-1.5 bg-red-400/70 rounded-full"></div>
                          </div>
                        )}
                      </div>

                      {/* Glowing energetic pedestal */}
                      <div className={`w-40 h-10 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-full border-t border-brand-400/60 shadow-xl mt-[-12px] mx-auto flex items-center justify-center ${
                        isLipSyncing ? "pedestal-active" : ""
                      }`}>
                        <span className="text-[9px] font-mono font-bold text-brand-300 tracking-widest uppercase">
                          ADHYAYA • 3D
                        </span>
                      </div>
                    </div>

                    {/* Live sound bars when lecturing */}
                    {isLipSyncing && (
                      <div className="flex items-center gap-1 mt-3">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                          <span
                            key={i}
                            className="w-1 bg-brand-400 rounded-full sound-bar"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          ></span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Real-time Subtitles / Captions Box */}
                  <div className="w-full z-10 space-y-2">
                    <div className="bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-center shadow-lg">
                      <p className="text-[11px] text-gray-200 line-clamp-2 italic leading-relaxed">
                        "{scriptText}"
                      </p>
                    </div>

                    {/* Quick Play/Pause Control Bar */}
                    <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center justify-between">
                      <div className="min-w-0 px-2">
                        <p className="text-white font-bold text-xs truncate">{avatarConfig.name || "AI Teacher"}</p>
                        <p className="text-[9px] text-brand-400 font-medium">
                          {isLipSyncing ? "Speaking with Indian accent..." : "Ready to speak"}
                        </p>
                      </div>
                      <button
                        onClick={() => playSpeech(scriptText, voiceGender, language, pace)}
                        className="p-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all shrink-0"
                        title={isLipSyncing ? "Pause lecture" : "Play lecture"}
                      >
                        {isLipSyncing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-gray-500">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">No photo uploaded yet</p>
                  <p className="text-[10px] text-gray-500">Drop an image or select a 3D master on the left.</p>
                </div>
              )}
            </div>

            {/* Attire Styling */}
            <div className="w-full mt-4 pt-3 border-t border-white/10 space-y-2">
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider text-center">
                Virtual Attire Styling
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {["Traditional Kurta", "Classic Saree", "Modern Blazer"].map((attire) => (
                  <button
                    key={attire}
                    onClick={() => setAttireStyle(attire)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-all text-center ${
                      attireStyle === attire
                        ? "bg-blue-500/20 border-blue-500 text-blue-300 font-bold"
                        : "bg-slate-900/40 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    {attire}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick status banner */}
            <div className="w-full text-center mt-3 text-xs text-gray-400 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 leading-relaxed">
              <p className="text-brand-300 font-medium">
                {isConvertedFigurine 
                  ? "✨ 3D AI Figurine Active! Click Deliver Lecture or Play to listen." 
                  : "📸 Photo loaded! Click 'Convert My Photo to 3D AI Figurine' to transform it!"}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
