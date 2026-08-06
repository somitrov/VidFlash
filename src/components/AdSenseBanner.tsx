"use client";

import React, { useEffect, useRef } from "react";

interface AdSenseBannerProps {
  publisherId?: string;
  slotId?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  publisherId = "ca-pub-5874089918467100",
  slotId,
  format = "auto",
  responsive = true,
  style = { display: "block" },
  className = "",
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    try {
      if (!pushedRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      }
    } catch (err) {
      console.warn("AdSense push error or adblocker detected:", err);
    }
  }, []);

  return (
    <div
      className={`w-full my-4 sm:my-6 flex flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-900/50 border border-slate-800/80 p-2 sm:p-3 min-h-[100px] sm:min-h-[120px] max-w-full text-center transition-all ${className}`}
    >
      <div className="flex items-center space-x-1.5 mb-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
          Sponsored / Advertisement
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
      </div>

      <div className="w-full flex items-center justify-center overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ ...style, width: "100%", minWidth: "280px" }}
          data-ad-client={publisherId}
          {...(slotId ? { "data-ad-slot": slotId } : {})}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </div>
    </div>
  );
};
