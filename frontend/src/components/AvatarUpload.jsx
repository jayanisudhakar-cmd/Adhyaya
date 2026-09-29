import React, { useState, useRef, useEffect } from "react";
import { 
  generateAvatarVideo, 
  generateFreeTtsAudio,
  generateRealisticImage,
  generateAiFigure,
  convertRealImageToFigurine, 
  generateAvatarLecture 
} from "../services/api";
import { useLanguage } from "../context/LanguageContext";
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
  Download,
  Film,
  Cpu,
  Layers,
  Palette,
  Type,
  FileImage,
  Camera,
  Key,
  Eye,
  EyeOff
} from "lucide-react";

const LANGUAGES = [
  { id: "kn", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳", speechLang: "Kannada" },
  { id: "en", label: "English (Indian Accent)", flag: "🇮🇳", speechLang: "English" },
  { id: "hi", label: "हिन्दी (Hindi)", flag: "🇮🇳", speechLang: "Hindi" },
  { id: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳", speechLang: "Tamil" },
  { id: "te", label: "తెలుగు (Telugu)", flag: "🇮🇳", speechLang: "Telugu" },
];

const PACES = [
  { id: "Slow", label: "Slow (0.8x)", desc: "Calm & gentle articulation", icon: "🐢" },
  { id: "Medium", label: "Normal (1.0x)", desc: "Standard classroom cadence", icon: "⚖️" },
  { id: "Fast", label: "Fast (1.25x)", desc: "Accelerated recap", icon: "⚡" },
];

const REALISTIC_PROMPT_CHIPS = [
  "Indian female mathematics teacher in elegant teal saree smiling warmly in classroom",
  "Distinguished Indian male physics professor with glasses and tweed blazer in library",
  "Young energetic Indian female computer science tutor in modern tech lab",
  "Warm-hearted Indian biology teacher surrounded by lush botanical plants",
  "Elderly Indian astronomy scholar in traditional kurta looking through telescope"
];

const QUICK_STARTERS = [
  {
    lang: "kn",
    label: "ಕನ್ನಡ • ಸ್ವಾಗತ (Welcome)",
    text: "ನಮಸ್ಕಾರ, ಅಧ್ಯಾಯ ಇ-ಲರ್ನಿಂಗ್ ವೇದಿಕೆಗೆ ಸುಸ್ವಾಗತ! ನಿಮ್ಮ ಶೈಕ್ಷಣಿಕ ಗುರಿಗಳನ್ನು ತಲುಪಲು ನಾವು ಸದಾ ಸಿದ್ಧ."
  },
  {
    lang: "kn",
    label: "ಕನ್ನಡ • ಪೈಥಾನ್ ಪಾಠ (Python Lesson)",
    text: "ಇಂದು ನಾವು ಪೈಥಾನ್ ಪ್ರೋಗ್ರಾಮಿಂಗ್‌ನ ಮೂಲ ತತ್ವಗಳನ್ನು ಕಲಿಯಲಿದ್ದೇವೆ. ವೇರಿಯೇಬಲ್‌ಗಳು ಮತ್ತು ಫಂಕ್ಷನ್‌ಗಳ ಬಗ್ಗೆ ತಿಳಿಯೋಣ."
  },
  {
    lang: "en",
    label: "English • Welcome to Adhyaya",
    text: "Welcome to the Adhyaya AI personalized education platform! Let us learn step-by-step with interactive visual explanations."
  },
  {
    lang: "en",
    label: "English • Quantum Physics",
    text: "Today we are exploring the foundational principles of Quantum Physics and superposition. Let us begin!"
  }
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
  const { courseLanguage, setCourseLanguage, currentCourseLang, t } = useLanguage();

  // Voice & Language state (synced with Course Content Language)
  const [voiceGender, setVoiceGender] = useState("female");
  const [selectedLanguage, setSelectedLanguage] = useState(courseLanguage || "kn");
  const [ttsEngine, setTtsEngine] = useState("gtts"); // 'gtts' (Google Free) or 'edge_tts' (Free Neural)
  const [pace, setPace] = useState("Medium");

  useEffect(() => {
    if (courseLanguage && courseLanguage !== selectedLanguage) {
      setSelectedLanguage(courseLanguage);
    }
  }, [courseLanguage]);
  
  // Viewport mode: 'video' (rendered MP4) or 'interactive' (3D/2D live canvas)
  const [viewportMode, setViewportMode] = useState("video");

  // User input creation tab: 'gemini_realistic', 'upload', 'prompt'
  const [inputTab, setInputTab] = useState("gemini_realistic");

  // Realistic AI Image Generator state (Gemini Imagen & Neural Realism)
  const [realisticPrompt, setRealisticPrompt] = useState(
    "Indian female mathematics teacher in elegant teal saree smiling warmly in classroom"
  );
  const [realisticStyle, setRealisticStyle] = useState("photorealistic");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGeneratingRealistic, setIsGeneratingRealistic] = useState(false);
  const [realisticEngineUsed, setRealisticEngineUsed] = useState("");

  // Option B: Drop Photo state
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [conversionStyle, setConversionStyle] = useState("2d_illustrated");
  const [convertingFigurine, setConvertingFigurine] = useState(false);

  // Script & Audio/Video state
  const [scriptText, setScriptText] = useState(
    "ನಮಸ್ಕಾರ, ಅಧ್ಯಾಯ ಇ-ಲರ್ನಿಂಗ್ ವೇದಿಕೆಗೆ ಸುಸ್ವಾಗತ! ನಿಮ್ಮ ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ಪಠ್ಯಕ್ರಮವನ್ನು ಕಲಿಯಲು ನಾವು ಸಿದ್ಧರಿದ್ದೇವೆ."
  );
  const [renderedVideoUrl, setRenderedVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(null);
  const [isLipSyncing, setIsLipSyncing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderingStep, setRenderingStep] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Prototype Demonstration state
  const [demoTopic, setDemoTopic] = useState("Python Programming");
  const [isGeneratingLecture, setIsGeneratingLecture] = useState(false);

  // Audio & video player refs
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if (setGlobalAvatarVideo) setGlobalAvatarVideo("");
    setAvatarConfig((prev) => ({
      ...prev,
      imageUrl: previewUrl,
      imageFile: file,
      videoUrl: null,
      name: file.name.substring(0, 18) || "My Uploaded Photo"
    }));
    setRenderedVideoUrl("");
    setSuccessMsg(`📸 Photo loaded: "${file.name}". You can now convert it to an AI figure below!`);
  };

  const handleCustomImageSubmit = (e) => {
    e.preventDefault();
    if (customImageUrl.trim()) {
      setError("");
      setSuccessMsg("");
      stopSpeech();
      if (setGlobalAvatarVideo) setGlobalAvatarVideo("");
      setAvatarConfig((prev) => ({
        ...prev,
        imageUrl: customImageUrl.trim(),
        imageFile: null,
        videoUrl: null,
        name: "Web Photo"
      }));
      setRenderedVideoUrl("");
      setSuccessMsg("📸 Web photo loaded! Click 'Convert My Photo into AI Figure' below.");
    }
  };

  // 1. GENERATE REALISTIC AI TEACHER IMAGE (GEMINI IMAGEN / NEURAL REALISM)
  const handleGenerateRealisticImage = async () => {
    const promptToUse = realisticPrompt.trim();
    if (!promptToUse) {
      setError("Please describe the teacher image you wish to generate.");
      return;
    }

    stopSpeech();
    setError("");
    setSuccessMsg("");
    setIsGeneratingRealistic(true);

    try {
      const res = await generateRealisticImage(promptToUse, geminiApiKey, realisticStyle);
      if (res && res.avatar_url) {
        const isMale = /\b(male|man|sir|mr|professor|boy|he|his)\b/i.test(promptToUse);
        const resolvedGender = isMale ? "male" : "female";
        setVoiceGender(resolvedGender);
        if (setGlobalAvatarVideo) setGlobalAvatarVideo("");
        setRenderedVideoUrl("");
        setAvatarConfig((prev) => ({
          ...prev,
          imageUrl: res.avatar_url,
          imageFile: null,
          videoUrl: null,
          voiceGender: resolvedGender,
          name: promptToUse.substring(0, 24) || "Realistic Teacher",
        }));

        setSuccessMsg(`✨ Realistic AI Teacher Image generated with enhanced visuals (${res.engine})! Ready with lip-sync audio.`);
      } else {
        throw new Error("No image data returned from generator.");
      }
    } catch (err) {
      console.warn("Realistic image generation error:", err);
      setError("Image generation error: " + (err.message || "Please check prompt or try again."));
    } finally {
      setIsGeneratingRealistic(false);
    }
  };

  // 2. CONVERT UPLOADED PHOTO INTO AI FIGURE
  const handleConvertUploadedPhoto = async (styleToUse = conversionStyle) => {
    const source = avatarConfig.imageFile || avatarConfig.imageUrl;
    if (!source) {
      setError("Please drop or upload a photo first.");
      return;
    }

    stopSpeech();
    setError("");
    setSuccessMsg("");
    setConvertingFigurine(true);

    try {
      const res = await convertRealImageToFigurine(source, styleToUse);
      if (res && res.figurine_url) {
        if (setGlobalAvatarVideo) setGlobalAvatarVideo("");
        setRenderedVideoUrl("");
        setAvatarConfig((prev) => ({
          ...prev,
          imageUrl: res.figurine_url,
          videoUrl: null,
          name: `AI Figure (${styleToUse.replace("_", " ")})`
        }));
        setSuccessMsg(`✨ Successfully converted your photo into a ${styleToUse.replace("_", " ")} AI Figure!`);
      } else {
        throw new Error("No image data returned from converter.");
      }
    } catch (err) {
      console.warn("Conversion notice:", err);
      setError("Image conversion failed: " + (err.message || "Try another photo."));
    } finally {
      setConvertingFigurine(false);
    }
  };

  // Stop audio speech
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

  // Free Speech Audio Preview (gTTS or Edge-TTS)
  const handlePreviewFreeSpeech = async () => {
    if (isLipSyncing) {
      stopSpeech();
      return;
    }

    stopSpeech();
    setIsSynthesizing(true);
    setError("");

    try {
      const res = await generateFreeTtsAudio(
        scriptText,
        selectedLanguage,
        ttsEngine,
        voiceGender,
        pace
      );

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
        audio.onerror = () => {
          setIsSynthesizing(false);
          setIsLipSyncing(false);
        };

        await audio.play();
        setSuccessMsg(`🔊 Playing free ${ttsEngine.toUpperCase()} lip-sync audio in ${selectedLanguage.toUpperCase()}!`);
      }
    } catch (err) {
      console.warn("Speech preview error:", err);
      setError("Speech synthesis error. Check your network or try another language.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Render Synced Talking Avatar Video (.mp4)
  const handleRenderTalkingAvatarVideo = async () => {
    const imageSource = avatarConfig.imageFile || avatarConfig.imageUrl;
    if (!imageSource) {
      setError("Please generate an enhanced realistic image or drop a photo on the left first.");
      return;
    }

    if (!scriptText.trim()) {
      setError("Please enter a speech script.");
      return;
    }

    stopSpeech();
    setError("");
    setSuccessMsg("");
    setIsRenderingVideo(true);
    setRenderingStep("Synthesizing free speech audio in " + selectedLanguage.toUpperCase() + "...");

    try {
      setTimeout(() => {
        setRenderingStep("Detecting realistic face landmarks & mapping audio waveform...");
      }, 800);

      setTimeout(() => {
        setRenderingStep("Rendering synchronized lip-sync video frames (.mp4)...");
      }, 1600);

      const response = await generateAvatarVideo({
        imageSource,
        script: scriptText,
        language: selectedLanguage,
        engine: ttsEngine,
        voiceGender,
        pace
      });

      if (response && response.video_url) {
        setRenderedVideoUrl(response.video_url);
        setVideoDuration(response.duration);
        setGlobalAvatarVideo(response.video_url);
        setAvatarConfig(prev => ({
          ...prev,
          videoUrl: response.video_url,
          voiceGender
        }));
        setViewportMode("video");
        setSuccessMsg(`🎉 Synced talking avatar video rendered successfully (${response.duration}s, 100% Free & Open-Source)!`);
      } else {
        throw new Error(response?.message || "Failed to render video");
      }
    } catch (err) {
      console.warn("Video render error:", err);
      setError("Notice: " + (err.message || "Failed to render video. Switch to interactive mode."));
      setViewportMode("interactive");
    } finally {
      setIsRenderingVideo(false);
      setRenderingStep("");
    }
  };

  // Prototype Demonstration / Course Lecture Explainer
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
      const langObj = LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[0];
      const res = await generateAvatarLecture(topicToUse, langObj.speechLang, pace);
      if (res && res.lecture_script) {
        setScriptText(res.lecture_script);
        setSuccessMsg(`✨ Generated articulate lecture for "${topicToUse}" in ${langObj.speechLang}!`);
      }
    } catch (err) {
      console.warn("Lecture generation fallback:", err);
      const fallbackScript = selectedLanguage === "kn"
        ? `ನಮಸ್ಕಾರ ಮತ್ತು ಅಧ್ಯಾಯಕ್ಕೆ ಸುಸ್ವಾಗತ! ಇಂದು ನಾವು ${topicToUse} ವಿಷಯದ ಪ್ರಮುಖ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಕಲಿಯಲಿದ್ದೇವೆ.`
        : `Namaste and welcome to Adhyaya! Today we are exploring the foundational principles of ${topicToUse}.`;
      setScriptText(fallbackScript);
    } finally {
      setIsGeneratingLecture(false);
    }
  };

  const activeImage = avatarConfig.imageUrl;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Realistic AI Teacher Studio & Lip-Sync Pipeline</span>
            <span className="text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
              Gemini Imagen 3 & Neural Realism
            </span>
          </h1>
          <span className="text-[11px] text-gray-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5 font-mono">
            Photorealistic Visuals • Kannada & English Audio • Synced MP4 Video
          </span>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Create photorealistic, attractive AI teacher avatars with enhanced facial details using Gemini Imagen 3, or drop your own photo, and generate a synchronized talking avatar video with authentic Indian accents!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Realistic AI Image Generator + Free Speech + MP4 Render */}
        <div className="lg:col-span-2 space-y-6">

          {/* STEP 1: REALISTIC IMAGE GENERATOR & INPUT */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-slate-900 to-brand-950/20 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Input Method Selector Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-purple-500/25">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Step 1: Create Realistic AI Teacher Avatar
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    Generate an attractive, photorealistic educator or drop your own photo
                  </p>
                </div>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setInputTab("gemini_realistic")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    inputTab === "gemini_realistic"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Gemini Realistic AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputTab("upload")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    inputTab === "upload"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <FileImage className="w-3.5 h-3.5" />
                  <span>Drop Photo</span>
                </button>
              </div>
            </div>

            {/* TAB 1: GEMINI REALISTIC AI IMAGE GENERATOR */}
            {inputTab === "gemini_realistic" && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Description Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-purple-400" />
                      Describe Your Ideal Teacher (Enhanced Photorealistic Prompts):
                    </label>
                    <span className="text-[10px] text-purple-300 font-mono">
                      8K Photographic Quality
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    value={realisticPrompt}
                    onChange={(e) => setRealisticPrompt(e.target.value)}
                    placeholder="e.g. Indian female mathematics teacher in elegant teal saree smiling warmly in classroom..."
                    className="w-full bg-slate-900/90 border border-purple-500/30 rounded-xl p-3 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Quick Realistic Inspiration Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Quick Realistic Prompts (Click to Use):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {REALISTIC_PROMPT_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRealisticPrompt(chip)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border text-left transition-all ${
                          realisticPrompt === chip
                            ? "bg-purple-500/30 border-purple-400 text-purple-200 font-bold"
                            : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        {chip.substring(0, 48)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style & Aesthetic Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-purple-400" />
                      Visual Aesthetic Preset:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "photorealistic", label: "📸 8K Portrait", desc: "Studio depth & skin" },
                        { id: "academic", label: "🎓 Academic Prof", desc: "Library & formal wear" },
                        { id: "modern_tutor", label: "🌿 Modern Tutor", desc: "Vibrant classroom" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setRealisticStyle(st.id)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            realisticStyle === st.id
                              ? "bg-purple-500/25 border-purple-400 text-purple-200 font-bold shadow-sm"
                              : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                          }`}
                        >
                          <p className="text-[11px] font-bold">{st.label}</p>
                          <p className="text-[8px] text-gray-400 mt-0.5">{st.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional External API Key */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-300" />
                        External AI Key:
                      </label>
                      <span className="text-[9px] text-gray-400 font-medium">(Optional)</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        placeholder="Google Gemini (AIzaSy...) or HuggingFace (hf_...) - Or leave blank"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2 pl-3 pr-8 text-white text-[11px] placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      {geminiApiKey.startsWith("AIzaSy") ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          ✓ Google Imagen 3 Engine Active
                        </span>
                      ) : geminiApiKey.startsWith("hf_") ? (
                        <span className="text-sky-400 font-semibold flex items-center gap-1">
                          ✓ Hugging Face FLUX.1 Engine Active
                        </span>
                      ) : geminiApiKey.trim() ? (
                        <span className="text-amber-400 font-semibold">
                          Custom Key configured
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[9px]">
                          ⚡ Free Live Neural & Studio HD Library (No Key Required)
                        </span>
                      )}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-[9px] underline underline-offset-2"
                      >
                        Get free Gemini Key →
                      </a>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerateRealisticImage}
                  disabled={isGeneratingRealistic || !realisticPrompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-brand-500 hover:from-purple-700 hover:to-brand-600 disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-xl text-xs transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transform hover:scale-[1.01]"
                >
                  {isGeneratingRealistic ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Synthesizing Enhanced Realistic Image (Imagen 3 / Neural Realism)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>✨ Generate Enhanced Realistic AI Image</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: DIRECT IMAGE DROP BOX & CONVERTER */}
            {inputTab === "upload" && (
              <div className="space-y-4 animate-fade-in">
                
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
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-brand-400 shadow-lg">
                      <Upload className="w-6 h-6" />
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
                        <p className="text-[11px] text-gray-500 mt-1">
                          Drop any portrait, selfie, or character image • PNG, JPG, JPEG
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* External URL alternative */}
                <form onSubmit={handleCustomImageSubmit} className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste an image web URL: https://example.com/portrait.jpg"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="flex-1 bg-slate-900/80 border border-slate-700/60 rounded-xl py-2 px-3 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl text-xs border border-white/10 shrink-0"
                  >
                    Load URL
                  </button>
                </form>

                {/* Convert Photo to AI Figure Panel */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                      Convert Loaded Photo into AI Figure:
                    </label>
                    <span className="text-[10px] text-gray-400 font-mono">Neural Shaders</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "2d_illustrated", label: "🎨 2D Comic", desc: "Cel-shaded line art" },
                      { id: "anime_chibi", label: "⚡ 2D Anime", desc: "Watercolor sensei" },
                      { id: "clay_figurine", label: "🏺 3D Figurine", desc: "Smooth clay toy" },
                      { id: "cyberpunk", label: "🤖 Cyber Hologram", desc: "Neon edge glow" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setConversionStyle(st.id);
                          if (activeImage) handleConvertUploadedPhoto(st.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          conversionStyle === st.id
                            ? "bg-brand-500/25 border-brand-400 text-brand-200 shadow-sm"
                            : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        <p className="font-bold text-xs">{st.label}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">{st.desc}</p>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConvertUploadedPhoto()}
                    disabled={convertingFigurine || !activeImage}
                    className="w-full bg-gradient-to-r from-brand-500 via-blue-600 to-purple-600 hover:from-brand-600 hover:to-purple-700 disabled:opacity-50 text-white font-extrabold py-3 px-5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {convertingFigurine ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Converting Photo into AI Figure ({conversionStyle.replace("_", " ")})...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Convert My Photo into AI Figure Avatar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* STEP 2: Free Speech Audio in English & Kannada (Free TTS) */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-teal-950/20 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Step 2: Course Audio & Speech Language (Free TTS)
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    Controls the teacher's spoken audio language — authentic Indian accents in Kannada, English, Hindi, etc.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full">
                🎓 {currentCourseLang.label}
              </span>
            </div>

            {/* Language & Free Engine Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Language Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  Course Speech Language:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {LANGUAGES.slice(0, 4).map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang.id);
                        setCourseLanguage(lang.id);
                      }}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-1.5 ${
                        selectedLanguage === lang.id
                          ? "bg-purple-500/25 border-purple-400 text-purple-200 shadow-sm"
                          : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Free TTS Engine Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Free TTS Engine:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTtsEngine("gtts")}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      ttsEngine === "gtts"
                        ? "bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold shadow-sm"
                        : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <p className="text-xs font-bold">gTTS (Google)</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">100% Free Python TTS</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTtsEngine("edge_tts")}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      ttsEngine === "edge_tts"
                        ? "bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold shadow-sm"
                        : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <p className="text-xs font-bold">Edge-TTS</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Free Neural Voices</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Accent Gender & Pacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-brand-400" />
                  Voice Gender:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVoiceGender("female")}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                      voiceGender === "female"
                        ? "bg-brand-500/20 border-brand-500 text-brand-300 shadow-sm"
                        : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    👩‍🏫 Female
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceGender("male")}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                      voiceGender === "male"
                        ? "bg-brand-500/20 border-brand-500 text-brand-300 shadow-sm"
                        : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    👨‍🏫 Male
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" />
                  Pace Rate:
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {PACES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPace(p.id)}
                      className={`py-1.5 px-1 rounded-lg border text-[11px] font-bold transition-all text-center ${
                        pace === p.id
                          ? "bg-purple-500/20 border-purple-500 text-purple-300"
                          : "bg-slate-900/60 border-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {p.icon} {p.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Kannada & English Text Starters */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Quick Speech Starters (Click to Insert):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {QUICK_STARTERS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(s.lang);
                      setScriptText(s.text);
                    }}
                    className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-brand-500/40 text-left transition-all"
                  >
                    <p className="text-xs font-bold text-brand-300 truncate">{s.label}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{s.text}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Script Text Input Area */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-brand-400" />
                  Spoken Script / Prompt Text:
                </label>
                <span className="text-[10px] text-gray-400 font-mono">
                  {scriptText.length} characters
                </span>
              </div>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={3}
                placeholder="Type your speech script in English, Kannada, or any language..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all resize-none leading-relaxed"
              />

              {/* Preview Audio Button */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePreviewFreeSpeech}
                  disabled={isSynthesizing || !scriptText.trim()}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs border border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  {isSynthesizing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Free Audio ({ttsEngine.toUpperCase()})...</span>
                    </>
                  ) : isLipSyncing ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-300" />
                      <span>Pause Lip-Sync Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>🔊 Play Lip-Sync Audio (.mp3) [{selectedLanguage.toUpperCase()} • {ttsEngine.toUpperCase()}]</span>
                    </>
                  )}
                </button>

                {isLipSyncing && (
                  <button
                    type="button"
                    onClick={stopSpeech}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold px-3 rounded-xl text-xs transition-all flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* STEP 3 & 4: Render Synced Talking Avatar (.mp4) */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950/20 via-slate-900 to-brand-950/20 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Step 3: Render Synced Talking Avatar Video (.mp4)
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    Renders an MP4 video with lip-sync synchronized to audio for your customized AI figure
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                H.264 MP4 Video
              </span>
            </div>

            {/* Render Talking Video Button */}
            <button
              type="button"
              onClick={handleRenderTalkingAvatarVideo}
              disabled={isRenderingVideo || !activeImage || !scriptText.trim()}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-brand-500 hover:from-purple-700 hover:to-brand-600 disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-xl text-xs transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transform hover:scale-[1.01]"
            >
              {isRenderingVideo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span className="animate-pulse">{renderingStep || "Rendering Talking Video (.mp4)..."}</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 text-amber-300" />
                  <span>🎬 Render Synced Talking Avatar (.mp4) [100% Free & Open-Source]</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-red-400 text-xs font-medium text-center bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                {error}
              </p>
            )}

            {successMsg && (
              <p className="text-emerald-400 text-xs font-semibold text-center bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl animate-fade-in">
                {successMsg}
              </p>
            )}
          </div>

          {/* Prototype Demonstration / Course Explainer */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-400" />
                Prototype Demonstration: Course Lecture Explainer
              </h3>
              <span className="text-[9px] bg-slate-800 text-gray-400 px-2 py-0.5 rounded-md font-mono">
                Auto-Lecture
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Python, Quantum Physics, Photosynthesis..."
                value={demoTopic}
                onChange={(e) => setDemoTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGenerateAndDeliverLecture();
                }}
                className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl py-2 px-3 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => handleGenerateAndDeliverLecture()}
                disabled={isGeneratingLecture}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shrink-0 flex items-center gap-1.5"
              >
                {isGeneratingLecture ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Generate Script</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {QUICK_TOPICS.map((tpc) => (
                <button
                  key={tpc}
                  type="button"
                  onClick={() => {
                    setDemoTopic(tpc);
                    handleGenerateAndDeliverLecture(tpc);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                    demoTopic === tpc
                      ? "bg-brand-500/25 border-brand-400 text-brand-200 font-bold"
                      : "bg-slate-900/50 border-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  {tpc}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Dual Viewport (Rendered MP4 Video vs Interactive Studio) */}
        <div className="space-y-5">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col items-center">
            
            {/* Viewport Header & Mode Tabs */}
            <div className="w-full flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewportMode("video")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewportMode === "video"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>MP4 Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewportMode("interactive")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewportMode === "interactive"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>3D/2D Studio</span>
                </button>
              </div>

              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isRenderingVideo
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse"
                  : isGeneratingRealistic
                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse"
                  : isLipSyncing
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/40 animate-pulse"
                  : "bg-slate-800 text-gray-400"
              }`}>
                {isRenderingVideo ? "Rendering MP4" : isGeneratingRealistic ? "Generating Image" : isLipSyncing ? "Playing Audio" : "Ready"}
              </span>
            </div>

            {/* VIEWPORT 1: Rendered MP4 Video Player */}
            {viewportMode === "video" && (
              <div className="w-full flex flex-col items-center space-y-3">
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4] w-full max-w-[320px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-white/15 shadow-2xl flex flex-col items-center justify-center">
                  {renderedVideoUrl ? (
                    <video
                      ref={videoRef}
                      src={renderedVideoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : activeImage ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-44 h-44 rounded-2xl overflow-hidden border-4 border-purple-500/40 shadow-2xl mb-4 bg-slate-800">
                        <img
                          src={activeImage}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/10 max-w-[250px]">
                        <p className="text-xs font-bold text-white truncate">{avatarConfig.name || "Realistic AI Teacher"}</p>
                        <p className="text-[10px] text-purple-300 mt-0.5">
                          {realisticEngineUsed ? `Generated by ${realisticEngineUsed}` : "Image loaded & ready"}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-1">
                          Click "Render Synced Talking Avatar (.mp4)" on the left to create your video.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-2">
                      <ImageIcon className="w-8 h-8 text-gray-500 mx-auto" />
                      <p className="text-xs text-gray-400 font-medium">No avatar loaded yet</p>
                      <p className="text-[10px] text-gray-500">
                        Describe an AI teacher or drop a photo on the left to begin!
                      </p>
                    </div>
                  )}

                  {/* Rendering Progress Overlay */}
                  {isRenderingVideo && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 mb-3 animate-spin">
                        <Film className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-white mb-1">Rendering Lip-Sync Video</p>
                      <p className="text-[11px] text-purple-300 font-medium">{renderingStep || "Processing..."}</p>
                      <span className="text-[9px] text-gray-400 mt-2 font-mono">100% Free Open-Source Pipeline</span>
                    </div>
                  )}
                </div>

                {/* Video Info & Download Bar */}
                {renderedVideoUrl && (
                  <div className="w-full space-y-2">
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">Synced Talking Avatar (.mp4)</p>
                        <p className="text-[10px] text-emerald-400">Duration: {videoDuration}s • H.264 / AAC</p>
                      </div>
                      <a
                        href={renderedVideoUrl}
                        download={`adhyaya_avatar_${Date.now()}.mp4`}
                        className="bg-brand-500 hover:bg-brand-600 text-white font-bold p-2 rounded-lg transition-all flex items-center gap-1 text-[11px]"
                        title="Download rendered MP4 video"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save MP4</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEWPORT 2: Interactive 3D / 2D Studio Canvas */}
            {viewportMode === "interactive" && (
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4] w-full max-w-[320px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-white/15 shadow-2xl flex flex-col items-center justify-between p-4">
                
                {/* Holographic backdrop glow */}
                <div className={`absolute inset-0 bg-radial-gradient from-purple-500/20 via-transparent to-slate-950 -z-10 transition-opacity duration-500 ${
                  isLipSyncing ? "opacity-100" : "opacity-40"
                }`}></div>

                {/* Top status indicator pill */}
                <div className="w-full flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono font-bold bg-slate-900/80 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-md text-purple-300">
                    {voiceGender === "female" ? "👩‍🏫 Female" : "👨‍🏫 Male"}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 bg-slate-900/80 px-2 py-0.5 rounded-md">
                    {selectedLanguage.toUpperCase()} • {ttsEngine.toUpperCase()}
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
                    <div className="w-44 h-44 rounded-2xl overflow-hidden border-4 border-purple-500/40 shadow-2xl shadow-purple-500/30 relative bg-slate-800">
                      {activeImage ? (
                        <img
                          src={activeImage}
                          alt="Teacher Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                          <ImageIcon className="w-8 h-8 text-gray-500 mb-1" />
                          <p className="text-[10px] text-gray-400">No avatar yet</p>
                        </div>
                      )}

                      {/* Subtle Live Speaking Badge */}
                      {isLipSyncing && activeImage && (
                        <div className="absolute top-2.5 right-2.5 bg-slate-950/85 backdrop-blur-sm border border-purple-400/50 px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-purple-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          <span className="text-[9px] font-mono font-bold text-purple-200">Speaking</span>
                        </div>
                      )}
                    </div>

                    {/* Glowing energetic pedestal */}
                    <div className={`w-40 h-10 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-full border-t border-purple-400/60 shadow-xl mt-[-10px] mx-auto flex items-center justify-center ${
                      isLipSyncing ? "pedestal-active" : ""
                    }`}>
                      <span className="text-[9px] font-mono font-bold text-purple-300 tracking-widest uppercase">
                        ADHYAYA • AI
                      </span>
                    </div>
                  </div>

                  {/* Live sound bars when lecturing */}
                  {isLipSyncing && (
                    <div className="flex items-center gap-1 mt-3">
                      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <span
                          key={i}
                          className="w-1 bg-purple-400 rounded-full sound-bar"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        ></span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtitles Overlay */}
                <div className="w-full z-10 space-y-2">
                  <div className="bg-slate-950/90 backdrop-blur-md p-2 rounded-xl border border-white/10 text-center shadow-lg">
                    <p className="text-[11px] text-gray-200 line-clamp-2 italic leading-relaxed">
                      "{scriptText}"
                    </p>
                  </div>

                  {/* Quick Play/Pause Control Bar */}
                  <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center justify-between">
                    <div className="min-w-0 px-2">
                      <p className="text-white font-bold text-xs truncate">{avatarConfig.name || "My AI Teacher"}</p>
                      <p className="text-[9px] text-purple-300 font-medium">
                        {isLipSyncing ? "Speaking with lip sync..." : "Ready to speak"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePreviewFreeSpeech}
                      disabled={!activeImage}
                      className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white shadow-md transition-all shrink-0"
                      title={isLipSyncing ? "Pause speech" : "Play speech"}
                    >
                      {isLipSyncing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Quick status banner */}
            <div className="w-full text-center mt-3 text-xs text-gray-400 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 leading-relaxed">
              <p className="text-purple-300 font-medium">
                {renderedVideoUrl
                  ? "🎉 Rendered MP4 Video is ready! Play it above or download for your course."
                  : activeImage
                  ? "✨ Your avatar is loaded! Click 'Render Synced Talking Avatar' to render the talking video."
                  : "💡 Describe your teacher or drop a photo on the left to create your enhanced realistic avatar!"}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
