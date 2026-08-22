"use client";

import React from "react";
import { Upload, Palette, Cpu, Sparkles, Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number; // 1, 2, 3, 4
  onSelectStep: (step: number) => void;
  isMediaLoaded: boolean;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  onSelectStep,
  isMediaLoaded,
}) => {
  const steps = [
    {
      id: 1,
      title: "1. Upload Media",
      subtitle: "AAC/MP3/AMR/WAV Ingestion",
      icon: Upload,
    },
    {
      id: 2,
      title: "2. Customize Banner",
      subtitle: "Canvas Overlay",
      icon: Palette,
    },
    {
      id: 3,
      title: "3. Convert & Export",
      subtitle: "FFmpeg WASM Engine",
      icon: Cpu,
    },
  ];

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-8 backdrop-blur-md">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = step.id < currentStep || (step.id === 1 && isMediaLoaded);
          const isDisabled = step.id > 1 && !isMediaLoaded;

          return (
            <button
              key={step.id}
              onClick={() => !isDisabled && onSelectStep(step.id)}
              disabled={isDisabled}
              className={`relative flex items-center p-3 rounded-xl border text-left transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border-indigo-500/80 shadow-lg shadow-indigo-500/10 text-white ring-1 ring-indigo-500/30"
                  : isCompleted
                  ? "bg-slate-900/80 border-emerald-500/40 text-slate-200 hover:bg-slate-800/80"
                  : isDisabled
                  ? "bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-60"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg mr-3 shrink-0 transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : isCompleted
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              <div className="overflow-hidden">
                <div className="text-xs font-semibold truncate leading-tight">
                  {step.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {step.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
