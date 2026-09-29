import React from "react";
import { useNeuro } from "../context/NeuroContext";
import { 
  Sparkles, 
  Eye, 
  Calculator, 
  Zap, 
  Feather, 
  Mic, 
  Sliders, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2
} from "lucide-react";

export default function NeuroInclusionHub({ onOpenArcade }) {
  const { 
    neuroMode, 
    setNeuroMode, 
    profiles, 
    readingRuler, 
    toggleReadingRuler,
    focusTimerActive,
    toggleFocusTimer,
    resetFocusTimer,
    focusSeconds
  } = useNeuro();

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getProfileIcon = (id) => {
    switch (id) {
      case "dyslexia": return <Eye className="w-4 h-4 text-amber-400" />;
      case "dyscalculia": return <Calculator className="w-4 h-4 text-blue-400" />;
      case "adhd": return <Zap className="w-4 h-4 text-yellow-400" />;
      case "sensory": return <Feather className="w-4 h-4 text-emerald-400" />;
      case "dysgraphia": return <Mic className="w-4 h-4 text-purple-400" />;
      default: return <Sparkles className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center text-xs">
            ✨
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight leading-none">Neuro-Inclusion Hub</h3>
            <span className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider">Adaptive Learning</span>
          </div>
        </div>
        <span className="text-[10px] bg-slate-900 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full font-medium">
          Unified UI
        </span>
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Select your learning profile. The entire Adhyaya interface instantly reconfigures to support your cognitive needs:
      </p>

      {/* Profile Selector Buttons */}
      <div className="space-y-1.5">
        {profiles.map((p) => {
          const isActive = neuroMode === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setNeuroMode(p.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs ${
                isActive
                  ? "bg-gradient-to-r from-brand-500/20 to-blue-500/15 border border-brand-500/40 text-white shadow-sm shadow-brand-500/10 font-bold"
                  : "bg-slate-900/40 border border-white/5 text-gray-400 hover:text-white hover:bg-slate-900/80"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">{p.icon}</span>
                <div className="truncate">
                  <span className="block font-semibold truncate leading-snug">{p.name}</span>
                  <span className="text-[10px] text-gray-500 block truncate font-normal">{p.tagline}</span>
                </div>
              </div>
              {isActive && <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 ml-1" />}
            </button>
          );
        })}
      </div>

      {/* Dynamic Specialized Toolkits */}
      <div className="pt-3 border-t border-white/5 space-y-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
          Active Mode Assist
        </span>

        {neuroMode === "dyslexia" && (
          <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-200 font-semibold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Reading Ruler Guide
              </span>
              <button
                onClick={toggleReadingRuler}
                className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                  readingRuler 
                    ? "bg-amber-500 text-black" 
                    : "bg-slate-800 text-gray-400 hover:text-white"
                }`}
              >
                {readingRuler ? "Active" : "Enable"}
              </button>
            </div>
            <p className="text-[10px] text-amber-300/80 leading-normal">
              High-readability Lexend font applied. Mouse tracking ruler guides your focus across lines.
            </p>
          </div>
        )}

        {neuroMode === "adhd" && (
          <div className="p-3 bg-yellow-950/30 border border-yellow-500/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-yellow-200 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> 10-Min Focus Sprint
              </span>
              <span className="font-mono text-xs font-bold text-yellow-300">
                {formatTimer(focusSeconds)}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={toggleFocusTimer}
                className="flex-1 py-1 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
              >
                {focusTimerActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {focusTimerActive ? "Pause" : "Start Sprint"}
              </button>
              <button
                onClick={resetFocusTimer}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 text-[10px] transition-all"
                title="Reset timer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {neuroMode === "dyscalculia" && (
          <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl space-y-1">
            <span className="text-xs text-blue-200 font-semibold flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Visual Chunking
            </span>
            <p className="text-[10px] text-blue-300/80 leading-normal">
              Dense numerical walls replaced with visual analogies, diagrams, and step-by-step breakdowns.
            </p>
          </div>
        )}

        {neuroMode === "sensory" && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-1">
            <span className="text-xs text-emerald-200 font-semibold flex items-center gap-1.5">
              <Feather className="w-3.5 h-3.5" /> Calm Sensory Mode
            </span>
            <p className="text-[10px] text-emerald-300/80 leading-normal">
              Harsh blue light and jarring animations disabled. Muted, soft-contrast palette active.
            </p>
          </div>
        )}

        {neuroMode === "dysgraphia" && (
          <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl space-y-1">
            <span className="text-xs text-purple-200 font-semibold flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Voice Dictation Ready
            </span>
            <p className="text-[10px] text-purple-300/80 leading-normal">
              Large 1-click selectable options active. Speak answers using speech recognition.
            </p>
          </div>
        )}

        {neuroMode === "standard" && (
          <p className="text-[10px] text-gray-500 italic">
            Select any profile above to customize typography, contrast, timers, and pacing instantly.
          </p>
        )}
      </div>

      {/* Play & Learn Interactive Games Section */}
      <div className="pt-3 border-t border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Play & Practice Quests
          </span>
          <span className="text-[9px] bg-brand-500/20 text-brand-300 font-bold px-1.5 py-0.5 rounded">
            Interactive
          </span>
        </div>
        <p className="text-[10px] text-gray-400 leading-snug">
          Reinforce concepts with fun game quests designed for natural, stress-free mastery:
        </p>
        <div className="grid grid-cols-1 gap-1.5 pt-1">
          <button
            onClick={() => onOpenArcade && onOpenArcade("math")}
            className="p-2 rounded-xl bg-slate-900/60 border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-950/30 flex items-center justify-between text-left transition-all text-xs group"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">⚖️</span>
              <div>
                <span className="font-bold text-white text-[11px] block group-hover:text-blue-300">Learn Math with Games</span>
                <span className="text-[9px] text-gray-500 block">Visual scales & number line hops</span>
              </div>
            </div>
            <span className="text-[10px] text-blue-400 font-bold">Play →</span>
          </button>
          <button
            onClick={() => onOpenArcade && onOpenArcade("words")}
            className="p-2 rounded-xl bg-slate-900/60 border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-950/30 flex items-center justify-between text-left transition-all text-xs group"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🔤</span>
              <div>
                <span className="font-bold text-white text-[11px] block group-hover:text-amber-300">Word Explorer & Sounds</span>
                <span className="text-[9px] text-gray-500 block">Letter spotlights & phonics quests</span>
              </div>
            </div>
            <span className="text-[10px] text-amber-400 font-bold">Play →</span>
          </button>
          <button
            onClick={() => onOpenArcade && onOpenArcade("story")}
            className="p-2 rounded-xl bg-slate-900/60 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-950/30 flex items-center justify-between text-left transition-all text-xs group"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">✍️</span>
              <div>
                <span className="font-bold text-white text-[11px] block group-hover:text-purple-300">Story Crafter Studio</span>
                <span className="text-[9px] text-gray-500 block">Tap, talk & build with zero typing</span>
              </div>
            </div>
            <span className="text-[10px] text-purple-400 font-bold">Play →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
