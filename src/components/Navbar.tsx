"use client";

import React from "react";
import { ShieldCheck, Video, Cpu, HelpCircle, FileText, Info } from "lucide-react";

interface NavbarProps {
  onOpenGuide: () => void;
  onOpenLegal: (type: "privacy" | "terms" | "contact") => void;
  onScrollToFAQ: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGuide,
  onOpenLegal,
  onScrollToFAQ,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
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
                <span className="font-black text-white">VidFlash</span>{" "}
                <span className="text-indigo-400 font-extrabold">Matrix</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold font-poppins tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                v1.0 WASM
              </span>
            </div>
            <p className="text-xs font-semibold font-openSans text-slate-400 hidden sm:block">
              Ready for YouTube Now!
            </p>
          </div>
        </div>

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
            onClick={() => onOpenLegal("privacy")}
            className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/40 hover:to-purple-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-all"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">YouTube + Hindi Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
