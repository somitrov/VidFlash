import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://vidflash.in"),
  title: {
    default: "VidFlash - Video Productions on Flash!",
    template: "%s | VidFlash",
  },
  description:
    "VidFlash.in is the premier zero-server creator suite. Auto-sync batches of timestamped images to voiceovers with AutoEditor or convert long audiobooks and podcasts into lightweight YouTube-ready MP4s with VidMaker in seconds.",
  keywords: [
    "VidFlash",
    "VidFlash.in",
    "AutoEditor",
    "VidMaker",
    "voiceover to video",
    "image to audio sync",
    "timestamp video editor",
    "audiobook to youtube",
    "podcast to video converter",
    "144p youtube video maker",
    "ffmpeg wasm video editor",
    "client side video editor",
    "zero server video processing",
    "youtube transcription converter",
    "gemini ai meeting notes",
    "automated video editor online",
    "ai video timeline builder",
  ],
  authors: [{ name: "VidFlash", url: "https://vidflash.in" }],
  creator: "VidFlash Team",
  publisher: "VidFlash",
  applicationName: "VidFlash",
  category: "Multimedia Video Production",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://vidflash.in",
  },
  openGraph: {
    title: "VidFlash - Video Productions on Flash!",
    description:
      "Auto-sync images to voiceovers with AutoEditor and convert audiobooks to YouTube MP4s with VidMaker locally in your browser. 100% free and private.",
    url: "https://vidflash.in",
    siteName: "VidFlash.in",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "VidFlash.in Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VidFlash - Video Productions on Flash!",
    description:
      "Automated video editing and in-browser audiobook to YouTube MP4 conversion suite with zero server uploads.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const jsonLdWebApp = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "VidFlash.in",
  url: "https://vidflash.in",
  description:
    "Next-generation creator platform for automated timestamped video editing and in-browser audiobook to YouTube MP4 conversion.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web Browser (Chrome, Firefox, Edge, Safari)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Timestamp-based voiceover to image auto-synchronization",
    "In-browser 144p 1 FPS WebAssembly FFmpeg muxer for audiobooks",
    "Zero-server client-side media processing guarantee",
    "YouTube auto-caption and Google Gemini AI note extraction ready",
  ],
};

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does the VidFlash AutoEditor sync images to voiceover automatically?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VidFlash AutoEditor parses the exact timestamp embedded in each image or video filename (e.g., 00_15_scene.png). When you click 'Build Timeline', clips are placed onto the timeline at that exact second, perfectly matched to your voiceover audio without manual dragging.",
      },
    },
    {
      "@type": "Question",
      name: "What is VidMaker and why does it use 144p resolution at 1 FPS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "VidMaker is engineered for creators who need to publish long-form audiobooks, podcasts, and recordings to YouTube for public listening or automated AI transcription. Muxing a static banner at 1 FPS executes up to 50x faster with 90%+ smaller file sizes.",
      },
    },
    {
      "@type": "Question",
      name: "Is my audio, video, or narration uploaded to any remote server?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No! VidFlash.in is built on a strict zero-server privacy architecture. Media conversion runs locally inside your web browser using WebAssembly (FFmpeg WASM). Your files never leave your device.",
      },
    },
    {
      "@type": "Question",
      name: "Is VidFlash.in completely free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, VidFlash.in is 100% free with zero registration required, zero watermarks, and no artificial file size or duration limitations.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${poppins.variable} ${openSans.variable}`} suppressHydrationWarning>
      <head>
        <Script
          id="google-adsense"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5874089918467100"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className="font-sans bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white"
        suppressHydrationWarning
      >
        <script
          id="schema-webapp"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
        />
        <script
          id="schema-faq"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
        {children}
      </body>
    </html>
  );
}



