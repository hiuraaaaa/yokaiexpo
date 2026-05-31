// hooks/tracemoe.ts
// Utility untuk search anime via trace.moe dari image URI (expo-image-picker result)

export interface TraceMoeResult {
  anilist: number;
  filename: string;
  episode: number | null;
  from: number;
  at: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
  // AniList info (kalau anilistInfo=true)
  anilistInfo?: {
    id: number;
    title: { romaji?: string; english?: string; native?: string };
    synonyms: string[];
    isAdult: boolean;
  };
}

export interface TraceMoeResponse {
  frameCount: number;
  error: string;
  result: TraceMoeResult[];
}

/**
 * Search anime dari image URI lokal (dari expo-image-picker).
 * Kirim sebagai multipart/form-data ke trace.moe.
 */
export async function searchByImageUri(uri: string): Promise<TraceMoeResult[]> {
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: 'screenshot.jpg',
    type: 'image/jpeg',
  } as any);

  const res = await fetch('https://api.trace.moe/search?anilistInfo=1&cutBorders=1', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`trace.moe error: ${res.status}`);

  const data: TraceMoeResponse = await res.json();
  if (data.error) throw new Error(data.error);

  // Filter similarity > 80% aja biar ga noise
  return data.result.filter(r => r.similarity >= 0.8);
}

/** Format timestamp seconds → MM:SS */
export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Ambil judul terbaik dari result */
export function getBestTitle(result: TraceMoeResult): string {
  const info = result.anilistInfo;
  if (info?.title?.english) return info.title.english;
  if (info?.title?.romaji) return info.title.romaji;
  // Fallback dari filename
  return result.filename
    .replace(/\.[^.]+$/, '')           // buang ekstensi
    .replace(/[\[\(].*?[\]\)]/g, '')   // buang tag [BD] dsb
    .replace(/\s*-\s*\d+\s*$/, '')     // buang ep number
    .trim();
}

/** Similarity → persentase string */
export function formatSimilarity(sim: number): string {
  return `${(sim * 100).toFixed(1)}%`;
}
