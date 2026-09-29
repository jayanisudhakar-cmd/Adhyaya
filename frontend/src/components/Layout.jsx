import React from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { 
  GraduationCap, 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  UserCheck, 
  LogOut,
  Sparkles,
  Gamepad2,
  Globe
} from "lucide-react";

export default function Layout({ children, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { 
    navLanguage, 
    setNavLanguage, 
    courseLanguage, 
    setCourseLanguage, 
    t, 
    NAVIGATION_LANGUAGES, 
    COURSE_LANGUAGES 
  } = useLanguage();

  const menuItems = [
    { id: "dashboard", label: t("navDashboard"), icon: LayoutDashboard },
    { id: "courses", label: t("navCourses"), icon: BookOpen },
    { id: "quizzes", label: t("navQuizzes"), icon: Trophy },
    { id: "arcade", label: t("navArcade"), icon: Gamepad2 },
    { id: "avatar", label: t("navAvatar"), icon: UserCheck },
  ];

  return (
    <div className="min-h-screen flex text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between hidden md:flex z-10 shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center shadow-lg shadow-brand-500/10 font-black text-lg">
              अ
            </div>
            <div>
              <h2 className="font-extrabold text-white tracking-tight leading-none text-base">Adhyaya</h2>
              <span className="text-[10px] text-brand-400 font-semibold tracking-wider uppercase">
                {t("platformSubtitle", "AI Academy")}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-gradient-to-r from-brand-500/20 to-blue-500/10 text-white border border-brand-500/20 shadow-md shadow-brand-500/5" 
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-brand-400" : ""}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Panel */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between gap-2 bg-slate-950/40 p-3 rounded-xl border border-white/5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.displayName}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title={t("logout", "Log out")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Bar with Dual Language Selectors */}
        <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-6 z-10 shrink-0 gap-4">
          
          {/* Left: Mobile Logo & Title */}
          <div className="flex items-center gap-3 md:hidden shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center font-bold text-white text-sm">
              अ
            </div>
            <span className="font-bold text-white tracking-tight">Adhyaya</span>
          </div>

          {/* Desktop Tagline */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
            <span className="text-xs text-gray-400">{t("learningDashboard", "Personalized Learning Platform")}</span>
          </div>

          {/* Center / Right: Dual Mode Language Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 ml-auto">
            
            {/* Mode 1: Website Navigation Language */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-blue-500/30 shadow-sm" title={t("navLangDesc")}>
              <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] text-blue-300 font-bold uppercase tracking-wider leading-none hidden sm:block">
                  {t("navLangTitle", "Website Language")}
                </span>
                <select
                  value={navLanguage}
                  onChange={(e) => setNavLanguage(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer py-0.5"
                  aria-label="Website Navigation Language"
                >
                  {NAVIGATION_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id} className="bg-slate-900 text-white">
                      {lang.flag} {lang.nativeName} ({lang.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode 2: Course Content Language */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-purple-500/30 shadow-sm" title={t("courseLangDesc")}>
              <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] text-purple-300 font-bold uppercase tracking-wider leading-none hidden sm:block">
                  {t("courseLangTitle", "Course Language")}
                </span>
                <select
                  value={courseLanguage}
                  onChange={(e) => setCourseLanguage(e.target.value)}
                  className="bg-transparent text-purple-200 text-xs font-semibold focus:outline-none cursor-pointer py-0.5"
                  aria-label="Course Content & Teacher Speech Language"
                >
                  {COURSE_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id} className="bg-slate-900 text-white">
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Navigation Icons */}
            <div className="flex md:hidden gap-1 bg-slate-900/50 p-1 rounded-lg border border-white/5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`p-1.5 rounded-md ${isActive ? "bg-brand-500 text-white" : "text-gray-400"}`}
                    title={item.label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>

            {/* User profile / Log out */}
            <button
              onClick={logout}
              className="md:hidden p-2 text-gray-400 hover:text-red-400"
              title={t("logout", "Logout")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
