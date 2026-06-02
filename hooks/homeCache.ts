import { api, shuffleArray } from '@/hooks/api';
import { Komik } from '@/types';

// ─── Global in-memory cache ───────────────────────────────────────────────────
// Disimpan di module scope — persist selama app hidup, tidak perlu Redux/Context

export interface HomeData {
  latest:      Komik[];
  populer:     Komik[];
  top:         Komik[];
  rekomendasi: Komik[];
  heroItems:   Komik[];
}

let cache: HomeData | null = null;
let fetchPromise: Promise<HomeData> | null = null;

// ─── Fetch (deduplicated) ─────────────────────────────────────────────────────
// Kalau dipanggil berkali-kali (splash + home mount), hanya 1 request yang jalan

export async function prefetchHome(): Promise<HomeData> {
  // Kalau cache sudah ada, return langsung
  if (cache) return cache;

  // Kalau sedang fetch, tunggu promise yang sama (jangan double-fetch)
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const [latestRes, populerRes, topRes, rekomenRes] = await api.home();
    const latest      = latestRes.data  ?? [];
    const populer     = populerRes.data ?? [];
    const top         = topRes.data     ?? [];
    const rekomendasi = rekomenRes.data ?? [];
    const pool        = [...populer, ...latest].filter(k => k.image_cover || k.image_poster);
    const heroItems   = shuffleArray(pool).slice(0, 8);

    cache = { latest, populer, top, rekomendasi, heroItems };
    fetchPromise = null;
    return cache;
  })();

  return fetchPromise;
}

// Ambil cache kalau ada, null kalau belum
export function getHomeCache(): HomeData | null {
  return cache;
}

// Reset cache (untuk pull-to-refresh)
export function clearHomeCache(): void {
  cache = null;
  fetchPromise = null;
}
