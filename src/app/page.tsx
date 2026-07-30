"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { StepProgress } from "@/components/StepProgress";
import { FileIngestion } from "@/components/FileIngestion";
import { CanvasStudio } from "@/components/CanvasStudio";
import { ConvertExport } from "@/components/ConvertExport";
import { YouTubePipelineGuide } from "@/components/YouTubePipelineGuide";
import { MediaFileState, CanvasSettings } from "@/types";
import { ShieldCheck, Cpu, Video } from "lucide-react";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Ingested Media State
  const [mediaState, setMediaState] = useState<MediaFileState>({
    file: null,
    mediaType: null,
    fileName: "",
    fileSize: 0,
    duration: 0,
    formattedDuration: "",
    previewUrl: null,
  });

  // Canvas Overlay Settings — Defaulted to 144p Turbo (256x144) & Direct Audio Copy (-c:a copy)
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    preset: "gradient-indigo",
    customBgImage: null,
    overlayOpacity: 0.6,
    resolution: { width: 256, height: 144 },
    resolutionPreset: "144p",
    meetingTitle: "Google Meet Discussion",
    meetingSubtitle: "Hindi/Hinglish Audio Recording • 2026",
    participants: "Hosted by VidFlash.Hirelancer.in",
    badgeText: "Presented by VidFlash",
    showBadge: true,
    titleColor: "#ffffff",
    subtitleColor: "#cbd5e1",
    badgeColor: "#7c3aed",
    fontSize: "large",
    textAlign: "left",
    template: "google-meet",
    channelLogo: null,
    customBgVideo: null,
    ctaText: "SUBSCRIBE NOW",
    showCta: true,
    showParticles: true,
    audioCopyMode: true,
    frameRate: 1,
  });

  // Data URL exported by CanvasStudio
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>("");

  const handleMediaLoaded = (newMedia: MediaFileState) => {
    setMediaState(newMedia);

    if (newMedia.fileName) {
      const cleanTitle = newMedia.fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      setCanvasSettings((prev) => ({
        ...prev,
        meetingTitle: cleanTitle || "Google Meet Discussion",
        meetingSubtitle: `Recording (${newMedia.formattedDuration}) • Hindi Notes`,
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-subtle-glow" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-subtle-glow" />
      <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <Navbar onOpenGuide={() => setCurrentStep(4)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Step Progress Wizard */}
        <StepProgress
          currentStep={currentStep}
          onSelectStep={(step) => setCurrentStep(step)}
          isMediaLoaded={!!mediaState.file}
        />

        {/* Step 1: File Dropzone & Ingestion */}
        {currentStep === 1 && (
          <FileIngestion
            mediaState={mediaState}
            onMediaLoaded={handleMediaLoaded}
            onNextStep={() => setCurrentStep(2)}
          />
        )}

        {/* Step 2: Canvas Studio & Banner Design */}
        {currentStep === 2 && (
          <CanvasStudio
            settings={canvasSettings}
            onChangeSettings={(newSettings) => setCanvasSettings(newSettings)}
            onCanvasDataUrlChange={(url) => setCanvasDataUrl(url)}
            onNextStep={() => setCurrentStep(3)}
            onPrevStep={() => setCurrentStep(1)}
          />
        )}

        {/* Step 3: FFmpeg WASM Conversion & Download */}
        {currentStep === 3 && (
          <ConvertExport
            mediaState={mediaState}
            canvasDataUrl={canvasDataUrl}
            settings={canvasSettings}
            onNextStep={() => setCurrentStep(4)}
            onPrevStep={() => setCurrentStep(2)}
          />
        )}

        {/* Step 4: YouTube & Gemini Guide */}
        {currentStep === 4 && (
          <YouTubePipelineGuide onPrevStep={() => setCurrentStep(3)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-6 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">
              VidFlash Matrix
            </span>
            <span>— 100% In-Browser Media Converter</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Server Privacy</span>
            </span>
            <span className="flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>144p 1FPS Ultra-Fast FFmpeg</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
