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
    category: "Technical",
    question: "How does the VidFlash AutoEditor sync images to voiceover automatically?",
    answer:
      "VidFlash AutoEditor parses the exact timestamp embedded in each image or video filename (e.g., 00_15_scene.png or 01_24_topic.jpg). When you click 'Build Timeline', clips are placed onto the timeline at that exact second, perfectly matched to your voiceover audio. You can then adjust clip boundaries, add Ken Burns dynamic zooming motion, mix multi-clip transitions, and burn in synced subtitles without manual dragging.",
  },
  {
    category: "Technical",
    question: "What is the Audiobook Maker and why does it use 144p resolution at 1 FPS?",
    answer:
      "Audiobook Maker is engineered for narrators, podcasters, and educators who need to publish long-form audio recordings to YouTube for public streaming or free automated transcription. YouTube requires a video feed to ingest audio, but speech recognition models only require clear sound. By muxing a customizable visual banner at 1 frame per second (1 FPS), processing is up to 50x faster with 90%+ smaller file sizes and direct stream copy.",
  },
  {
    category: "Privacy",
    question: "Is my audio, video, or narration uploaded to any remote server?",
    answer:
      "No! VidFlash.in is built on a strict zero-server privacy architecture. Media conversion runs locally inside your web browser using WebAssembly (FFmpeg WASM), and video rendering runs directly on your local system CPU. Your files never leave your device, ensuring complete privacy for confidential meetings, commercial voiceovers, and proprietary audiobook manuscripts.",
  },
  {
    category: "YouTube & AI",
    question: "How does YouTube auto-transcription and Google Gemini AI note extraction work?",
    answer:
      "Once you export your lightweight MP4 from VidFlash, upload it to YouTube Studio (set to Unlisted or Private). YouTube automatically transcribes the narration and generates accurate multi-language captions. You can then copy the full transcript text into Google AI Studio (Gemini 1.5 Pro / Flash) or ChatGPT to generate executive meeting summaries, chapter timestamps, and structured notes.",
  },
  {
    category: "General",
    question: "Which media file formats are supported by VidFlash.in?",
    answer:
      "VidFlash.in supports all standard audio formats (MP3, AAC/M4A, WAV, FLAC, OGG, AMR, OPUS, WMA), image formats (PNG, JPG, JPEG, WEBP), and video clip formats (MP4, MKV, WEBM, MOV).",
  },
  {
    category: "General",
    question: "Is VidFlash.in completely free to use?",
    answer:
      "Yes, VidFlash.in is 100% free with zero registration required, zero watermarks, and no artificial file size or duration limitations.",
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
          Everything you need to know about VidFlash.in automated timeline editing, in-browser WASM conversion, privacy guarantees, and YouTube AI workflows.
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
            About VidFlash.in
          </h2>
          <p className="text-xs text-slate-400">
            Next-generation creator platform engineered for automated video assembly, audiobook publishing, and AI transcription workflows.
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
            Powered by WebAssembly (FFmpeg WASM) and local edge execution, media encoding occurs directly on your device CPU with zero data transmission to external servers.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Dual Production Pipelines</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Switch seamlessly between VidFlash AutoEditor (instant timestamp-to-voiceover video assembly) and Audiobook Maker (1 FPS turbo MP4 muxing).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>YouTube & Gemini AI Ready</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Engineered to produce ultra-lightweight, YouTube-compliant video files ready for automated multi-language transcription and Gemini AI note extraction.
          </p>
        </div>
      </div>
    </section>
  );
};

