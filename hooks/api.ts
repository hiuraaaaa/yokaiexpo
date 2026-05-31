import { API_BASE, API_PREFIX } from '@/constants';
import { ApiResponse, Komik, KomikDetail, Chapter, ChapterPage, Genre } from '@/types';

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`);
  return res.json();
};

// ─── List Extractor ───────────────────────────────────────────────────────────
// Semua endpoint list pakai key "komikList", bukan "data"/"result"

const extractList = (json: any): any[] =>
  json?.komikList ?? json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapKomik(raw: any): Komik {
  return {
    id:            raw.slug ?? raw.id ?? '',
    title:         raw.title ?? '',
    image_poster:  raw.cover ?? raw.thumbnail ?? raw.image ?? '',
    image_cover:   raw.cover ?? raw.thumbnail ?? raw.image ?? '',
    synopsis:      raw.synopsis ?? '',
    type:          raw.type ?? raw.tipe ?? '',
    status:        raw.status ?? '',
    year:          raw.release ?? raw.year ?? raw.tahun ?? '',
    author:        raw.author ?? '',
    artist:        raw.artist ?? '',
    // genres di list = string, di detail = array of {title, slug}
    genre:         Array.isArray(raw.genres)
                     ? raw.genres.map((g: any) => g.title ?? g.name ?? g).join(', ')
                     : (raw.genre ?? raw.type ?? ''),
    rating:        String(raw.rating ?? raw.score ?? ''),
    views:         String(raw.reader ?? raw.views ?? raw.view ?? ''),
    serialization: raw.series ?? raw.serialization ?? '',
  };
}

function mapChapter(raw: any, idx: number): Chapter {
  if (typeof raw === 'string') {
    return { id: raw, index: idx, title: `Chapter ${idx + 1}`, date: '' };
  }

  // Dari response asli: { title: "", slug: "nano-machine-chapter-314", date: "3 hari yang lalu" }
  // Extract nomor chapter dari slug, e.g. "nano-machine-chapter-314" → 314
  const slugStr: string = raw.slug ?? raw.id ?? '';
  const chNumMatch = slugStr.match(/chapter-(\d+(?:\.\d+)?)$/i);
  const chNum = chNumMatch ? Number(chNumMatch[1]) : idx + 1;

  const titleFromSlug = `Chapter ${chNum}`;
  const title = (raw.title && raw.title.trim() !== '')
    ? raw.title
    : titleFromSlug;

  return {
    id:    slugStr || String(idx),
    index: chNum,
    title,
    date:  raw.date ?? raw.tanggal ?? '',
  };
}

function mapKomikDetail(raw: any): KomikDetail {
  const base = mapKomik(raw);

  // Response asli pakai key "chapters"
  const rawChapters: any[] = raw.chapters ?? raw.chapter_list ?? raw.chapter ?? [];
  const chapter_list: Chapter[] = rawChapters.map((ch, i) => mapChapter(ch, i));

  return { ...base, chapter_list };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** GET /comic/bacakomik/latest */
const fetchLatest = async (): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>('/latest');
  return { status: true, data: extractList(json).map(mapKomik) };
};

/** GET /comic/bacakomik/populer */
const fetchPopuler = async (): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>('/populer');
  return { status: true, data: extractList(json).map(mapKomik) };
};

/** GET /comic/bacakomik/top */
const fetchTop = async (): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>('/top');
  return { status: true, data: extractList(json).map(mapKomik) };
};

/** GET /comic/bacakomik/list */
const fetchList = async (): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>('/list');
  return { status: true, data: extractList(json).map(mapKomik) };
};

/** GET /comic/bacakomik/recomen */
const fetchRekomendasi = async (): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>('/recomen');
  return { status: true, data: extractList(json).map(mapKomik) };
};

/** GET /comic/bacakomik/only/:type — manhwa | manga | manhua */
const fetchByType = async (type: string): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>(`/only/${encodeURIComponent(type)}`);
  return { status: true, data: extractList(json).map(mapKomik) };
};

/** GET /comic/bacakomik/komikberwarna/:page */
const fetchKomikBerwarna = async (page = 1): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>(`/komikberwarna/${page}`);
  return { status: true, data: extractList(json).map(mapKomik) };
};

/** GET /comic/bacakomik/genres */
const fetchGenres = async (): Promise<ApiResponse<Genre[]>> => {
  const json = await get<any>('/genres');
  // Response asli: { genres: [ { title: "Action", slug: "action" }, ... ] }
  const list: any[] = json?.genres ?? json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);
  const genres: Genre[] = list.map((g: any) => ({
    id:   g.slug ?? g.id ?? '',
    name: g.title ?? g.name ?? '',
  }));
  return { status: true, data: genres };
};

/** GET /comic/bacakomik/genre/:genre */
const fetchByGenre = async (genre: string): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>(`/genre/${encodeURIComponent(genre)}`);
  return { status: true, data: extractList(json).map(mapKomik) };
};

/** GET /comic/bacakomik/search/:query */
const fetchSearch = async (query: string): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>(`/search/${encodeURIComponent(query.trim())}`);
  // Search juga pakai komikList (confirmed dari response asli)
  return { status: true, data: extractList(json).map(mapKomik) };
};

/** GET /comic/bacakomik/detail/:slug */
const fetchDetail = async (slug: string): Promise<ApiResponse<KomikDetail>> => {
  const json = await get<any>(`/detail/${encodeURIComponent(slug)}`);
  // Response asli: { detail: { ... } }, bukan data/result
  const raw = json?.detail ?? json?.data?.[0] ?? json?.data ?? json?.result ?? json;
  if (!raw || typeof raw !== 'object') return { status: false, data: null as any };
  return { status: true, data: mapKomikDetail(raw) };
};

/** GET /comic/bacakomik/chapter/:slug */
const fetchChapter = async (slug: string): Promise<ApiResponse<ChapterPage[]>> => {
  const json = await get<any>(`/chapter/${encodeURIComponent(slug)}`);

  const raw: any[] =
    json?.images ?? json?.pages ?? json?.data ?? (Array.isArray(json) ? json : []);

  const pages: ChapterPage[] = raw.map((item: any, i: number) => ({
    url:   typeof item === 'string' ? item : (item.url ?? item.src ?? item.image ?? ''),
    index: i,
  }));

  return { status: true, data: pages };
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const api = {
  // Home
  home:          ()               => Promise.all([fetchLatest(), fetchPopuler(), fetchTop(), fetchRekomendasi()]),

  // Lists
  latest:        ()               => fetchLatest(),
  populer:       ()               => fetchPopuler(),
  top:           ()               => fetchTop(),
  list:          ()               => fetchList(),
  rekomendasi:   ()               => fetchRekomendasi(),
  komikBerwarna: (page?: number)  => fetchKomikBerwarna(page),

  // Filter
  byType:        (type: string)   => fetchByType(type),
  byGenre:       (genre: string)  => fetchByGenre(genre),

  // Search
  search:        (q: string)      => fetchSearch(q),

  // Genres
  genres:        ()               => fetchGenres(),

  // Detail & Reader
  detail:        (slug: string)   => fetchDetail(slug),
  chapter:       (slug: string)   => fetchChapter(slug),
};

// ─── Slug Helpers ─────────────────────────────────────────────────────────────

/** Encode slug jadi safe buat expo-router param */
export const encodeSlug = (slug: string): string =>
  encodeURIComponent(slug).replace(/%/g, '_');

/** Decode balik dari router param */
export const decodeSlug = (param: string): string => {
  try {
    return decodeURIComponent(param.replace(/_/g, '%'));
  } catch {
    return param;
  }
};

/** Bikin route param dari objek Komik */
export const getKomikParam = (komik: Komik): string => {
  const slug      = encodeSlug(komik.id);
  const titleSlug = komik.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  return `${slug}---${titleSlug}`;
};

/** Extract slug dari route param */
export const extractKomikId = (param: string): string => {
  const encoded = param.split('---')[0];
  return decodeSlug(encoded);
};

// ─── Utils ────────────────────────────────────────────────────────────────────

export const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
