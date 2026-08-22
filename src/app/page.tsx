"use client";

import React, { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { FAQSection, AboutSection, LegalModal } from "@/components/LegalContent";
import { ShieldCheck, Cpu, Video, FileText, Lock, Mail, Mic, PlaySquare } from "lucide-react";
import { VidFlashFlow } from "@/components/VidFlashFlow";
import { VidFlashAutoEditor } from "@/components/autoeditor/VidFlashAutoEditor";

export default function Home() {
  const [mode, setMode] = useState<"gateway" | "vidflash" | "audiobook">("gateway");
  const [legalModalType, setLegalModalType] = useState<"privacy" | "terms" | "contact" | "sale" | null>(null);

  const faqRef = useRef<HTMLDivElement>(null);

  const scrollToFAQ = () => {
    faqRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-subtle-glow" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-subtle-glow" />
      <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar (Sticky) */}
      <Navbar
        onOpenGuide={() => {}}
        onOpenLegal={(type) => setLegalModalType(type)}
        onScrollToFAQ={scrollToFAQ}
        onGoHome={() => setMode("gateway")}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-12">
        
        {mode === "gateway" && (
          <div className="flex flex-col items-center justify-center space-y-8 mt-12 mb-24">
            <div className="text-center space-y-4 max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 text-transparent bg-clip-text">
                Select Your Pipeline
              </h1>
              <p className="text-slate-400 text-lg">
                Choose the workflow that best fits your content creation needs. Both run entirely in your browser with zero server uploads.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              {/* AutoEditor Card */}
              <button 
                onClick={() => setMode("audiobook")}
                className="group relative bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/25 text-white font-bold ring-2 ring-indigo-500/30 mb-2">
                    <Video className="w-8 h-8 text-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-200">AutoEditor</h2>
                  <p className="text-slate-400">
                    Auto-sync a folder of images to an audio voiceover using timestamp metadata. Finished video in seconds, no manual timeline dragging.
                  </p>
                </div>
              </button>

              {/* Audiobook Maker Card */}
              <button 
                onClick={() => setMode("vidflash")}
                className="group relative bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:border-indigo-500/50 transition-all duration-300 text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2 overflow-hidden shadow-lg shadow-red-500/10">
                    <img src="/YouTube.webp" alt="YouTube" className="w-10 h-10 object-contain" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-200">VidMaker</h2>
                  <p className="text-slate-400">
                    Convert audiobooks, podcasts, and recordings into YouTube-ready MP4s with custom static banners. Perfect for long-form audio with zero server upload.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === "vidflash" && (
          <div className="space-y-4">
            <button onClick={() => setMode("gateway")} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center mb-4">
              &larr; Back to Pipeline Selection
            </button>
            <VidFlashFlow />
          </div>
        )}

        {mode === "audiobook" && (
          <div className="space-y-4">
            <button onClick={() => setMode("gateway")} className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center mb-4">
              &larr; Back to Pipeline Selection
            </button>
            <div className="border border-slate-800 rounded-2xl bg-slate-900/50 p-4 sm:p-6 min-h-[80vh]">
               <VidFlashAutoEditor />
            </div>
          </div>
        )}

        {/* About VidFlash Section */}
        <AboutSection />

        {/* FAQ Section */}
        <div ref={faqRef}>
          <FAQSection />
        </div>
      </main>

      {/* Footer with Legal Compliance Links */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-8 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">
              VidFlash.in
            </span>
            <span>— 100% In-Browser Media Converter</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <button
              onClick={() => setLegalModalType("privacy")}
              className="hover:text-indigo-300 transition-colors flex items-center space-x-1"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privacy Policy</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setLegalModalType("terms")}
              className="hover:text-indigo-300 transition-colors flex items-center space-x-1"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Terms of Service</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setLegalModalType("contact")}
              className="hover:text-indigo-300 transition-colors flex items-center space-x-1"
            >
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              <span>Contact & Support</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Server Privacy</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Legal Popover Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
        onSwitchType={(type) => setLegalModalType(type)}
      />
    </div>
  );
}
