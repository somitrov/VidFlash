"use client";

import React, { useState, useEffect } from "react";
import { StepProgress } from "@/components/StepProgress";
import { FileIngestion } from "@/components/FileIngestion";
import { CanvasStudio } from "@/components/CanvasStudio";
import { ConvertExport } from "@/components/ConvertExport";
import { MediaFileState, CanvasSettings } from "@/types";

export function VidFlashFlow() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Smoothly scroll and anchor viewport on step transitions
  useEffect(() => {
    if (currentStep === 2) {
      setTimeout(() => {
        document.getElementById("step-2-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } else if (currentStep === 3) {
      setTimeout(() => {
        document.getElementById("step-3-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep]);

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

  // Canvas Overlay Settings
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    preset: "gradient-indigo",
    customBgImage: null,
    overlayOpacity: 0.6,
    resolution: { width: 256, height: 144 },
    resolutionPreset: "144p",
    meetingTitle: "Google Meet Discussion",
    meetingSubtitle: "Hindi/Hinglish Audio Recording • 2026",
    participants: "Hosted by VidFlash.in",
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
    <div className="space-y-12">
      <StepProgress
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
        isMediaLoaded={!!mediaState.file}
      />

      {currentStep === 1 && (
        <FileIngestion
          mediaState={mediaState}
          onMediaLoaded={handleMediaLoaded}
          onNextStep={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <CanvasStudio
          settings={canvasSettings}
          onChangeSettings={(newSettings) => setCanvasSettings(newSettings)}
          onCanvasDataUrlChange={(url) => setCanvasDataUrl(url)}
          onNextStep={() => setCurrentStep(3)}
          onPrevStep={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <ConvertExport
          mediaState={mediaState}
          canvasDataUrl={canvasDataUrl}
          settings={canvasSettings}
          onPrevStep={() => setCurrentStep(2)}
        />
      )}
    </div>
  );
}
