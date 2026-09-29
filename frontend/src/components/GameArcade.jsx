import React, { useState, useEffect } from "react";
import { 
  Gamepad2, 
  Sparkles, 
  Trophy, 
  Star, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Check, 
  ArrowRight, 
  HelpCircle, 
  Mic, 
  MicOff, 
  Shuffle, 
  Lightbulb, 
  Award,
  Layers,
  BookOpen,
  Compass
} from "lucide-react";

// Web Audio API sound generator for instant, self-contained game audio
const playAudioFeedback = (type = "success") => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "success") {
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
      });
    } else if (type === "step") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 580;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "hop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (err) {
    // Audio autoplay blocked or not available
  }
};

// Web Speech API text-to-speech helper
const speakAloud = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    v => v.lang.includes("en-IN") || v.name.includes("India") || v.lang.includes("en-GB") || v.lang.includes("en-US")
  );
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
};

/* =========================================================================
   GAME 1: Math Safari — Visual Number Adventures (Crafted for Dyscalculia)
   ========================================================================= */
function MathSafariGame({ onEarnScore, soundEnabled }) {
  const [level, setLevel] = useState(0); // 0: Balance Scale, 1: Number Line Hop, 2: Grouping Orchard
  const [stage, setStage] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [hopperPosition, setHopperPosition] = useState(0);

  // Level 1: Balance Scale challenges (visual gems balancing)
  const balanceChallenges = [
    {
      leftGems: 7, // visual dots
      leftText: "7 Glowing Power Gems",
      rightExisting: 3,
      needed: 4,
      options: [4, 3, 5],
      hint: "Count the gems on the left (7). The right scale has 3. How many more gems will make the scale level?"
    },
    {
      leftGems: 9,
      leftText: "9 Crystal Stars",
      rightExisting: 5,
      needed: 4,
      options: [2, 4, 6],
      hint: "Left side has 9 stars. Right side currently has 5. We need 4 more to balance!"
    },
    {
      leftGems: 10,
      leftText: "10 Energy Orbs",
      rightExisting: 6,
      needed: 4,
      options: [5, 4, 3],
      hint: "Ten on the left. Six on the right. 6 + 4 = 10!"
    }
  ];

  // Level 2: Number Line Frog Hop challenges
  const hopChallenges = [
    {
      start: 5,
      jump: 4,
      target: 9,
      options: [8, 9, 10],
      story: "Start at Lily Pad 5. Hop forward 4 times (+4). Where does Froggy land?"
    },
    {
      start: 7,
      jump: 6,
      target: 13,
      options: [12, 13, 15],
      story: "Start at Lily Pad 7. Leap forward 6 times (+6). Where does Froggy land?"
    },
    {
      start: 9,
      jump: 5,
      target: 14,
      options: [13, 14, 16],
      story: "Start at Lily Pad 9. Leap forward 5 times (+5). Where does Froggy land?"
    }
  ];

  // Level 3: Visual Grouping Orchard
  const groupingChallenges = [
    {
      groups: 3,
      itemsPerGroup: 4,
      total: 12,
      itemName: "Golden Mangoes",
      itemIcon: "🥭",
      options: [10, 12, 14],
      story: "Guru Ji placed 3 baskets. Each basket has 4 golden mangoes! How many mangoes altogether?"
    },
    {
      groups: 4,
      itemsPerGroup: 3,
      total: 12,
      itemName: "Crisp Samosas",
      itemIcon: "🥟",
      options: [9, 12, 15],
      story: "4 plates on the dining table. Each plate holds 3 crisp samosas! How many in total?"
    },
    {
      groups: 5,
      itemsPerGroup: 2,
      total: 10,
      itemName: "Spicy Laddoos",
      itemIcon: "🧆",
      options: [8, 10, 12],
      story: "5 sweet boxes with 2 delicious sweets each! How many total treats?"
    }
  ];

  const currentBalance = balanceChallenges[stage % balanceChallenges.length];
  const currentHop = hopChallenges[stage % hopChallenges.length];
  const currentGrouping = groupingChallenges[stage % groupingChallenges.length];

  const handleSelectBalance = (val) => {
    setSelectedAnswer(val);
    if (val === currentBalance.needed) {
      setIsCorrect(true);
      if (soundEnabled) playAudioFeedback("success");
      speakAloud(`Great job! Seven equals three plus four. The scale is in perfect balance!`);
      onEarnScore(25);
    } else {
      setIsCorrect(false);
      if (soundEnabled) playAudioFeedback("step");
      speakAloud("Try again! Count the gems on both sides.");
    }
  };

  const handleSelectHop = (val) => {
    setSelectedAnswer(val);
    if (val === currentHop.target) {
      setIsCorrect(true);
      setHopperPosition(currentHop.target);
      if (soundEnabled) playAudioFeedback("hop");
      speakAloud(`Super jump! Landing smoothly on lily pad ${currentHop.target}!`);
      onEarnScore(25);
    } else {
      setIsCorrect(false);
      if (soundEnabled) playAudioFeedback("step");
    }
  };

  const handleSelectGrouping = (val) => {
    setSelectedAnswer(val);
    if (val === currentGrouping.total) {
      setIsCorrect(true);
      if (soundEnabled) playAudioFeedback("success");
      speakAloud(`Spot on! ${currentGrouping.groups} times ${currentGrouping.itemsPerGroup} equals ${currentGrouping.total}!`);
      onEarnScore(25);
    } else {
      setIsCorrect(false);
      if (soundEnabled) playAudioFeedback("step");
    }
  };

  const handleNextStage = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowHint(false);
    setStage(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Level Selector Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-white/5">
        {[
          { id: 0, title: "⚖️ Gem Balance Scale", desc: "Equalize quantities visually" },
          { id: 1, title: "🐸 Lily Pad Hop", desc: "Number line visual jumps" },
          { id: 2, title: "🧺 Grouping Orchard", desc: "Multiplication with visual baskets" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setLevel(item.id);
              setSelectedAnswer(null);
              setIsCorrect(null);
              setShowHint(false);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
              level === item.id 
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10" 
                : "bg-slate-900/40 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <div>{item.title}</div>
            <div className="text-[10px] text-gray-500 font-normal">{item.desc}</div>
          </button>
        ))}
      </div>

      {/* Mode 0: Visual Gem Balance */}
      {level === 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                ⚖️
              </span>
              <div>
                <h4 className="text-white font-bold text-sm">Balance the Energy Scale</h4>
                <p className="text-[11px] text-gray-400">Match the visual gems on both pans to level the beam.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowHint(!showHint);
                speakAloud(currentBalance.hint);
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
              {showHint ? "Hide Clue" : "Need a Clue?"}
            </button>
          </div>

          {showHint && (
            <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl text-xs text-blue-200">
              💡 {currentBalance.hint}
            </div>
          )}

          {/* Animated Scale Viewport */}
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-white/5 relative flex flex-col items-center">
            {/* The Beam */}
            <div 
              className={`w-full max-w-md h-3 rounded-full transition-transform duration-500 relative flex items-center justify-between ${
                isCorrect === true 
                  ? "bg-emerald-500 shadow-lg shadow-emerald-500/20 rotate-0" 
                  : selectedAnswer 
                    ? "bg-amber-500 -rotate-3" 
                    : "bg-blue-600 -rotate-3"
              }`}
            >
              {/* Fulcrum Point */}
              <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-4 h-5 bg-white rounded-full shadow-md z-10"></div>
              
              {/* Left Pan */}
              <div className="absolute -left-2 top-3 flex flex-col items-center">
                <div className="w-0.5 h-8 bg-blue-400/60"></div>
                <div className="w-28 p-3 bg-blue-950/80 border-2 border-blue-400/50 rounded-xl shadow-lg flex flex-col items-center">
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-[80px] min-h-[40px] items-center">
                    {Array.from({ length: currentBalance.leftGems }).map((_, i) => (
                      <span key={i} className="w-3.5 h-3.5 rounded-full bg-blue-400 shadow-md shadow-blue-400/50 animate-pulse"></span>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-blue-200 mt-2">{currentBalance.leftGems} Gems</span>
                </div>
              </div>

              {/* Right Pan */}
              <div className="absolute -right-2 top-3 flex flex-col items-center">
                <div className="w-0.5 h-8 bg-purple-400/60"></div>
                <div className="w-28 p-3 bg-purple-950/80 border-2 border-purple-400/50 rounded-xl shadow-lg flex flex-col items-center">
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-[80px] min-h-[40px] items-center">
                    {Array.from({ length: currentBalance.rightExisting }).map((_, i) => (
                      <span key={i} className="w-3.5 h-3.5 rounded-full bg-purple-400 shadow-md shadow-purple-400/50"></span>
                    ))}
                    {selectedAnswer && (
                      Array.from({ length: selectedAnswer }).map((_, i) => (
                        <span key={`added-${i}`} className={`w-3.5 h-3.5 rounded-full shadow-md ${isCorrect ? "bg-emerald-400 shadow-emerald-400/50" : "bg-amber-400"}`}></span>
                      ))
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-purple-200 mt-2">
                    {currentBalance.rightExisting} + {selectedAnswer !== null ? selectedAnswer : "?"}
                  </span>
                </div>
              </div>
            </div>

            {/* Fulcrum Stand */}
            <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[36px] border-b-slate-700 mt-4"></div>
            <div className="w-24 h-2.5 bg-slate-800 rounded-full mt-0.5"></div>
          </div>

          {/* Option Selector Cards */}
          <div className="space-y-3 pt-2">
            <p className="text-xs text-center text-gray-300 font-semibold">
              Select the matching gem plate to balance the right pan:
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {currentBalance.options.map((val) => {
                const isThis = selectedAnswer === val;
                return (
                  <button
                    key={val}
                    onClick={() => handleSelectBalance(val)}
                    disabled={isCorrect === true}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all transform hover:scale-105 active:scale-95 ${
                      isThis && isCorrect === true
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/20"
                        : isThis && isCorrect === false
                          ? "bg-red-500/20 border-red-500 text-red-200"
                          : "bg-slate-900 border-white/10 hover:border-blue-500/40 text-white"
                    }`}
                  >
                    <div className="flex gap-1 justify-center flex-wrap max-w-[60px]">
                      {Array.from({ length: val }).map((_, i) => (
                        <span key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                      ))}
                    </div>
                    <span className="text-base font-extrabold">{val}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Success Banner */}
          {isCorrect === true && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="text-xs font-bold text-emerald-200">Balanced Perfectly!</p>
                  <p className="text-[11px] text-emerald-400">+25 Knowledge XP Earned</p>
                </div>
              </div>
              <button
                onClick={handleNextStage}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
              >
                Next Scale <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 1: Lily Pad Hop */}
      {level === 1 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                🐸
              </span>
              <div>
                <h4 className="text-white font-bold text-sm">Lily Pad Number Line Hop</h4>
                <p className="text-[11px] text-gray-400">Hop along the numbered pads to calculate the target destination!</p>
              </div>
            </div>
            <button
              onClick={() => speakAloud(currentHop.story)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg border border-emerald-500/20"
              title="Hear problem aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-center">
            <p className="text-sm font-semibold text-emerald-200">{currentHop.story}</p>
          </div>

          {/* Interactive Lily Pad Pond */}
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-white/5 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-[550px] justify-between py-6 relative">
              {Array.from({ length: 16 }).map((_, idx) => {
                const num = idx;
                const isStart = num === currentHop.start;
                const isTarget = num === currentHop.target;
                const hasHopper = hopperPosition === num || (!hopperPosition && isStart);

                return (
                  <div key={num} className="flex flex-col items-center relative">
                    {/* Frog indicator */}
                    {hasHopper && (
                      <div className="absolute -top-7 text-xl animate-bounce">
                        🐸
                      </div>
                    )}
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isStart 
                          ? "bg-amber-500/30 border-2 border-amber-400 text-amber-200" 
                          : isTarget && isCorrect
                            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/50 scale-110"
                            : "bg-slate-900 border border-white/10 text-gray-400"
                      }`}
                    >
                      {num}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multiple Choice Hops */}
          <div className="space-y-3">
            <p className="text-xs text-center text-gray-400 font-medium">Where will Froggy land after {currentHop.jump} hops?</p>
            <div className="flex justify-center gap-4">
              {currentHop.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectHop(opt)}
                  disabled={isCorrect === true}
                  className={`px-6 py-3 rounded-xl border text-sm font-black transition-all ${
                    selectedAnswer === opt && isCorrect === true
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : selectedAnswer === opt && isCorrect === false
                        ? "bg-red-500/20 border-red-500 text-red-300"
                        : "bg-slate-900 border-white/10 hover:border-emerald-500/30 text-white"
                  }`}
                >
                  Lily Pad {opt}
                </button>
              ))}
            </div>
          </div>

          {isCorrect === true && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-200">🎉 Splendid Leap! +25 XP</span>
              <button
                onClick={handleNextStage}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                Next Jump <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Visual Grouping Orchard */}
      {level === 2 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                🧺
              </span>
              <div>
                <h4 className="text-white font-bold text-sm">Snack Box Grouping Orchard</h4>
                <p className="text-[11px] text-gray-400">See multiplication as repeated visual clusters.</p>
              </div>
            </div>
            <button
              onClick={() => speakAloud(currentGrouping.story)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-amber-500/20"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl text-center">
            <p className="text-sm font-semibold text-amber-200">{currentGrouping.story}</p>
          </div>

          {/* Visual Clusters */}
          <div className="flex flex-wrap items-center justify-center gap-4 py-4">
            {Array.from({ length: currentGrouping.groups }).map((_, groupIdx) => (
              <div 
                key={groupIdx}
                className="p-4 bg-slate-950/70 border-2 border-amber-500/30 rounded-2xl flex flex-col items-center gap-2 shadow-lg"
              >
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  Basket #{groupIdx + 1}
                </span>
                <div className="flex gap-1.5 text-2xl">
                  {Array.from({ length: currentGrouping.itemsPerGroup }).map((_, itemIdx) => (
                    <span key={itemIdx} className="hover:scale-125 transition-transform cursor-pointer">
                      {currentGrouping.itemIcon}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-gray-400 font-mono font-semibold">
                  ({currentGrouping.itemsPerGroup} items)
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-xs text-center text-gray-300 font-semibold">
              How many {currentGrouping.itemName} in all {currentGrouping.groups} baskets?
            </p>
            <div className="flex justify-center gap-4">
              {currentGrouping.options.map((val) => (
                <button
                  key={val}
                  onClick={() => handleSelectGrouping(val)}
                  disabled={isCorrect === true}
                  className={`px-6 py-3 rounded-xl border text-sm font-black transition-all ${
                    selectedAnswer === val && isCorrect === true
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : selectedAnswer === val && isCorrect === false
                        ? "bg-red-500/20 border-red-500 text-red-300"
                        : "bg-slate-900 border-white/10 hover:border-amber-500/30 text-white"
                  }`}
                >
                  {val} {currentGrouping.itemName}
                </button>
              ))}
            </div>
          </div>

          {isCorrect === true && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-200">
                🎉 Delicious Count! {currentGrouping.groups} × {currentGrouping.itemsPerGroup} = {currentGrouping.total}!
              </span>
              <button
                onClick={handleNextStage}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                Next Orchard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   GAME 2: Word Explorer — Sound & Letter Quest (Crafted for Dyslexia)
   ========================================================================= */
function WordExplorerGame({ onEarnScore, soundEnabled }) {
  const [mode, setMode] = useState(0); // 0: Sound & Spell, 1: Letter Spotlight (b/d reversals), 2: Rhyme Catch
  const [wordIndex, setWordIndex] = useState(0);
  const [placedLetters, setPlacedLetters] = useState([]);
  const [availableLetters, setAvailableLetters] = useState([]);
  const [isWordComplete, setIsWordComplete] = useState(false);
  const [spotlightAnswer, setSpotlightAnswer] = useState(null);
  const [spotlightCorrect, setSpotlightCorrect] = useState(null);
  const [rhymeAnswer, setRhymeAnswer] = useState(null);
  const [rhymeCorrect, setRhymeCorrect] = useState(null);

  // Sound & Spell puzzle list
  const wordsList = [
    {
      word: "SOLAR",
      clue: "Belonging to or derived from the radiant sun!",
      meaning: "Solar energy powers clean energy grids across India.",
      phonics: "S - O - L - A - R"
    },
    {
      word: "BHARAT",
      clue: "The ancient, proud Sanskrit name for India!",
      meaning: "A vibrant land of culture, science, and languages.",
      phonics: "B - H - A - R - A - T"
    },
    {
      word: "PLANET",
      clue: "A large celestial body orbiting around a star in space.",
      meaning: "Earth, Mars, Jupiter and Venus are wonderful planets.",
      phonics: "P - L - A - N - E - T"
    },
    {
      word: "BRAIN",
      clue: "The amazing organ that thinks, creates, and learns!",
      meaning: "Every brain learns differently with its own superpower.",
      phonics: "B - R - A - I - N"
    },
    {
      word: "LIGHT",
      clue: "Natural illumination that lets our eyes see colors.",
      meaning: "Photons travel at 300,000 kilometers per second.",
      phonics: "L - I - G - H - T"
    }
  ];

  // Letter Spotlight challenges (Addresses b/d, p/q confusion without stigmatizing)
  const spotlightChallenges = [
    {
      targetLetter: "b",
      missingWord: "_ I R D",
      context: "A feathered friend that chirps high in trees.",
      options: [
        { letter: "b", hint: "Letter 'b' has a tall bat with a ball facing forward (right)" },
        { letter: "d", hint: "Letter 'd' has a drum on the left with a stick" }
      ],
      completedWord: "BIRD"
    },
    {
      targetLetter: "d",
      missingWord: "_ U C K",
      context: "A yellow feathered swimmer that quacks happily.",
      options: [
        { letter: "b", hint: "Starts facing right" },
        { letter: "d", hint: "Round drum body first, then tall stick" }
      ],
      completedWord: "DUCK"
    },
    {
      targetLetter: "p",
      missingWord: "_ L A N T",
      context: "A leafy green living organism that gives oxygen.",
      options: [
        { letter: "p", hint: "Tail hangs low below the line" },
        { letter: "q", hint: "Tail points to the right" }
      ],
      completedWord: "PLANT"
    }
  ];

  // Rhyme and Phonics matches
  const rhymeChallenges = [
    {
      prompt: "Find the word that sounds and rhymes with 'LIGHT'",
      options: ["BRIGHT", "STONE", "RIVER"],
      correct: "BRIGHT"
    },
    {
      prompt: "Find the word that sounds and rhymes with 'STAR'",
      options: ["GUITAR", "WATER", "PLANET"],
      correct: "GUITAR"
    },
    {
      prompt: "Find the word that sounds and rhymes with 'TRAIN'",
      options: ["RAIN", "APPLE", "WIND"],
      correct: "RAIN"
    }
  ];

  const currentWordObj = wordsList[wordIndex % wordsList.length];
  const currentSpotlight = spotlightChallenges[wordIndex % spotlightChallenges.length];
  const currentRhyme = rhymeChallenges[wordIndex % rhymeChallenges.length];

  // Initialize scrambled letters when wordIndex changes
  useEffect(() => {
    if (mode === 0) {
      const letters = currentWordObj.word.split("");
      // Scramble letters with indices
      const scrambled = letters
        .map((char, originalIndex) => ({ char, id: `${char}-${originalIndex}-${Math.random()}` }))
        .sort(() => Math.random() - 0.5);
      
      setAvailableLetters(scrambled);
      setPlacedLetters([]);
      setIsWordComplete(false);
    }
  }, [wordIndex, mode]);

  const handleTileClick = (letterObj) => {
    if (isWordComplete) return;

    if (soundEnabled) playAudioFeedback("step");
    speakAloud(letterObj.char);

    const nextPlaced = [...placedLetters, letterObj];
    setPlacedLetters(nextPlaced);
    setAvailableLetters(prev => prev.filter(item => item.id !== letterObj.id));

    // Check if finished
    const formedWord = nextPlaced.map(item => item.char).join("");
    if (formedWord.length === currentWordObj.word.length) {
      if (formedWord === currentWordObj.word) {
        setIsWordComplete(true);
        if (soundEnabled) playAudioFeedback("success");
        speakAloud(`Brilliant! The word is ${currentWordObj.word}! ${currentWordObj.meaning}`);
        onEarnScore(30);
      } else {
        speakAloud("Almost there! Try removing a tile to adjust.");
      }
    }
  };

  const handleRemovePlaced = (letterObj) => {
    if (isWordComplete) return;
    setPlacedLetters(prev => prev.filter(item => item.id !== letterObj.id));
    setAvailableLetters(prev => [...prev, letterObj]);
    if (soundEnabled) playAudioFeedback("step");
  };

  const handleSpotlightSelect = (choice) => {
    setSpotlightAnswer(choice);
    if (choice === currentSpotlight.targetLetter) {
      setSpotlightCorrect(true);
      if (soundEnabled) playAudioFeedback("success");
      speakAloud(`Spot on! '${currentSpotlight.completedWord}' is the exact word!`);
      onEarnScore(25);
    } else {
      setSpotlightCorrect(false);
      if (soundEnabled) playAudioFeedback("step");
    }
  };

  const handleRhymeSelect = (choice) => {
    setRhymeAnswer(choice);
    speakAloud(choice);
    if (choice === currentRhyme.correct) {
      setRhymeCorrect(true);
      if (soundEnabled) playAudioFeedback("success");
      speakAloud(`Perfect harmony! '${choice}' rhymes delightfully!`);
      onEarnScore(25);
    } else {
      setRhymeCorrect(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-white/5">
        {[
          { id: 0, title: "🔤 Sound & Spell Quest", desc: "Listen, tap letters & build words" },
          { id: 1, title: "🔍 Letter Spotlight", desc: "Shape & direction detective" },
          { id: 2, title: "🎶 Rhyme Matcher", desc: "Auditory vowel harmony" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setMode(item.id);
              setPlacedLetters([]);
              setIsWordComplete(false);
              setSpotlightAnswer(null);
              setSpotlightCorrect(null);
              setRhymeAnswer(null);
              setRhymeCorrect(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
              mode === item.id 
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10" 
                : "bg-slate-900/40 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <div>{item.title}</div>
            <div className="text-[10px] text-gray-500 font-normal">{item.desc}</div>
          </button>
        ))}
      </div>

      {/* Mode 0: Sound & Spell Quest */}
      {mode === 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                🔤
              </span>
              <div>
                <h4 className="text-white font-bold text-sm">Assemble the Mystery Word</h4>
                <p className="text-[11px] text-gray-400">Large, high-readability letter tiles with spoken phonics.</p>
              </div>
            </div>
            <button
              onClick={() => speakAloud(`The word is ${currentWordObj.word}. Clue: ${currentWordObj.clue}`)}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs px-3.5 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-2 transition-all font-semibold"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              Listen to Word
            </button>
          </div>

          {/* Clue Box */}
          <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-2xl text-center space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Mystery Clue</span>
            <p className="text-sm font-semibold text-amber-200">"{currentWordObj.clue}"</p>
          </div>

          {/* Target Slots for Placed Letters */}
          <div className="flex justify-center gap-3 py-4">
            {Array.from({ length: currentWordObj.word.length }).map((_, idx) => {
              const placed = placedLetters[idx];
              return (
                <button
                  key={idx}
                  onClick={() => placed && handleRemovePlaced(placed)}
                  className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                    placed
                      ? isWordComplete
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20"
                        : "bg-slate-800 border-amber-400 text-white shadow-md hover:bg-red-950/30 hover:border-red-400 cursor-pointer"
                      : "bg-slate-950/60 border-dashed border-white/20 text-gray-600"
                  }`}
                  title={placed ? "Click to remove tile" : "Empty slot"}
                >
                  {placed ? placed.char : ""}
                </button>
              );
            })}
          </div>

          {/* Scrambled Available Letters */}
          <div className="space-y-3">
            <p className="text-xs text-center text-gray-400">
              Tap the letter tiles in order to spell the word:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {availableLetters.map((item) => {
                const isVowel = ["A", "E", "I", "O", "U"].includes(item.char);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTileClick(item)}
                    className={`w-13 h-15 px-4 py-3 rounded-2xl border text-xl font-black shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 ${
                      isVowel
                        ? "bg-blue-950/80 border-blue-400/50 text-blue-200 hover:bg-blue-900/90"
                        : "bg-slate-900/90 border-white/10 text-white hover:border-amber-400/50"
                    }`}
                  >
                    {item.char}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Completion Celebration */}
          {isWordComplete && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌟</span>
                <div>
                  <h5 className="text-xs font-bold text-emerald-200">Word Decoded: {currentWordObj.word}!</h5>
                  <p className="text-[11px] text-emerald-400">{currentWordObj.meaning}</p>
                </div>
              </div>
              <button
                onClick={() => setWordIndex(prev => prev + 1)}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                Next Word <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 1: Letter Spotlight */}
      {mode === 1 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                🔍
              </span>
              <div>
                <h4 className="text-white font-bold text-sm">Letter Spotlight Detective</h4>
                <p className="text-[11px] text-gray-400">Distinguish letter shapes and facing directions with visual cues.</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 text-center space-y-3">
            <span className="text-xs text-gray-400">{currentSpotlight.context}</span>
            <div className="text-3xl font-black text-white tracking-widest font-mono">
              {currentSpotlight.missingWord}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-center text-gray-300 font-semibold">Which letter correctly completes the word?</p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {currentSpotlight.options.map((opt) => (
                <button
                  key={opt.letter}
                  onClick={() => handleSpotlightSelect(opt.letter)}
                  className={`p-5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    spotlightAnswer === opt.letter && spotlightCorrect === true
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-200"
                      : spotlightAnswer === opt.letter && spotlightCorrect === false
                        ? "bg-red-500/20 border-red-500 text-red-200"
                        : "bg-slate-900 border-white/10 hover:border-purple-400/40 text-white"
                  }`}
                >
                  <span className="text-4xl font-black">{opt.letter}</span>
                  <span className="text-[10px] text-gray-400 text-center">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {spotlightCorrect === true && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-200">
                🎉 Perfect! Word completed: {currentSpotlight.completedWord}! +25 XP
              </span>
              <button
                onClick={() => {
                  setWordIndex(prev => prev + 1);
                  setSpotlightAnswer(null);
                  setSpotlightCorrect(null);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                Next Word <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Rhyme Matcher */}
      {mode === 2 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm">
                🎶
              </span>
              <div>
                <h4 className="text-white font-bold text-sm">Rhyme & Sound Catch</h4>
                <p className="text-[11px] text-gray-400">Match vowel patterns and sounds through hearing.</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-pink-950/20 border border-pink-500/20 rounded-2xl text-center">
            <p className="text-sm font-semibold text-pink-200">{currentRhyme.prompt}</p>
          </div>

          <div className="flex justify-center gap-4">
            {currentRhyme.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleRhymeSelect(opt)}
                className={`px-6 py-4 rounded-2xl border text-sm font-black transition-all ${
                  rhymeAnswer === opt && rhymeCorrect === true
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : rhymeAnswer === opt && rhymeCorrect === false
                      ? "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-slate-900 border-white/10 hover:border-pink-500/30 text-white"
                }`}
              >
                🔊 {opt}
              </button>
            ))}
          </div>

          {rhymeCorrect === true && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-200">
                🎉 Wonderful ear for rhyme! +25 XP
              </span>
              <button
                onClick={() => {
                  setWordIndex(prev => prev + 1);
                  setRhymeAnswer(null);
                  setRhymeCorrect(null);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                Next Rhyme <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   GAME 3: Story Studio — Tap, Talk & Build (Crafted for Dysgraphia)
   ========================================================================= */
function StoryStudioGame({ onEarnScore, soundEnabled }) {
  const [mode, setMode] = useState(0); // 0: Sentence Block Puzzle, 1: Tap & Speak Voice Story, 2: Tale Spinner
  const [stage, setStage] = useState(0);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [isSentenceBuilt, setIsSentenceBuilt] = useState(false);

  // Voice speech-to-text state
  const [isListening, setIsListening] = useState(false);
  const [dictatedText, setDictatedText] = useState("");
  const [voiceWords, setVoiceWords] = useState([]);

  // Tale spinner choices
  const [hero, setHero] = useState("Captain Astro 🚀");
  const [superpower, setSuperpower] = useState("making chai with laser eyes ☕");
  const [adventure, setAdventure] = useState("exploring the rings of Saturn 🪐");
  const [storyGenerated, setStoryGenerated] = useState(false);

  // Sentence building puzzles with color-coded grammar blocks
  const sentencePuzzles = [
    {
      expectedOrder: [
        { text: "A clever Indian scientist", role: "Who (Character)", color: "from-amber-500/20 border-amber-500/40 text-amber-200" },
        { text: "launched a solar rover", role: "What happened (Action)", color: "from-emerald-500/20 border-emerald-500/40 text-emerald-200" },
        { text: "to explore the craters of the Moon", role: "Where (Place)", color: "from-blue-500/20 border-blue-500/40 text-blue-200" }
      ]
    },
    {
      expectedOrder: [
        { text: "The friendly Bengal tiger", role: "Who (Character)", color: "from-amber-500/20 border-amber-500/40 text-amber-200" },
        { text: "solved a challenging math puzzle", role: "What happened (Action)", color: "from-emerald-500/20 border-emerald-500/40 text-emerald-200" },
        { text: "underneath the great Banyan tree", role: "Where (Place)", color: "from-blue-500/20 border-blue-500/40 text-blue-200" }
      ]
    },
    {
      expectedOrder: [
        { text: "An inventive young coder", role: "Who (Character)", color: "from-amber-500/20 border-amber-500/40 text-amber-200" },
        { text: "programmed a talking robot", role: "What happened (Action)", color: "from-emerald-500/20 border-emerald-500/40 text-emerald-200" },
        { text: "to deliver hot samosas to students", role: "Where (Place)", color: "from-blue-500/20 border-blue-500/40 text-blue-200" }
      ]
    }
  ];

  const currentPuzzle = sentencePuzzles[stage % sentencePuzzles.length];

  // Scramble blocks whenever puzzle changes
  useEffect(() => {
    if (mode === 0) {
      const scrambled = [...currentPuzzle.expectedOrder]
        .map((block, i) => ({ ...block, id: `${block.text}-${i}` }))
        .sort(() => Math.random() - 0.5);
      setAvailableBlocks(scrambled);
      setSelectedBlocks([]);
      setIsSentenceBuilt(false);
    }
  }, [stage, mode]);

  const handleSelectBlock = (block) => {
    if (isSentenceBuilt) return;
    if (soundEnabled) playAudioFeedback("step");
    speakAloud(block.text);

    const nextSelected = [...selectedBlocks, block];
    setSelectedBlocks(nextSelected);
    setAvailableBlocks(prev => prev.filter(b => b.id !== block.id));

    // Check if sentence complete
    if (nextSelected.length === currentPuzzle.expectedOrder.length) {
      // Check order
      const correct = nextSelected.every((b, idx) => b.text === currentPuzzle.expectedOrder[idx].text);
      if (correct) {
        setIsSentenceBuilt(true);
        if (soundEnabled) playAudioFeedback("success");
        const full = nextSelected.map(b => b.text).join(" ") + ".";
        speakAloud(`Magnificent sentence! ${full}`);
        onEarnScore(30);
      } else {
        speakAloud("Almost! Click a block to remove it and try another order.");
      }
    }
  };

  const handleRemoveBlock = (block) => {
    if (isSentenceBuilt) return;
    setSelectedBlocks(prev => prev.filter(b => b.id !== block.id));
    setAvailableBlocks(prev => [...prev, block]);
    if (soundEnabled) playAudioFeedback("step");
  };

  // Speech Recognition for Dysgraphia hands-free voice dictation
  const handleToggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition isn't supported on this browser. Try Chrome or Edge, or use our 1-click Story Spinner!");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setDictatedText(text);
        const words = text.split(" ").filter(w => w.trim().length > 0);
        setVoiceWords(words);
        setIsListening(false);
        if (soundEnabled) playAudioFeedback("success");
        speakAloud(`Great storytelling! You said: ${text}`);
        onEarnScore(35);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const handleGenerateTale = () => {
    setStoryGenerated(true);
    if (soundEnabled) playAudioFeedback("success");
    const fullStory = `Once upon a time in Bengaluru, ${hero} was famous for ${superpower}. One fine morning, our hero embarked on an epic journey ${adventure}! Everyone celebrated with hot jalebis and cheered with joy!`;
    speakAloud(fullStory);
    onEarnScore(30);
  };

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-white/5">
        {[
          { id: 0, title: "🧩 Sentence Puzzle Studio", desc: "Build stories with 1-click word blocks" },
          { id: 1, title: "🎙️ Voice Storyteller", desc: "Speak and watch words assemble automatically" },
          { id: 2, title: "✨ Tale Spinner", desc: "Craft epic adventures with zero typing" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setMode(item.id);
              setSelectedBlocks([]);
              setIsSentenceBuilt(false);
              setStoryGenerated(false);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
              mode === item.id 
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10" 
                : "bg-slate-900/40 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            <div>{item.title}</div>
            <div className="text-[10px] text-gray-500 font-normal">{item.desc}</div>
          </button>
        ))}
      </div>

      {/* Mode 0: Sentence Block Puzzle */}
      {mode === 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                🧩
              </span>
              <div>
                <h4 className="text-white font-bold text-sm">Story Block Architecture</h4>
                <p className="text-[11px] text-gray-400">Assemble thoughts effortlessly without fine-motor typing fatigue.</p>
              </div>
            </div>
            <button
              onClick={() => {
                const text = selectedBlocks.map(b => b.text).join(" ");
                if (text) speakAloud(text);
              }}
              disabled={selectedBlocks.length === 0}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg border border-purple-500/20 disabled:opacity-40"
              title="Hear current sentence aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas for Selected Chunks */}
          <div className="min-h-[100px] p-5 bg-slate-950/70 border-2 border-dashed border-white/20 rounded-2xl flex flex-wrap items-center gap-3 justify-center">
            {selectedBlocks.length === 0 ? (
              <span className="text-xs text-gray-500 italic">
                Tap the story blocks below to snap them into your complete sentence...
              </span>
            ) : (
              selectedBlocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => handleRemoveBlock(block)}
                  className={`px-4 py-2.5 rounded-xl border bg-gradient-to-r ${block.color} font-semibold text-xs transition-all shadow-md hover:opacity-80`}
                  title="Click to remove from canvas"
                >
                  {block.text}
                </button>
              ))
            )}
          </div>

          {/* Available Blocks to Pick */}
          <div className="space-y-3">
            <p className="text-xs text-center text-gray-400">Available Story Chunks (Tap in logical order):</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {availableBlocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => handleSelectBlock(block)}
                  className={`px-4 py-3 rounded-xl border bg-slate-900 border-white/10 hover:border-purple-400/60 text-white font-semibold text-xs shadow-md transition-all transform hover:-translate-y-1`}
                >
                  <span className="block text-[9px] text-gray-400 font-bold uppercase">{block.role}</span>
                  <span>{block.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Success Banner */}
          {isSentenceBuilt && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h5 className="text-xs font-bold text-emerald-200">Story Piece Crafted!</h5>
                  <p className="text-[11px] text-emerald-400">Clean sentence structure with zero handwriting strain. +30 XP</p>
                </div>
              </div>
              <button
                onClick={() => setStage(prev => prev + 1)}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                Next Story <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 1: Voice Storyteller (Speech-to-Text) */}
      {mode === 1 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                🎙️
              </span>
              <div>
                <h4 className="text-white font-bold text-sm">Voice Storyteller Studio</h4>
                <p className="text-[11px] text-gray-400">Express thoughts naturally with voice dictation—words assemble in real time.</p>
              </div>
            </div>
          </div>

          <div className="text-center py-6 space-y-4">
            <button
              onClick={handleToggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all shadow-xl ${
                isListening
                  ? "bg-red-500 text-white animate-pulse shadow-red-500/50 scale-110"
                  : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 hover:scale-105"
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="text-xs font-bold text-white">
              {isListening ? "Listening... Speak your creative story sentence now!" : "Click to Speak Your Story Idea"}
            </p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              For example: "A clever monkey discovered a hidden telescope on Mount Everest."
            </p>
          </div>

          {/* Generated Word Blocks from Voice */}
          {voiceWords.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-emerald-300 text-center">
                ✨ Transcribed Voice Story Blocks:
              </p>
              <div className="flex flex-wrap gap-2 justify-center p-4 bg-slate-950/60 rounded-2xl border border-white/5">
                {voiceWords.map((w, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-bold shadow-sm"
                  >
                    {w}
                  </span>
                ))}
              </div>
              <div className="text-center">
                <button
                  onClick={() => speakAloud(dictatedText)}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs px-4 py-2 rounded-xl border border-emerald-500/30 inline-flex items-center gap-2"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Hear Guru Ji Read Your Story
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Tale Spinner (1-Click Mad-Libs) */}
      {mode === 2 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                ✨
              </span>
              <div>
                <h4 className="text-white font-bold text-sm">1-Click Adventure Spinner</h4>
                <p className="text-[11px] text-gray-400">Choose building blocks to generate a full entertaining adventure tale.</p>
              </div>
            </div>
          </div>

          {/* Hero Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              1. Choose Your Hero:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "Captain Astro 🚀",
                "Detective Chintu 🕵️",
                "Professor Whiskers 🐱"
              ].map(item => (
                <button
                  key={item}
                  onClick={() => setHero(item)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    hero === item 
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm" 
                      : "bg-slate-900 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Superpower Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              2. Choose Their Unique Superpower:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "making chai with laser eyes ☕",
                "talking to supercomputers 💻",
                "running at warp speed ⚡"
              ].map(item => (
                <button
                  key={item}
                  onClick={() => setSuperpower(item)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    superpower === item 
                      ? "bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm" 
                      : "bg-slate-900 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Mission Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              3. Choose The Epic Mission:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                "exploring the rings of Saturn 🪐",
                "finding the Golden Samosa Recipe 🥟",
                "building a floating space school 🛸"
              ].map(item => (
                <button
                  key={item}
                  onClick={() => setAdventure(item)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    adventure === item 
                      ? "bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm" 
                      : "bg-slate-900 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleGenerateTale}
              className="bg-gradient-to-r from-amber-500 to-purple-500 hover:from-amber-400 hover:to-purple-400 text-black font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              ✨ Spin My Story Now!
            </button>
          </div>

          {storyGenerated && (
            <div className="p-6 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">📖 The Tale of {hero}</span>
                <button
                  onClick={() => speakAloud(`Once upon a time, ${hero} who had the superpower of ${superpower}, set out on an adventure ${adventure}!`)}
                  className="p-1.5 bg-slate-800 text-amber-300 rounded-lg hover:bg-slate-700"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Once upon a time in Bengaluru, <strong>{hero}</strong> was celebrated far and wide for <strong>{superpower}</strong>. One fine morning, our hero embarked on an epic journey <strong>{adventure}</strong>! Along the way, they met Guru Ji, who handed them a plate of piping-hot samosas and congratulated them on solving the universe's greatest mystery!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   MAIN GAME ARCADE CONTAINER (Clean, engaging, zero clinical labeling)
   ========================================================================= */
export default function GameArcade({ initialGame = "math" }) {
  const [activeGame, setActiveGame] = useState(initialGame); // "math", "words", "story"
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scoreXP, setScoreXP] = useState(() => {
    return parseInt(localStorage.getItem("adhyaya_game_xp") || "150", 10);
  });

  const handleEarnScore = (points) => {
    setScoreXP(prev => {
      const next = prev + points;
      localStorage.setItem("adhyaya_game_xp", String(next));
      return next;
    });
  };

  const gameNav = [
    {
      id: "math",
      title: "Learn Math with Games",
      tagline: "Visual Gem Balance & Number Line Hops",
      icon: "🔢",
      color: "from-blue-500/20 border-blue-500/30 text-blue-300"
    },
    {
      id: "words",
      title: "Word Explorer & Sound Quests",
      tagline: "Letter Spotlights, Phonics & Rhymes",
      icon: "🔤",
      color: "from-amber-500/20 border-amber-500/30 text-amber-300"
    },
    {
      id: "story",
      title: "Story Crafter Studio",
      tagline: "Tap, Talk & Build Stories Without Typing",
      icon: "✍️",
      color: "from-purple-500/20 border-purple-500/30 text-purple-300"
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Arcade Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 border border-white/10 bg-gradient-to-r from-slate-900 via-brand-950/20 to-slate-900 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-brand-500/20 border border-brand-500/30 px-3 py-1 rounded-full text-xs font-semibold text-brand-300">
              <Gamepad2 className="w-3.5 h-3.5 text-brand-400" />
              Adhyaya Play & Learn Arcade
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Learn Concepts Through <span className="text-gradient-brand">Interactive Play</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
              Explore visual math puzzles, phonics mysteries, and hands-free story builders designed to make understanding effortless, joyful, and deeply intuitive!
            </p>
          </div>

          {/* Gamification Stats Bar */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="glass-panel p-3 px-4 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
                🏆
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total XP Earned</p>
                <p className="text-lg font-black text-amber-300">{scoreXP} XP</p>
              </div>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 rounded-2xl bg-slate-900 border border-white/10 text-gray-300 hover:text-white hover:bg-slate-800 transition-all"
              title={soundEnabled ? "Mute audio effects" : "Enable audio effects"}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-brand-400" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gameNav.map((game) => {
          const isActive = activeGame === game.id;
          return (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                isActive
                  ? `bg-gradient-to-tr ${game.color} shadow-lg shadow-brand-500/10 scale-[1.02]`
                  : "bg-slate-900/60 border-white/5 hover:border-white/20 text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{game.icon}</span>
                {isActive && (
                  <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-white">
                    Now Playing
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">{game.title}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{game.tagline}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Game Viewport */}
      <div>
        {activeGame === "math" && (
          <MathSafariGame 
            onEarnScore={handleEarnScore} 
            soundEnabled={soundEnabled} 
          />
        )}
        {activeGame === "words" && (
          <WordExplorerGame 
            onEarnScore={handleEarnScore} 
            soundEnabled={soundEnabled} 
          />
        )}
        {activeGame === "story" && (
          <StoryStudioGame 
            onEarnScore={handleEarnScore} 
            soundEnabled={soundEnabled} 
          />
        )}
      </div>
    </div>
  );
}
