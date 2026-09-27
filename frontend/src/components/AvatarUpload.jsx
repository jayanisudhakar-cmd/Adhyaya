import React, { useState } from "react";
import { generateAvatarVideo } from "../services/api";
import { Upload, User, Volume2, Sparkles, Loader2, Play, Check } from "lucide-react";

const DEFAULT_AVATARS = [
  { id: "sarah", name: "Sarah (Math & Sci)", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face" },
  { id: "john", name: "John (Tech & Coding)", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face" },
  { id: "emily", name: "Emily (Languages & Arts)", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face" },
  { id: "david", name: "David (History & Business)", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face" }
];

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Warm, Professional)", gender: "Female" },
  { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew (Energetic, Tech)", gender: "Male" },
  { id: "2EiwWnXF2V4j9tZO7GCz", name: "Clyde (Calm, Academic)", gender: "Male" },
  { id: "piYVMnqqwG45qbS2gnQt", name: "Nicole (Clear, Friendly)", gender: "Female" }
];

export default function AvatarUpload({ avatarConfig, setAvatarConfig, setGlobalAvatarVideo }) {
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [scriptText, setScriptText] = useState("Hello! I am your AI personal tutor on Namma Guru. I will guide you through your personalized courses, helping you learn step-by-step.");
  const [generating, setGenerating] = useState(false);
  const [testVideoUrl, setTestVideoUrl] = useState("");
  const [error, setError] = useState("");

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    setCustomImageUrl("");
    setAvatarConfig(prev => ({
      ...prev,
      imageUrl: avatar.url,
      imageFile: null,
      name: avatar.name
    }));
  };

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
        setError("Only image files (PNG, JPEG) are supported.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    setCustomImageUrl("");
    setSelectedAvatar(null);
    
    const previewUrl = URL.createObjectURL(file);
    setAvatarConfig(prev => ({
      ...prev,
      imageUrl: previewUrl,
      imageFile: file,
      name: file.name.substring(0, 15) || "Uploaded Face"
    }));
  };

  const handleCustomImageSubmit = (e) => {
    e.preventDefault();
    if (customImageUrl.trim()) {
      setSelectedAvatar(null);
      setAvatarConfig(prev => ({
        ...prev,
        imageUrl: customImageUrl.trim(),
        imageFile: null,
        name: "Custom URL Face"
      }));
    }
  };

  const handleVoiceChange = (voice) => {
    setSelectedVoice(voice);
    setAvatarConfig(prev => ({
      ...prev,
      voiceId: voice.id,
      voiceName: voice.name
    }));
  };

  const handleGenerateTestVideo = async () => {
    setError("");
    setGenerating(true);
    
    // Choose file if uploaded, else URL, else default avatar
    const imageSource = avatarConfig.imageFile || customImageUrl.trim() || selectedAvatar?.url;

    if (!imageSource) {
      setError("Please select or upload a face image first.");
      setGenerating(false);
      return;
    }

    try {
      const response = await generateAvatarVideo(imageSource, scriptText, selectedVoice.id);
      if (response.success && response.video_url) {
        setTestVideoUrl(response.video_url);
        setGlobalAvatarVideo(response.video_url);
      } else {
        throw new Error("Invalid response received from server.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate D-ID avatar talk. Check that your backend is running and D-ID / ElevenLabs keys are set in your environment.");
    } finally {
      setGenerating(false);
    }
  };

  const currentImageUrl = avatarConfig.imageUrl || selectedAvatar?.url;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Intro Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Virtual Teacher Avatar</h1>
        <p className="text-gray-400 text-sm mt-2">
          Design your custom AI lecturer. Upload a photo or select a predefined teacher face, choose an ElevenLabs voice, and create the video presentation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Configuration */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Choose Avatar Face */}
          <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-brand-400" />
              1. Choose Teacher Face
            </h2>

            {/* Default Grids */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {DEFAULT_AVATARS.map((avatar) => {
                const isSelected = selectedAvatar?.id === avatar.id && !customImageUrl;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all group ${
                      isSelected 
                        ? "border-brand-500 shadow-md shadow-brand-500/20" 
                        : "border-transparent hover:border-white/20"
                    }`}
                  >
                    <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-2">
                      <span className="text-[10px] font-bold text-white truncate w-full text-left">{avatar.name}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-brand-500 text-white rounded-full p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom file dropzone and URL entry */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Or Upload Local Image / Paste External URL
              </label>

              {/* Drag and Drop Box */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? "border-brand-500 bg-brand-500/10" 
                    : avatarConfig.imageFile 
                      ? "border-brand-500/50 bg-slate-900/40" 
                      : "border-slate-700/60 bg-slate-900/20 hover:border-slate-500"
                }`}
              >
                <input
                  type="file"
                  id="avatar-file-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="avatar-file-upload" className="cursor-pointer space-y-2 block">
                  <div className="mx-auto w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 group-hover:text-white">
                    <Upload className="w-5 h-5" />
                  </div>
                  {avatarConfig.imageFile ? (
                    <div>
                      <p className="text-xs font-bold text-white">Selected: {avatarConfig.imageFile.name}</p>
                      <p className="text-[10px] text-brand-400 mt-1">Drag and drop or click to replace file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-300 font-medium">Drag & drop your face photo here, or <span className="text-brand-400 font-bold hover:underline">browse</span></p>
                      <p className="text-[9px] text-gray-500 mt-1">Supports PNG, JPG, or JPEG up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>

              {/* URL fallback option */}
              <form onSubmit={handleCustomImageSubmit} className="flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste an image URL: https://example.com/face.jpg"
                  value={customImageUrl}
                  onChange={(e) => {
                    setCustomImageUrl(e.target.value);
                  }}
                  className="flex-1 bg-slate-900/60 border border-slate-700/60 rounded-xl py-2.5 px-4 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs border border-white/5 transition-all shrink-0"
                >
                  Apply URL
                </button>
              </form>
            </div>
          </div>

          {/* Section 2: Choose Voice */}
          <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-brand-400" />
              2. Select ElevenLabs Voice
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {VOICES.map((voice) => {
                const isSelected = selectedVoice.id === voice.id;
                return (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceChange(voice)}
                    className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                      isSelected 
                        ? "bg-brand-500/10 border-brand-500" 
                        : "bg-slate-950/20 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-white text-sm">{voice.name}</p>
                      <span className="text-[10px] text-gray-500 mt-1 block">Gender: {voice.gender}</span>
                    </div>
                    {isSelected && (
                      <div className="bg-brand-500 text-white rounded-full p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Test Audio / Intro Script */}
          <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              3. Generate Custom Avatar Welcome Video
            </h2>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Avatar Speech Script</label>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={3}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all resize-none"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              
              <button
                onClick={handleGenerateTestVideo}
                disabled={generating || !scriptText.trim()}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md shadow-brand-500/20 flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Talk Video (Uploading & Polling D-ID API)...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Synthesize Speech & Animate Face Video
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Preview Screen */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col items-center">
            <h3 className="font-bold text-white text-sm mb-4 self-start">Virtual Tutor Profile</h3>

            {/* Profile Avatar Card Preview */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] w-full max-w-[280px] bg-slate-900 border border-white/10 shadow-lg group">
              {testVideoUrl ? (
                <video
                  src={testVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <img
                    src={currentImageUrl}
                    alt="Teacher Portrait"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-4">
                    <p className="text-white font-bold text-base">{customImageUrl ? "Custom Teacher" : selectedAvatar.name}</p>
                    <p className="text-brand-300 text-xs mt-1 font-medium flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-brand-400" />
                      Voice: {selectedVoice.name.split(" ")[0]}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="w-full text-center mt-5 text-xs text-gray-500 bg-slate-950/40 p-3 rounded-lg border border-white/5 leading-relaxed">
              {testVideoUrl ? (
                <p className="text-brand-300 font-medium">✨ Talk Video Active! This avatar will present your generated course content.</p>
              ) : (
                <p>📸 Standard avatar preview. Click "Synthesize Speech" to generate an active talking video file using ElevenLabs and D-ID.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
