"use client";

import React from "react";
import { ShieldCheck, Video, Cpu, HelpCircle } from "lucide-react";

interface NavbarProps {
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenGuide }) => {
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                VidScribe <span className="text-indigo-400">Matrix</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                v1.0 WASM
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Flash Transcription Powered by YouTube!
            </p>
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Private (Zero Server Upload)</span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>144p 1FPS Turbo WASM</span>
          </div>

          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">YouTube + Hindi Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
