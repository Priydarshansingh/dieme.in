// GET /api/extensions/catalog
// Fetches the latest published Digicast (.dcast) extensions from the official repository releases.

import { NextRequest, NextResponse } from "next/server";

export interface ExtensionCatalogItem {
  id: string;
  name: string;
  version: string;
  description: string;
  downloadUrl: string;
  entryClass: string;
  type: string;
  fileSizeBytes: number;
  publishedAt: string;
  minCoreVersion: number;
}

const DEFAULT_EXTENSIONS: ExtensionCatalogItem[] = [
  {
    id: "com.digicast.ext.clipengine",
    name: "Dieme Clip Engine",
    version: "1.0.0",
    description: "Core high-performance video trimming & yt-dlp downloader engine for local clip extraction.",
    downloadUrl: "https://github.com/Priydarshansingh/dieme.in/releases/download/v1.0.0/clip-engine.dcast",
    entryClass: "com.digicast.ext.clipengine.ClipEngineExtension",
    type: "CLIP_PROCESSOR",
    fileSizeBytes: 24500000,
    publishedAt: new Date().toISOString(),
    minCoreVersion: 1,
  },
  {
    id: "com.digicast.ext.chatanalyzer",
    name: "AI Chat Sentiment & Hype Tracker",
    version: "1.0.0",
    description: "Real-time engagement spike detection and live reaction clustering extension.",
    downloadUrl: "https://github.com/Priydarshansingh/dieme.in/releases/download/v1.0.0/chat-analyzer.dcast",
    entryClass: "com.digicast.ext.chatanalyzer.ChatAnalyzerExtension",
    type: "CHAT_ANALYZER",
    fileSizeBytes: 4200000,
    publishedAt: new Date().toISOString(),
    minCoreVersion: 1,
  }
];

export async function GET(req: NextRequest) {
  try {
    // Attempt to query GitHub Releases API for dynamic catalog
    const ghRes = await fetch("https://api.github.com/repos/Priydarshansingh/dieme.in/releases", {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Dieme-Catalog-Service",
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (ghRes.ok) {
      const releases = await ghRes.json();
      if (Array.isArray(releases) && releases.length > 0) {
        const dynamicItems: ExtensionCatalogItem[] = [];

        for (const rel of releases) {
          if (!rel.assets || !Array.isArray(rel.assets)) continue;
          for (const asset of rel.assets) {
            if (asset.name.endsWith(".dcast")) {
              const baseName = asset.name.replace(".dcast", "");
              dynamicItems.push({
                id: `com.digicast.ext.${baseName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
                name: baseName.replace(/[-_]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
                version: rel.tag_name || "1.0.0",
                description: rel.body || "Official Digicast modular processor extension.",
                downloadUrl: asset.browser_download_url,
                entryClass: `com.digicast.ext.${baseName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}.MainExtension`,
                type: baseName.includes("chat") ? "CHAT_ANALYZER" : "CLIP_PROCESSOR",
                fileSizeBytes: asset.size || 0,
                publishedAt: asset.updated_at || rel.published_at || new Date().toISOString(),
                minCoreVersion: 1,
              });
            }
          }
        }

        if (dynamicItems.length > 0) {
          return NextResponse.json({
            extensions: dynamicItems,
            source: "github_releases",
            repository: "https://github.com/Priydarshansingh/dieme.in",
          });
        }
      }
    }

    // Return official built-in catalog if GitHub API rate-limited or no releases yet
    return NextResponse.json({
      extensions: DEFAULT_EXTENSIONS,
      source: "official_manifest",
      repository: "https://github.com/Priydarshansingh/dieme.in",
    });

  } catch (err: any) {
    console.warn("[extensions/catalog] GitHub fetch failed, returning default manifest:", err);
    return NextResponse.json({
      extensions: DEFAULT_EXTENSIONS,
      source: "fallback_manifest",
      repository: "https://github.com/Priydarshansingh/dieme.in",
    });
  }
}
