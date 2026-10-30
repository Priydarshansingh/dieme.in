"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

declare global {
  interface Window {
    AndroidBridge?: {
      onTimeUpdate?: (currentSec: number, durationSec: number) => void;
      onStateChange?: (state: number) => void;
    };
    seekTo?: (seconds: number) => void;
  }
}

function EmbedContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId") || "g_4KXSxPzGo";
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  let timing = "";
  if (start && end) {
    timing = `&start=${start}&end=${end}`;
  } else if (start) {
    timing = `&start=${start}`;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}${timing}`;

  useEffect(() => {
    // 1. PostMessage handler for YouTube IFrame API communication
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "infoDelivery" && data.info) {
          const cur = data.info.currentTime;
          const dur = data.info.duration;
          if (typeof cur === "number" && window.AndroidBridge?.onTimeUpdate) {
            window.AndroidBridge.onTimeUpdate(cur, typeof dur === "number" ? dur : 0);
          }
        }
      } catch (_) {}
    };
    window.addEventListener("message", handleMessage);

    // 2. Poll iframe for current time
    const interval = setInterval(() => {
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "listening", id: 1 }),
            "*"
          );
        }
      } catch (_) {}
    }, 500);

    // 3. Expose global seekTo for Android
    window.seekTo = (seconds: number) => {
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }),
            "*"
          );
        }
      } catch (_) {}
    };

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden" }}>
      <iframe
        ref={iframeRef}
        src={embedUrl}
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div style={{ background: "#000", width: "100vw", height: "100vh" }} />}>
      <EmbedContent />
    </Suspense>
  );
}
