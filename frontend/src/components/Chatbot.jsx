import React, { useState, useRef, useEffect } from "react";
import { useNeuro } from "../context/NeuroContext";
import { sendChatMessage } from "../services/api";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Mic, 
  MicOff,
  Minimize2,
  Maximize2
} from "lucide-react";

const QUICK_PROMPTS = [
  { label: "🏏 Cricket Analogy", text: "Explain this concept to me using an exciting cricket match analogy!" },
  { label: "☕ Chai Summary", text: "Give me a 30-second chai-break summary. Crisp, no fluff!" },
  { label: "⚡ 3 Crisp Bullets", text: "Break this down into exactly 3 punchy bullet points." },
  { label: "🎯 Exam Shortcut", text: "Guru Ji, what is the #1 trick to remember this for exams?" }
];

export default function Chatbot() {
  const { neuroMode } = useNeuro();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste beta! I am Guru Ji, your AI Study Mitra. Whether it's quantum physics or basic algebra, ask away! Zero dry lectures, maximum clarity, and a pinch of desi humor.",
      humorNote: "Guru Ji's Rule #1: Why take tension when you can take action?"
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Text-to-Speech (Guru Ji Voice)
  const speakText = (text) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Try to pick an Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang.includes("en-IN") || v.name.includes("India"));
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-Text for Dysgraphia / Voice Answers
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge!");
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
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput("");
    const newHistory = [...messages, { role: "user", content: query }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const historyPayload = newHistory.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(query, historyPayload, neuroMode);
      
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          humorNote: response.humor_note,
          quickTips: response.quick_tips
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Arre re! My internet connection took a brief chai break. But remember: Focus on the basics and try asking once more!",
          humorNote: "Tip: Reconnecting to Guru Ji's cloud frequency..."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 bg-gradient-to-r from-amber-500 via-brand-500 to-blue-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-brand-500/30 hover:scale-105 transition-all border border-white/20"
          aria-label="Open Guru Ji Chatbot"
        >
          <span className="text-2xl group-hover:rotate-12 transition-transform">👳🏽‍♂️</span>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-black tracking-wide leading-tight">GURU JI</p>
            <p className="text-[10px] text-amber-200 font-semibold leading-none">AI Study Mitra • Desi Humor</p>
          </div>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-400"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[420px] glass-panel rounded-3xl border border-white/15 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isMinimized ? "h-16" : "h-[580px] max-h-[85vh]"
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-brand-500 flex items-center justify-center text-xl shadow-md shadow-brand-500/20">
                👳🏽‍♂️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-sm tracking-tight">Guru Ji</h3>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full uppercase">
                    Adhyaya AI Mitra
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 italic">"Why fear when Guru Ji is here?"</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }}
                className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                          isUser
                            ? "bg-brand-500 text-white rounded-br-none shadow-md shadow-brand-500/10 font-medium"
                            : "bg-slate-900/90 border border-white/10 text-gray-200 rounded-bl-none shadow-lg"
                        }`}
                      >
                        {!isUser && (
                          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-2">
                            <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                              👳🏽‍♂️ Guru Ji says:
                            </span>
                            <button
                              onClick={() => speakText(msg.content)}
                              className="text-gray-400 hover:text-brand-300 transition-colors"
                              title="Listen to Guru Ji"
                            >
                              {isSpeaking ? (
                                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}

                        <div className="whitespace-pre-line space-y-1">
                          {msg.content}
                        </div>

                        {msg.humorNote && (
                          <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-amber-300/90 font-semibold italic flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 shrink-0 text-amber-400" />
                            {msg.humorNote}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-slate-900/90 border border-white/10 rounded-2xl rounded-bl-none p-3 text-xs text-gray-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>Guru Ji is brewing a crisp answer...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-4 py-2 bg-slate-950/40 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
                {QUICK_PROMPTS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip.text)}
                    disabled={loading}
                    className="shrink-0 bg-slate-900/80 hover:bg-slate-800 text-gray-300 hover:text-white border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 bg-slate-950/70 border-t border-white/10 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isListening 
                      ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                      : "bg-slate-900 border-white/10 text-gray-400 hover:text-white"
                  }`}
                  title={isListening ? "Listening... click to stop" : "Voice dictation (Speak your doubt)"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    neuroMode === "dyscalculia"
                      ? "Ask about any math step or formula..."
                      : neuroMode === "adhd"
                      ? "Ask a quick question (crisp answers only)..."
                      : "Ask Guru Ji anything (concept, doubt, exam tip)..."
                  }
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-all"
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-md shadow-brand-500/20 transition-all"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
