import React, { useState } from "react";
import { generateQuiz } from "../services/api";
import { Trophy, HelpCircle, Loader2, Play, Sparkles, Check, X, AlertCircle, GraduationCap } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function TestGenerator({ quizzes, setQuizzes }) {
  const { currentCourseLang, t } = useLanguage();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({}); // { questionIdx: optionString }
  const [score, setScore] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setError("");
    setGenerating(true);
    setScore(null);
    setShowResults(false);
    setUserAnswers({});

    try {
      const quiz = await generateQuiz(topic, level, numQuestions, currentCourseLang?.speechLang || "English");
      setQuizzes(prev => [quiz, ...prev]);
      setActiveQuiz(quiz);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate customized quiz. Make sure backend is running and Gemini API key is active.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (qIdx, option) => {
    if (showResults) return; // disable editing after submission
    setUserAnswers(prev => ({
      ...prev,
      [qIdx]: option
    }));
  };

  const handleSubmitQuiz = () => {
    // Grade the quiz
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      // exact match of option string
      if (userAns === q.correct_option) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setShowResults(true);
  };

  const handleResetQuiz = () => {
    setActiveQuiz(null);
    setUserAnswers({});
    setScore(null);
    setShowResults(false);
  };

  // 1. If currently taking a quiz
  if (activeQuiz) {
    const isComplete = Object.keys(userAnswers).length === activeQuiz.questions?.length;

    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">Assessing: {activeQuiz.topic}</h1>
            <span className="text-[10px] text-brand-400 font-semibold tracking-wide uppercase">Level: {activeQuiz.level}</span>
          </div>
          <button
            onClick={handleResetQuiz}
            className="text-xs text-gray-500 hover:text-white bg-slate-900 border border-white/5 py-2 px-4 rounded-xl transition-all"
          >
            Exit Quiz
          </button>
        </div>

        {/* Results Overview */}
        {showResults && (
          <div className="glass-panel p-6 rounded-2xl border border-brand-500/20 bg-gradient-to-tr from-brand-950/20 to-slate-950 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-2xl font-extrabold text-white">Quiz Results</h2>
              <p className="text-gray-400 text-sm">
                You scored <span className="text-brand-400 font-bold">{score}</span> out of <span className="text-white font-bold">{activeQuiz.questions?.length}</span> correct answers.
              </p>
              <p className="text-xs text-gray-500">Read through the question analysis below to learn from your mistakes.</p>
            </div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-500 to-blue-500 flex flex-col items-center justify-center shadow-lg shadow-brand-500/10 shrink-0">
              <span className="text-2xl font-extrabold text-white leading-none">{Math.round((score / activeQuiz.questions?.length) * 100)}%</span>
              <span className="text-[10px] font-semibold text-brand-200 mt-1 uppercase tracking-wider">Score</span>
            </div>
          </div>
        )}

        {/* List of Questions */}
        <div className="space-y-6">
          {activeQuiz.questions?.map((question, qIdx) => {
            const selectedOpt = userAnswers[qIdx];
            const isCorrect = selectedOpt === question.correct_option;
            
            return (
              <div
                key={qIdx}
                className={`glass-panel p-6 rounded-xl border transition-all ${
                  showResults
                    ? isCorrect
                      ? "border-brand-500/30 bg-brand-950/5"
                      : "border-red-500/30 bg-red-950/5"
                    : "border-white/5"
                }`}
              >
                {/* Question title */}
                <h3 className="font-bold text-white text-base leading-snug flex items-start gap-3">
                  <span className="text-brand-400 font-extrabold shrink-0">Q{qIdx + 1}.</span>
                  {question.question_text}
                </h3>

                {/* Option grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {question.options?.map((opt, optIdx) => {
                    const isSelected = selectedOpt === opt;
                    const isAnswerKey = question.correct_option === opt;
                    
                    let btnStyle = "bg-slate-950/20 border-white/5 text-gray-300 hover:bg-white/5";
                    if (isSelected) {
                      btnStyle = "bg-brand-500/10 border-brand-500 text-brand-400 font-semibold";
                    }
                    
                    // Style override when results are showing
                    if (showResults) {
                      if (isAnswerKey) {
                        btnStyle = "bg-brand-500/20 border-brand-500 text-brand-300 font-bold";
                      } else if (isSelected && !isCorrect) {
                        btnStyle = "bg-red-500/20 border-red-500 text-red-300 font-bold";
                      } else {
                        btnStyle = "bg-slate-950/40 border-white/5 text-gray-500 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={showResults}
                        onClick={() => handleSelectOption(qIdx, opt)}
                        className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {showResults && isAnswerKey && (
                          <Check className="w-4 h-4 text-brand-500 shrink-0 ml-2" />
                        )}
                        {showResults && isSelected && !isCorrect && (
                          <X className="w-4 h-4 text-red-500 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation container (Only visible after submission) */}
                {showResults && (
                  <div className="mt-5 pt-4 border-t border-white/5 space-y-1.5 text-xs text-gray-400">
                    <p className="font-semibold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Explanation
                    </p>
                    <p className="leading-relaxed">{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit container */}
        {!showResults && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmitQuiz}
              disabled={!isComplete}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl text-sm transition-all shadow-md shadow-brand-500/20"
            >
              Submit Quiz & Grade
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Default screen - Generate New Quiz or list history
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Interactive Assessment Generator</h1>
          <p className="text-gray-400 text-sm mt-1">
            Test your memory and grasp of specific topics. Generate custom mock assessments dynamically.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-xl text-purple-200 text-xs font-semibold">
          <GraduationCap className="w-4 h-4 text-purple-400" />
          <span>Course Language: {currentCourseLang.label}</span>
        </div>
      </div>

      <form onSubmit={handleCreateQuiz} className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Quiz Topic</label>
          <input
            type="text"
            required
            placeholder="e.g. React hooks, Indian History 1947, Thermodynamics basics"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3.5 px-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
            >
              <option value="Easy">Easy (Conceptual review)</option>
              <option value="Medium">Medium (Standard testing)</option>
              <option value="Hard">Hard (Deep analysis & application)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Number of Questions</label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
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
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Gemini is compiling questions, multiple options and explanations...</span>
            </>
          ) : (
            <>
              <Trophy className="w-5 h-5" />
              <span>Generate Customized Assessment</span>
            </>
          )}
        </button>
      </form>

      {/* Quiz History List */}
      {quizzes.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-400" />
            Previous Quizzes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map((quiz, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col justify-between h-36">
                <div>
                  <h4 className="font-bold text-white text-sm truncate">{quiz.topic}</h4>
                  <span className="text-[10px] text-gray-500 mt-1 block">Level: {quiz.level} • {quiz.questions?.length} Questions</span>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => {
                      setActiveQuiz(quiz);
                      setUserAnswers({});
                      setScore(null);
                      setShowResults(false);
                    }}
                    className="bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 text-xs font-bold py-1.5 px-4 rounded-lg transition-all flex items-center gap-2"
                  >
                    <Play className="w-3 h-3 fill-current" /> Retake Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
