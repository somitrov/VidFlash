import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  BookOpen,
  Chrome,
  FileText,
  Layers,
  ArrowRight,
} from "lucide-react";

interface DoodleMasterPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoodleMasterPromptModal: React.FC<DoodleMasterPromptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [promptText, setPromptText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load prompt text from public masterprompt asset
  useEffect(() => {
    if (isOpen && !promptText) {
      setLoading(true);
      fetch("/masterprompts/DOODLE_IMAGE_MAKER_MASTER_PROMPT.md")
        .then((res) => res.text())
        .then((text) => {
          setPromptText(text);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, promptText]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!promptText) return;
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/masterprompts/DOODLE_IMAGE_MAKER_MASTER_PROMPT.md";
    link.download = "DOODLE_IMAGE_MAKER_MASTER_PROMPT.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#111116] border border-[#2b2b36] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#2b2b36] bg-[#16161d] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide truncate">
                  Google Flow Master Prompt — Whiteboard Doodle Maker
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                  Master Prompt v2
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Generate 100% style-consistent whiteboard images for Google Flow & TryAIToday AutoEditor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#22222c] hover:bg-[#2e2e3b] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm">
          {/* Quick Start Workflow Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                  <Chrome className="w-3.5 h-3.5 text-amber-400" />
                  <span>Step 1: Extension</span>
                </div>
                <div className="text-xs font-semibold text-white mt-1.5">
                  TryAIToday Flow Automator
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Install the official TryAIToday Flow Automator extension for Google Chrome to automate Google Flow image generation.
                </p>
              </div>
              <a
                href="https://chromewebstore.google.com/detail/tryaitoday-flow-automator/bcmmekkamenpjoogmegiffgemlgikbgf?utm_source=item-share-cb"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-all"
              >
                <span>Get TryAIToday Extension</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Step 2: Copy Prompt</span>
                </div>
                <div className="text-xs font-semibold text-white mt-1.5">
                  Paste Into Google Flow
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Copy the full Master Prompt below into Google Flow alongside your timestamped voiceover script. Recommended to use with the TryAIToday extension to get images automatically.
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="mt-3 inline-flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-medium transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Master Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Step 3: VidFlash Auto-Sync</span>
                </div>
                <div className="text-xs font-semibold text-white mt-1.5">
                  Drop & Animate in VidFlash
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Drop timecode-named images (e.g. <code className="text-amber-300">00_00.png</code>) into VidFlash and toggle Doodle Flash for stroke-by-stroke animation!
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="mt-3 inline-flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-medium transition-all cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download .MD File</span>
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300">
                Master Prompt Instructions & Guidelines
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1f1f2a] hover:bg-[#2a2a3a] border border-[#3a3a4c] text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copy Full Prompt</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Master Prompt (.md)</span>
              </button>
            </div>
          </div>

          {/* Code/Prompt Viewer */}
          <div className="relative rounded-xl border border-[#2b2b36] bg-[#09090c] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#121217] border-b border-[#22222d] text-xs text-slate-400 font-mono">
              <span>DOODLE_IMAGE_MAKER_MASTER_PROMPT.md</span>
              <span>{promptText ? `${(promptText.length / 1024).toFixed(1)} KB` : "Loading..."}</span>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[340px] leading-relaxed whitespace-pre-wrap selection:bg-amber-500/30 selection:text-white">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-500 space-x-2">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Loading Master Prompt...</span>
                </div>
              ) : (
                promptText || "Master prompt file ready for download."
              )}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2b2b36] bg-[#16161d] flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Optimized for Google Flow with TryAIToday Flow Automator</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#22222c] hover:bg-[#2d2d3a] text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
