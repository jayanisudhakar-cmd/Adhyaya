import React from "react";
import { useAuth } from "../context/AuthContext";
import { 
  GraduationCap, 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  UserCheck, 
  LogOut,
  Sparkles
} from "lucide-react";

export default function Layout({ children, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "courses", label: "My Courses", icon: BookOpen },
    { id: "quizzes", label: "Test Series", icon: Trophy },
    { id: "avatar", label: "AI Teacher Avatar", icon: UserCheck },
  ];

  return (
    <div className="min-h-screen flex text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between hidden md:flex z-10">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center shadow-lg shadow-brand-500/10 font-black text-lg">
              अ
            </div>
            <div>
              <h2 className="font-extrabold text-white tracking-tight leading-none text-base">Adhyaya</h2>
              <span className="text-[10px] text-brand-400 font-semibold tracking-wider uppercase">AI Academy</span>
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
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center font-bold text-white text-sm">
              अ
            </div>
            <span className="font-bold text-white tracking-tight">Adhyaya</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400 animate-pulse" />
            <span className="text-xs text-gray-400">Personalized Learning Dashboard</span>
          </div>

          {/* Mobile Profile & Logout */}
          <div className="flex items-center gap-4">
            {/* Quick Mobile Navigation */}
            <div className="flex md:hidden gap-1 bg-slate-900/50 p-1 rounded-lg border border-white/5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`p-2 rounded-md ${isActive ? "bg-brand-500 text-white" : "text-gray-400"}`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-gray-400 hidden sm:inline">Signed in as <b className="text-white">{user?.displayName}</b></span>
            <button
              onClick={logout}
              className="md:hidden p-2 text-gray-400 hover:text-red-400"
              title="Logout"
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
