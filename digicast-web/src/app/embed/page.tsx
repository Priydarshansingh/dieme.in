"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EmbedContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId") || "g_4KXSxPzGo";
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  let timing = "";
  if (start && end) {
    timing = `&start=${start}&end=${end}`;
  } else if (start) {
    timing = `&start=${start}`;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&controls=1&rel=0&modestbranding=1&enablejsapi=1${timing}`;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden" }}>
      <iframe
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
