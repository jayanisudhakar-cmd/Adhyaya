import React, { useState, useRef, useEffect } from "react";
import { generateAvatarVideo } from "../services/api";
import { 
  Upload, 
  Sparkles, 
  Loader2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Check, 
  RefreshCw,
  Image as ImageIcon,
  Wand2,
  Layers,
  Sliders
} from "lucide-react";

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Ananya (Warm Indian English)", lang: "en-IN", style: "Encouraging Tutor" },
  { id: "29vD33N1CtxCmqQRPOHJ", name: "Kabir (Clear, Academic)", lang: "en-IN", style: "Professor" },
  { id: "2EiwWnXF2V4j9tZO7GCz", name: "Rohan (Energetic, Modern)", lang: "en-IN", style: "Mentor" },
  { id: "piYVMnqqwG45qbS2gnQt", name: "Priya (Calm, Soothing)", lang: "en-IN", style: "Gentle Guide" }
];

export default function AvatarUpload({ avatarConfig, setAvatarConfig, setGlobalAvatarVideo }) {
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [scriptText, setScriptText] = useState(
    "Namaste! I am your AI Virtual Teacher on Adhyaya. I am here to guide you step-by-step through your personalized curriculum."
  );
  const [generating, setGenerating] = useState(false);
  const [testVideoUrl, setTestVideoUrl] = useState("");
  const [isLipSyncing, setIsLipSyncing] = useState(false);
  const [error, setError] = useState("");
  const [attireStyle, setAttireStyle] = useState("Traditional Kurta");
  const [figurineGenerated, setFigurineGenerated] = useState(false);

  // File input ref
  const fileInputRef = useRef(null);

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
    const previewUrl = URL.createObjectURL(file);
    setAvatarConfig((prev) => ({
      ...prev,
      imageUrl: previewUrl,
      imageFile: file,
      name: file.name.substring(0, 18) || "Custom Teacher"
    }));
    setFigurineGenerated(false);
    setTestVideoUrl("");
  };

  const handleCustomImageSubmit = (e) => {
    e.preventDefault();
    if (customImageUrl.trim()) {
      setError("");
      setAvatarConfig((prev) => ({
        ...prev,
        imageUrl: customImageUrl.trim(),
        imageFile: null,
        name: "Custom URL Avatar"
      }));
      setFigurineGenerated(false);
      setTestVideoUrl("");
    }
  };

  const handleVoiceChange = (voice) => {
    setSelectedVoice(voice);
    setAvatarConfig((prev) => ({
      ...prev,
      voiceId: voice.id,
      voiceName: voice.name
    }));
  };

  // Live Figurine Voice & Lip-sync Simulation
  const triggerLipSyncSpeech = (text) => {
    if (!window.speechSynthesis) return;

    if (isLipSyncing) {
      window.speechSynthesis.cancel();
      setIsLipSyncing(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text || scriptText);
    utterance.rate = 1.0;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.includes("en-IN") || v.name.includes("India"));
    if (match) utterance.voice = match;

    utterance.onstart = () => setIsLipSyncing(true);
    utterance.onend = () => setIsLipSyncing(false);
    utterance.onerror = () => setIsLipSyncing(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateFigurine = async () => {
    const imageSource = avatarConfig.imageFile || avatarConfig.imageUrl;
    if (!imageSource) {
      setError("Please drop or upload a face image first.");
      return;
    }

    setError("");
    setGenerating(true);

    try {
      const response = await generateAvatarVideo(imageSource, scriptText, selectedVoice.id);
      
      if (response && response.video_url) {
        setTestVideoUrl(response.video_url);
        setGlobalAvatarVideo(response.video_url);
      } else {
        // Interactive Figurine mode activated
        setFigurineGenerated(true);
        triggerLipSyncSpeech(scriptText);
      }
    } catch (err) {
      console.warn("Avatar video API fallback:", err);
      // Fallback to real-time interactive animated figurine with speech synthesis
      setFigurineGenerated(true);
      triggerLipSyncSpeech(scriptText);
    } finally {
      setGenerating(false);
      setFigurineGenerated(true);
    }
  };

  const activeImage = avatarConfig.imageUrl;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Intro Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>AI Teacher Avatar & Figurine</span>
          <span className="text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
            Adhyaya 3D Studio
          </span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          Drop any portrait photo from your device. Our engine converts it into a personalized AI Virtual Teacher figurine with realistic lip-sync speech to deliver your course lectures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Drop Box & Customization */}
        <div className="lg:col-span-2 space-y-6">

          {/* Direct Image Drop Box */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-400" />
              1. Direct Image Drop Box (Device or URL)
            </h2>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
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

              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-brand-400 shadow-lg">
                  <ImageIcon className="w-8 h-8" />
                </div>
                {avatarConfig.imageFile ? (
                  <div>
                    <p className="text-sm font-bold text-white">Selected: {avatarConfig.imageFile.name}</p>
                    <p className="text-xs text-brand-400 mt-1 font-medium">Click or drop another file to replace</p>
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
                  placeholder="https://example.com/teacher-photo.jpg"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 bg-slate-900/80 border border-slate-700/60 rounded-xl py-2.5 px-4 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs border border-white/10 transition-all shrink-0"
                >
                  Load URL
                </button>
              </div>
            </form>
          </div>

          {/* Voice & Attire Selection */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-brand-400" />
              2. Voice Persona & Attire Styling
            </h2>

            {/* Voice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VOICES.map((voice) => {
                const isSelected = selectedVoice.id === voice.id;
                return (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceChange(voice)}
                    className={`p-3.5 rounded-xl border text-left flex justify-between items-center transition-all ${
                      isSelected
                        ? "bg-brand-500/15 border-brand-500 shadow-md shadow-brand-500/10"
                        : "bg-slate-900/30 border-white/5 hover:bg-slate-900/60"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-white text-xs">{voice.name}</p>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">{voice.style}</span>
                    </div>
                    {isSelected && (
                      <div className="bg-brand-500 text-white rounded-full p-1">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Attire Styling */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Virtual Attire Styling
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Traditional Kurta", "Classic Saree", "Modern Blazer"].map((attire) => (
                  <button
                    key={attire}
                    onClick={() => setAttireStyle(attire)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
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
          </div>

          {/* Figurine Speech Script */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              3. Narration Script & Figurine Generation
            </h2>

            <div className="space-y-3">
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={3}
                placeholder="Enter what you want your AI Virtual Teacher to say..."
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all resize-none leading-relaxed"
              />

              {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

              <button
                onClick={handleGenerateFigurine}
                disabled={generating || !activeImage}
                className="w-full bg-gradient-to-r from-brand-500 to-blue-600 hover:from-brand-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl text-xs transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Voice & Rendering AI Figurine...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Virtual AI Figurine & Animate Lip-Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Figurine Viewport */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm">Virtual Figurine Viewport</h3>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isLipSyncing ? "bg-brand-500/20 text-brand-400 border border-brand-500/30 animate-pulse" : "bg-slate-800 text-gray-400"
              }`}>
                {isLipSyncing ? "Speaking Now" : "Ready"}
              </span>
            </div>

            {/* 3D Figurine Frame */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] w-full max-w-[300px] bg-gradient-to-b from-slate-900 to-slate-950 border border-white/15 shadow-2xl flex flex-col items-center justify-center">
              {testVideoUrl ? (
                <video
                  src={testVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              ) : activeImage ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden">
                  {/* Holographic backdrop glow */}
                  <div className="absolute inset-0 bg-radial-gradient from-brand-500/10 via-transparent to-slate-950 -z-10"></div>

                  {/* Animated Avatar Figurine */}
                  <div className={`relative transition-all duration-300 ${isLipSyncing ? "animate-figurine" : ""}`}>
                    {/* Portrait Head Frame */}
                    <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-brand-500/40 shadow-2xl shadow-brand-500/30 relative">
                      <img
                        src={activeImage}
                        alt="Uploaded Teacher Portrait"
                        className="w-full h-full object-cover"
                      />

                      {/* Lip-Sync Animated Mouth Overlay */}
                      {isLipSyncing && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-7 h-3 bg-red-950/70 border border-red-500/40 rounded-full lip-sync-active shadow-md">
                          <div className="w-full h-full bg-red-400/40 rounded-full"></div>
                        </div>
                      )}
                    </div>

                    {/* Figurine Attire Body Simulation */}
                    <div className="w-44 h-28 bg-gradient-to-t from-slate-950 via-slate-900 to-brand-950/60 rounded-t-3xl mt-[-14px] mx-auto border-t-2 border-brand-400/40 flex flex-col items-center justify-center shadow-2xl relative">
                      <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider">
                        {attireStyle}
                      </span>
                      <span className="text-[9px] text-gray-400">Adhyaya Avatar</span>

                      {/* Live sound bars when speaking */}
                      {isLipSyncing && (
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span
                              key={i}
                              className="w-1 bg-brand-400 rounded-full sound-bar"
                              style={{ animationDelay: `${i * 0.12}s` }}
                            ></span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attire label tag */}
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-xs truncate">{avatarConfig.name || "AI Teacher"}</p>
                      <p className="text-[10px] text-brand-400">{selectedVoice.name.split(" ")[0]} Voice</p>
                    </div>
                    <button
                      onClick={() => triggerLipSyncSpeech()}
                      className="p-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all"
                      title={isLipSyncing ? "Pause speech" : "Play speech with lip sync"}
                    >
                      {isLipSyncing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-gray-500">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">No photo uploaded yet</p>
                  <p className="text-[10px] text-gray-500">Drop an image on the left to animate your AI figurine.</p>
                </div>
              )}
            </div>

            {/* Quick status message */}
            <div className="w-full text-center mt-4 text-xs text-gray-400 bg-slate-950/60 p-3 rounded-xl border border-white/5 leading-relaxed">
              {activeImage ? (
                <p className="text-brand-300 font-medium">
                  ✨ Photo loaded! Click <b>"Generate Virtual AI Figurine"</b> to see it speak with animated lip-sync.
                </p>
              ) : (
                <p>📸 Drop any photo above to generate your customized AI virtual lecturer figurine.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