interface LegalModalProps {
  type: "privacy" | "terms" | "contact" | "sale" | null;
  onClose: () => void;
  onSwitchType?: (type: "privacy" | "terms" | "contact" | "sale") => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, onSwitchType }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            {type === "privacy" && <Lock className="w-5 h-5 text-emerald-400" />}
            {type === "terms" && <FileText className="w-5 h-5 text-indigo-400" />}
            {type === "contact" && <Mail className="w-5 h-5 text-purple-400" />}
            {type === "sale" && <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />}
            <h3 className="text-lg font-bold text-slate-100">
              {type === "privacy" && "Privacy Policy"}
              {type === "terms" && "Terms of Service"}
              {type === "contact" && "Contact & Support"}
              {type === "sale" && "Platform Acquisition & Investment Offering"}
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
          {type === "sale" && (
            <div className="space-y-5">
              {/* Highlight Valuation Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 text-center space-y-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wide">
                  <span>Exclusive Acquisition Offering</span>
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  $1,080,000 USD <span className="text-sm font-semibold text-amber-300">(₹9.00 Crore INR)</span>
                </div>
                <p className="text-slate-300 text-xs max-w-lg mx-auto">
                  100% full intellectual property, complete full-stack web + WASM codebase, zero-server architecture, and brand domain ready for strategic acquisition or initial seed funding.
                </p>
              </div>

              {/* Complete Capabilities & Properties */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>Platform Core Pillars & Capabilities</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-emerald-400 text-xs flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>1. VidFlash AutoEditor</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-normal">
                      Zero-drag autonomous timeline assembly. Auto-syncs batches of AI/folder images to audio narration via timestamp metadata, with built-in subtitle burns, Ken Burns zoom motion, and smart transition mixing.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-indigo-400 text-xs flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>2. Audiobook Maker (144p WASM)</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-normal">
                      High-throughput client-side FFmpeg WebAssembly muxing at 1 FPS. Converts multi-hour audiobooks, meetings, and podcasts into lightweight YouTube-ready MP4s with customizable animated banners.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400 text-xs flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>3. Zero-Server Cost & Infinite Scalability</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-normal">
                    Media processing runs client-side on consumer device CPUs. Scales effortlessly to millions of users with zero cloud video encoding fees and negligible hosting overhead.
                  </p>
                </div>
              </div>

              {/* Future Predictions & Roadmap */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Future Predictions & Growth Roadmap</span>
                </h4>
                <ul className="text-slate-400 text-xs space-y-1 list-disc list-inside">
                  <li>AI voiceover cloning and automated multi-track background music generator.</li>
                  <li>One-click multi-format social exports (YouTube Shorts, Instagram Reels, TikTok 9:16).</li>
                  <li>Direct YouTube Studio API cloud integration for automated batch channel uploads.</li>
                  <li>High-margin SaaS subscription monetization model for content creators & agencies.</li>
                </ul>
              </div>

              {/* Contact Button linking to Contact & Support Pop */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2 text-indigo-200 font-bold text-xs">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <span>Direct Acquisition & Investor Contact</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Reach out for strategic acquisition, technical diligence, or term sheets.
                  </p>
                </div>
                <button
                  onClick={() => onSwitchType ? onSwitchType("contact") : undefined}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact & Support</span>
                </button>
              </div>
            </div>
          )}

          {type === "privacy" && (
            <>
              <p className="font-semibold text-slate-200">Effective Date: August 2026</p>
              <p>
                At <strong>VidFlash.in</strong>, privacy, data integrity, and intellectual property protection are core foundational principles. This Privacy Policy details how your information is handled when accessing our media production suite.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">1. Local Processing Guarantee (Zero-Server Architecture)</h4>
              <p>
                VidFlash.in executes all video assembly and media muxing locally. In-browser conversions operate via WebAssembly (FFmpeg WASM), and render pipelines run on your local device CPU. Your source audio files, voiceover tracks, script files, and graphic imagery are never uploaded, stored, transmitted, or monitored on remote servers.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">2. Google AdSense & Advertising Cookies</h4>
              <p>
                VidFlash.in uses Google AdSense to deliver relevant advertisements. Third-party vendors, including Google, use cookies to serve ads based on user visits to this website and other sites across the web. Google's use of advertising cookies enables it and its network partners to serve tailored ads to users.
              </p>
              <p>
                Users can manage personalized ad preferences or opt out of interest-based advertising at any time by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Google Ad Settings</a> or <a href="https://www.aboutads.info" target="_blank" rel="noreferrer" className="text-indigo-400 underline">aboutads.info</a>.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">3. Analytics & Operational Telemetry</h4>
              <p>
                To maintain application stability and performance, standard anonymous technical parameters (such as browser engine, device screen resolution, and error telemetry) may be processed without identifying individual users.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">4. Data Retention & User Rights</h4>
              <p>
                Because media encoding occurs locally in memory and temporary local directories, closing or refreshing your browser tab immediately frees active media buffers. You retain full, exclusive ownership of all output files.
              </p>
            </>
          )}

          {type === "terms" && (
            <>
              <p className="font-semibold text-slate-200">Effective Date: August 2026</p>
              <p>
                Welcome to <strong>VidFlash.in</strong> ("VidFlash"). By accessing or utilizing our platform, services, and associated web tools, you agree to be bound by the following Terms of Service:
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">1. Scope of Service & Permitted Use</h4>
              <p>
                VidFlash.in provides creator-focused utilities including the VidFlash AutoEditor (timestamp-based audio/image synchronization) and Audiobook Maker (144p 1 FPS WebAssembly video muxing). You are granted a non-exclusive license to use the service for personal, educational, commercial, and professional media production.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">2. Intellectual Property & Content Rights</h4>
              <p>
                You retain complete and unencumbered ownership of all audio, imagery, script files, and finalized video productions generated using VidFlash.in. You represent and warrant that you hold all necessary licenses and permissions for any third-party copyrighted content imported into the tool.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">3. Technical Availability & Hardware Dependencies</h4>
              <p>
                VidFlash.in utilizes advanced browser WebAssembly technologies. Processing duration and performance are directly dependent on your client device CPU specifications, available RAM, and browser environment.
              </p>
              <h4 className="font-bold text-indigo-300 text-sm">4. Disclaimer of Warranties & Limitation of Liability</h4>
              <p>
                The service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, express or implied. Under no circumstances shall VidFlash.in, its founders, or maintainers be liable for any indirect, incidental, or consequential damages resulting from platform usage or data loss.
              </p>
            </>
          )}

          {type === "contact" && (
            <>
              <p>
                Have questions, feature requests, or technical inquiries regarding VidFlash.in? We are here to support your creator journey!
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>Support Email: <a href="mailto:somitrov@gmail.com" className="text-indigo-300 underline">somitrov@gmail.com</a></span>
                </div>
                <p className="text-slate-400 text-xs">
                  We respond to creator inquiries, bug reports, and partnership proposals within 24-48 business hours.
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
