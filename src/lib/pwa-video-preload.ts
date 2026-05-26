"use client";

import { canWarmVideoNetwork, isStandalonePWA } from "@/lib/pwa-client";

const STREAM_BASE_URL = "https://customer-2cdfxbmja64x0pqo.cloudflarestream.com";
const warmed = new Set<string>();

interface PreloadablePost {
  videos: { id: string }[];
}

function getStreamUrls(videoId: string) {
  return {
    thumbnail: `${STREAM_BASE_URL}/${videoId}/thumbnails/thumbnail.jpg?time=&height=600`,
    manifest: `${STREAM_BASE_URL}/${videoId}/manifest/video.m3u8`,
  };
}

function preloadThumbnail(videoId: string) {
  const { thumbnail } = getStreamUrls(videoId);
  const image = new Image();
  image.decoding = "async";
  image.src = thumbnail;
}

function getFirstMediaLine(manifest: string) {
  return manifest
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));
}

function resolveManifestUrl(baseUrl: string, nextPath: string) {
  return new URL(nextPath, baseUrl).toString();
}

async function warmHlsStart(videoId: string) {
  const cacheKey = `hls:${videoId}`;
  if (warmed.has(cacheKey)) return;
  warmed.add(cacheKey);

  const { manifest } = getStreamUrls(videoId);
  const masterResponse = await fetch(manifest, { cache: "force-cache" });
  if (!masterResponse.ok) return;

  const masterText = await masterResponse.text();
  const firstLine = getFirstMediaLine(masterText);
  if (!firstLine) return;

  if (!firstLine.endsWith(".m3u8")) {
    await fetch(resolveManifestUrl(manifest, firstLine), { cache: "force-cache" });
    return;
  }

  const playlistUrl = resolveManifestUrl(manifest, firstLine);
  const playlistResponse = await fetch(playlistUrl, { cache: "force-cache" });
  if (!playlistResponse.ok) return;

  const playlistText = await playlistResponse.text();
  const firstSegment = getFirstMediaLine(playlistText);
  if (!firstSegment) return;

  await fetch(resolveManifestUrl(playlistUrl, firstSegment), { cache: "force-cache" });
}

export function warmRecommendedPwaAssets(posts: PreloadablePost[], activeIndex: number) {
  if (!isStandalonePWA() || !canWarmVideoNetwork()) return;

  warmPwaVideoIds(
    posts
      .slice(activeIndex + 1, activeIndex + 3)
      .map((post) => post.videos[0]?.id)
      .filter((videoId): videoId is string => Boolean(videoId)),
  );
}

export function warmPwaVideoIds(videoIds: string[]) {
  if (!isStandalonePWA() || !canWarmVideoNetwork()) return;

  for (const videoId of videoIds.slice(0, 2)) {
    preloadThumbnail(videoId);
  }

  const nextVideoId = videoIds[0];
  if (nextVideoId) {
    warmHlsStart(nextVideoId).catch(() => {});
  }
}
