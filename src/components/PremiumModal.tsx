"use client";

import React from "react";
import { Sparkles, Crown, Zap, ShieldCheck, CheckCircle2, X } from "lucide-react";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  VidFlash Premium
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Pro Tier
                </span>
              </div>
              <p className="text-xs text-slate-400">Unlock maximum hardware power & studio mastery</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coming Soon Hero Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-indigo-500/10 border border-amber-500/25 text-center space-y-2 relative overflow-hidden">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            <span>Pricings Are Coming Soon</span>
          </div>

          <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
            Stay Tuned for Pro Creator Tiers! 🚀
          </h4>

          <p className="text-slate-300 text-xs leading-relaxed max-w-md mx-auto">
            VidFlash is currently <strong className="text-emerald-400">100% free</strong> with unlimited local client-side rendering. We are preparing tailored premium plans with high-tier perks for power creators and studios.
          </p>
        </div>

        {/* Feature Teasers */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            What's coming in VidFlash Premium:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start space-x-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">Turbo WASM Engine</span>
                <span className="text-slate-400 text-[11px]">Multi-threaded SIMD acceleration</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">4K UHD Cinema Master</span>
                <span className="text-slate-400 text-[11px]">Uncompressed bitrate output</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">VIP Transition Suite</span>
                <span className="text-slate-400 text-[11px]">Exclusive broadcast-grade VFX</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">Priority Support</span>
                <span className="text-slate-400 text-[11px]">Direct developer access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer text-center"
          >
            Got It, Back to Editor
          </button>
        </div>
      </div>
    </div>
  );
};
