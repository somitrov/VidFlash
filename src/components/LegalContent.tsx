"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  ShieldCheck,
  FileText,
  Info,
  Mail,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Lock,
  Cpu,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "General" | "Privacy" | "Technical" | "YouTube & AI";
}

const faqs: FAQItem[] = [
  {
    category: "Privacy",
    question: "Is my meeting recording video or audio uploaded to any server?",
    answer:
      "No! 100% of the media processing occurs directly inside your web browser using WebAssembly (WASM) & FFmpeg. Your files never leave your computer or phone, guaranteeing zero server upload and absolute privacy for sensitive corporate or academic meetings.",
  },
  {
    category: "Technical",
    question: "Why does VidFlash use 144p resolution at 1 FPS?",
    answer:
      "YouTube auto-transcription requires an uploaded video file, but speech recognition models care only about audio quality, not video resolution. By rendering a static banner frame at 144p resolution and 1 frame per second (1FPS), processing speeds increase up to 50x while reducing output video file size by over 90%.",
  },
  {
    category: "YouTube & AI",
    question: "How does YouTube Hindi/Hinglish auto-transcription work?",
    answer:
      "Once you upload your converted MP4 to YouTube Studio (set to Unlisted or Private visibility), YouTube automatically processes the audio and generates accurate Hindi/Hinglish subtitles. You can then copy the full transcript text and paste it into Google AI Studio (Gemini 1.5 Pro) to extract comprehensive meeting notes.",
  },
  {
    category: "General",
    question: "Which file formats are supported by VidFlash Matrix?",
    answer:
      "VidFlash supports all popular audio formats including AAC (.m4a), MP3, AMR, WAV, FLAC, OGG, WMA, OPUS, as well as video formats like MP4, MKV, WEBM, and MOV.",
  },
  {
    category: "General",
    question: "Is VidFlash completely free to use?",
    answer:
      "Yes, VidFlash Matrix is 100% free with zero registration, zero limits, and no watermark required.",
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-4xl mx-auto my-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge Base</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
          Frequently Asked Questions (FAQ)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Everything you need to know about VidFlash Matrix in-browser conversion, privacy protections, and YouTube Gemini AI workflows.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-slate-900/70 border border-slate-800/90 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-200"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left space-x-4 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    {faq.category}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    {faq.question}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-6 pb-4 pt-1 border-t border-slate-800/60 text-xs sm:text-sm text-slate-400 leading-relaxed space-y-2">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const AboutSection: React.FC = () => {
  return (
    <section className="w-full max-w-4xl mx-auto my-12 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">
            About VidFlash Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Ultra-fast in-browser audio & meeting video converter engineered for free YouTube auto-transcription.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>100% Client-Side Privacy</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Powered by WebAssembly (FFmpeg WASM), all conversions happen locally on your device CPU. Zero bytes leave your browser.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>50x Faster 144p Muxing</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            By attaching a static banner at 1 FPS, files process up to 50 times faster while generating lightweight MP4 uploads.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Gemini AI Ready</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Extract Hindi/Hinglish meeting notes for free using YouTube Studio auto-captions and Google AI Studio Gemini models.
          </p>
        </div>
      </div>
    </section>
  );
};

interface LegalModalProps {
  type: "privacy" | "terms" | "contact" | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            {type === "privacy" && <Lock className="w-5 h-5 text-emerald-400" />}
            {type === "terms" && <FileText className="w-5 h-5 text-indigo-400" />}
            {type === "contact" && <Mail className="w-5 h-5 text-purple-400" />}
            <h3 className="text-lg font-bold text-slate-100">
              {type === "privacy" && "Privacy Policy"}
              {type === "terms" && "Terms of Service"}
              {type === "contact" && "Contact & Support"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 font-openSans">
          {type === "privacy" && (
            <>
              <p className="font-semibold text-slate-200">Effective Date: August 2026</p>
              <p>
                At <strong>VidFlash.in</strong>, user privacy is our highest priority. This Privacy Policy outlines how your data is treated when using our web application.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">1. Local Processing Guarantee</h4>
              <p>
                VidFlash Matrix utilizes WebAssembly (FFmpeg WASM) to execute media conversion strictly within your local browser environment. Audio, video, and image files uploaded to the application are processed on your local device CPU and are NEVER transmitted to external servers.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">2. Google AdSense & Third-Party Vendors</h4>
              <p>
                VidFlash.in uses Google AdSense to serve advertisements. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to your sites and/or other sites on the Internet.
              </p>
              <p>
                Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Google Ad Settings</a>.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">3. Log Files & Analytics</h4>
              <p>
                Standard web analytics may collect basic anonymized technical information such as browser type, operating system, referring site, and date/time of access to improve application stability.
              </p>
            </>
          )}

          {type === "terms" && (
            <>
              <p className="font-semibold text-slate-200">Effective Date: August 2026</p>
              <p>
                By accessing and using <strong>VidFlash.in</strong> ("VidFlash Matrix"), you agree to comply with and be bound by the following Terms of Service:
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">1. Permitted Use</h4>
              <p>
                VidFlash Matrix is provided as a free utility for converting personal, corporate, or educational media files into lightweight MP4 videos for YouTube transcription purposes. You agree not to use VidFlash for processing copyrighted material without proper authorization.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">2. Disclaimer of Warranties</h4>
              <p>
                The service is provided on an "AS IS" and "AS AVAILABLE" basis. VidFlash.in makes no warranties, expressed or implied, regarding performance, availability, or compatibility with all browser hardware configurations.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">3. Limitation of Liability</h4>
              <p>
                In no event shall VidFlash.in or its developers be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this web service.
              </p>
            </>
          )}

          {type === "contact" && (
            <>
              <p>
                Have questions, feature requests, or bug reports regarding VidFlash Matrix? We are here to help!
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>Support Email: support@vidflash.in</span>
                </div>
                <p className="text-slate-400 text-xs">
                  We respond to technical inquiries and feedback within 24-48 business hours.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
