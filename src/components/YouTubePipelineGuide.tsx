"use client";

import React, { useState } from "react";
import {
  Youtube,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  FileText,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { AdSenseBanner } from "@/components/AdSenseBanner";

interface YouTubePipelineGuideProps {
  onPrevStep?: () => void;
}

export const YouTubePipelineGuide: React.FC<YouTubePipelineGuideProps> = ({
  onPrevStep,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const aiPromptText =
    'This is a Hindi/Hinglish meeting recording transcript. Extract full detailed meeting notes, list every key discussion point step-by-step, highlight major decisions made, and give me a clean list of action items with owners in English.';

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const steps = [
    {
      number: "01",
      title: "Upload MP4 to YouTube Studio",
      desc: "Open YouTube Studio and upload your newly converted MP4 video file.",
      badge: "Set Visibility to UNLISTED or PRIVATE",
      details:
        "By setting your video to Unlisted or Private, your video remains 100% confidential and is never shown publicly or in search results.",
      link: "https://studio.youtube.com",
      linkText: "Open YouTube Studio",
      icon: Youtube,
      color: "from-red-600 to-rose-600",
    },
    {
      number: "02",
      title: "Copy Auto-Generated Hindi Transcript",
      desc: "YouTube will automatically process the audio and generate Hindi/Hinglish subtitles for free.",
      badge: "Zero Length & Size Limits",
      details:
        "Wait a few minutes for processing. Then open your video on YouTube, click the '...' menu below the player, select 'Show transcript', and copy the full text.",
      icon: FileText,
      color: "from-amber-500 to-orange-600",
    },
    {
      number: "03",
      title: "Extract Notes in Google AI Studio / Gemini",
      desc: "Paste the raw transcript into Google AI Studio (aistudio.google.com) or Gemini.",
      badge: "Free Gemini 1.5 Pro / Flash Model",
      details:
        "Gemini inside AI Studio supports Hindi and Hinglish natively with massive context windows (up to 2 million tokens / 10+ hours of speech!).",
      link: "https://aistudio.google.com",
      linkText: "Open Google AI Studio",
      icon: Sparkles,
      color: "from-indigo-600 to-purple-600",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Final Step: Free Hindi Meeting Notes</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
          YouTube + Gemini AI Transcription Pipeline
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Follow these 3 simple steps to convert your uploaded video into complete Hindi meeting notes for free using YouTube & Google AI Studio.
        </p>
      </div>

      {/* Non-intrusive Minimalist Ad Banner */}
      <AdSenseBanner />

      {/* 3 Step Pipeline Grid */}
      <div className="grid grid-cols-1 gap-6">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden transition-all hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-black text-lg shadow-lg shrink-0`}
                  >
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-200">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-400">{step.desc}</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/20 text-xs font-semibold shrink-0">
                  {step.badge}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {step.details}
                </p>

                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>{step.linkText}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Gemini Prompt Card */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-md space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Recommended Gemini Summary Prompt
            </h3>
          </div>

          <button
            onClick={handleCopyPrompt}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-colors"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-200 leading-relaxed">
          "{aiPromptText}"
        </div>
      </div>

      {/* Back Button */}
      {onPrevStep && (
        <div className="flex justify-start">
          <button
            onClick={onPrevStep}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Converter</span>
          </button>
        </div>
      )}
    </div>
  );
};
