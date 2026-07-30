import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VidScribe Matrix | Flash Transcription Powered by YouTube!",
  description:
    "Convert long meeting audio/video recordings into YouTube-accepted MP4 files with customizable visual banners locally in your browser for free YouTube auto-transcription.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
