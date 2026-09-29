import React, { createContext, useContext, useState, useEffect } from "react";

const NeuroContext = createContext(null);

export const NEURO_PROFILES = [
  {
    id: "standard",
    name: "Standard",
    icon: "🧠",
    tagline: "Balanced multimedia learning",
    description: "Default personalized learning interface with standard spacing and animation."
  },
  {
    id: "dyslexia",
    name: "Dyslexia",
    icon: "📖",
    tagline: "High readability typography",
    description: "Lexend font, enlarged character & line spacing, tracking ruler, and high contrast."
  },
  {
    id: "dyscalculia",
    name: "Dyscalculia",
    icon: "🔢",
    tagline: "Visual math breakdowns",
    description: "Step-by-step visual number chunking, math helpers, and zero dense formula walls."
  },
  {
    id: "adhd",
    name: "ADHD",
    icon: "⚡",
    tagline: "High-focus micro sessions",
    description: "Distraction dimming, crisp bullet chunking, 10-min Pomodoro timer, and streak milestones."
  },
  {
    id: "sensory",
    name: "Sensory Issues",
    icon: "🌿",
    tagline: "Low sensory calm mode",
    description: "Soft muted tones, reduced contrast glare, zero jarring flashes, and optional calm soundscape."
  },
  {
    id: "dysgraphia",
    name: "Dysgraphia",
    icon: "✍️",
    tagline: "Voice-first & 1-click answers",
    description: "Speech-to-text dictation, large clickable cards, and auto-formatted notes without typing stress."
  }
];

export function NeuroProvider({ children }) {
  const [neuroMode, setNeuroModeState] = useState(() => {
    return localStorage.getItem("adhyaya_neuro_mode") || "standard";
  });

  const [readingRuler, setReadingRuler] = useState(false);

  // Clear any persistent ruler toggle from storage so it does not auto-activate
  useEffect(() => {
    localStorage.removeItem("adhyaya_ruler");
  }, []);

  const [rulerY, setRulerY] = useState(200);
  const [focusTimerActive, setFocusTimerActive] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(600); // 10 minutes default
  const [soundscapeActive, setSoundscapeActive] = useState(false);

  // Apply body classes whenever neuroMode changes
  useEffect(() => {
    document.body.classList.remove(
      "mode-standard",
      "mode-dyslexia",
      "mode-dyscalculia",
      "mode-adhd",
      "mode-sensory",
      "mode-dysgraphia"
    );
    document.body.classList.add(`mode-${neuroMode}`);
    localStorage.setItem("adhyaya_neuro_mode", neuroMode);
  }, [neuroMode]);

  // Track mouse for Reading Ruler
  useEffect(() => {
    if (!readingRuler) return;
    const handleMouseMove = (e) => {
      setRulerY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [readingRuler]);

  // Focus Timer for ADHD mode
  useEffect(() => {
    let interval = null;
    if (focusTimerActive && focusSeconds > 0) {
      interval = setInterval(() => {
        setFocusSeconds((prev) => prev - 1);
      }, 1000);
    } else if (focusSeconds === 0) {
      setFocusTimerActive(false);
      alert("🎉 Guru Ji says: Shabash! Your 10-minute sprint is complete. Take a 2-minute stretch or chai break!");
      setFocusSeconds(600);
    }
    return () => clearInterval(interval);
  }, [focusTimerActive, focusSeconds]);

  const setNeuroMode = (mode) => {
    setNeuroModeState(mode);
  };

  const toggleReadingRuler = () => {
    setReadingRuler((prev) => !prev);
  };

  const toggleFocusTimer = () => {
    setFocusTimerActive((prev) => !prev);
  };

  const resetFocusTimer = () => {
    setFocusTimerActive(false);
    setFocusSeconds(600);
  };

  return (
    <NeuroContext.Provider
      value={{
        neuroMode,
        setNeuroMode,
        profiles: NEURO_PROFILES,
        readingRuler,
        toggleReadingRuler,
        rulerY,
        focusTimerActive,
        toggleFocusTimer,
        resetFocusTimer,
        focusSeconds,
        soundscapeActive,
        setSoundscapeActive
      }}
    >
      {readingRuler && (
        <div
          className="reading-ruler flex items-center justify-between px-6 pointer-events-none"
          style={{ top: `${Math.max(0, rulerY - 20)}px` }}
          aria-hidden="true"
        >
          <span className="text-[10px] font-bold text-amber-300/80 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            📖 Focus Line Guide
          </span>
          <button
            onClick={toggleReadingRuler}
            className="text-[10px] bg-slate-900 text-white hover:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40 pointer-events-auto cursor-pointer shadow-lg"
          >
            ✕ Dismiss
          </button>
        </div>
      )}
      {children}
    </NeuroContext.Provider>
  );
}

export function useNeuro() {
  const context = useContext(NeuroContext);
  if (!context) {
    throw new Error("useNeuro must be used within a NeuroProvider");
  }
  return context;
}
