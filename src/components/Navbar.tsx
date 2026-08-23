"use client";

import React from "react";
import { ShieldCheck, Video, Cpu, HelpCircle, FileText, Info, Sparkles } from "lucide-react";

interface NavbarProps {
  onOpenGuide?: () => void;
  onOpenLegal: (type: "privacy" | "terms" | "contact" | "sale") => void;
  onScrollToFAQ: () => void;
  onGoHome?: () => void;
  onOpenRenderSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGuide,
  onOpenLegal,
  onScrollToFAQ,
  onGoHome,
  onOpenRenderSettings,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/90 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name (Clickable) */}
        <button
          onClick={onGoHome}
          className="flex items-center space-x-3 text-left focus:outline-none hover:opacity-90 transition-opacity cursor-pointer"
          title="Return to Home Pipeline Selection"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/25 text-white font-bold text-lg ring-2 ring-indigo-500/30">
            <Video className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold font-poppins bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                <span className="font-black text-white">VidFlash</span>
                <span className="text-indigo-400 font-extrabold">.in</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold font-poppins tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                v2.5
              </span>
            </div>
            <p className="text-xs font-semibold font-openSans text-slate-400 hidden sm:block">
              Videos on Flash!
            </p>
          </div>
        </button>

        {/* Badges & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Private</span>
          </div>

          <button
            onClick={onScrollToFAQ}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>FAQ</span>
          </button>

          <button
            onClick={onOpenRenderSettings}
            className="relative group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-bold shadow-lg shadow-indigo-500/15 transition-all transform hover:scale-105 cursor-pointer"
            title="Open Video Render Settings"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent font-bold">
              Render Settings
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
