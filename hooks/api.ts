import { API_BASE, API_PREFIX } from '@/constants';
import { ApiResponse, Komik, KomikDetail, Chapter, ChapterPage, Genre } from '@/types';

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`);
  return res.json();
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapKomik(raw: any): Komik {
  return {
    id:           raw.slug ?? raw.id ?? '',
    title:        raw.title ?? raw.judul ?? '',
    image_poster: raw.thumbnail ?? raw.cover ?? raw.image ?? '',
    image_cover:  raw.cover ?? raw.thumbnail ?? raw.image ?? '',
    synopsis:     raw.synopsis ?? raw.sinopsis ?? raw.description ?? '',
    type:         raw.type ?? raw.tipe ?? '',
    status:       raw.status ?? '',
    year:         raw.year ?? raw.tahun ?? '',
    author:       raw.author ?? raw.pengarang ?? '',
    artist:       raw.artist ?? '',
    genre:        Array.isArray(raw.genre)
                    ? raw.genre.join(', ')
                    : (raw.genre ?? ''),
    rating:       String(raw.rating ?? raw.score ?? ''),
    views:        String(raw.views ?? raw.view ?? ''),
    serialization: raw.serialization ?? '',
  };
}

function mapChapter(raw: any, idx: number): Chapter {
  // API bisa return array of string atau object
  if (typeof raw === 'string') {
    return {
      id:    raw,
      index: idx,
      title: `Chapter ${idx + 1}`,
      date:  '',
    };
  }
  return {
    id:    raw.slug ?? raw.url ?? raw.id ?? String(idx),
    index: Number(raw.chapter ?? raw.ch ?? raw.number ?? idx),
    title: raw.title ?? raw.judul ?? `Chapter ${raw.chapter ?? idx + 1}`,
    date:  raw.date ?? raw.tanggal ?? raw.released ?? '',
  };
}

function mapKomikDetail(raw: any): KomikDetail {
  const base = mapKomik(raw);

  // Chapter list — beberapa API return 'chapters', 'chapter_list', atau 'chapter'
  const rawChapters: any[] =
    raw.chapters ?? raw.chapter_list ?? raw.chapter ?? [];

  const chapter_list: Chapter[] = rawChapters.map((ch, i) => mapChapter(ch, i));

  return { ...base, chapter_list };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** GET /comic/bacakomik/latest */
const fetchLatest = async (): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>('/latest');
  const list: any[] = json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);
  return { status: true, data: list.map(mapKomik) };
};

/** GET /comic/bacakomik/populer */
const fetchPopuler = async (): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>('/populer');
  const list: any[] = json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);
  return { status: true, data: list.map(mapKomik) };
};

/** GET /comic/bacakomik/top */
const fetchTop = async (): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>('/top');
  const list: any[] = json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);
  return { status: true, data: list.map(mapKomik) };
};

/** GET /comic/bacakomik/list */
const fetchList = async (): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>('/list');
  const list: any[] = json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);
  return { status: true, data: list.map(mapKomik) };
};

/** GET /comic/bacakomik/recomen */
const fetchRekomendasi = async (): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>('/recomen');
  const list: any[] = json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);
  return { status: true, data: list.map(mapKomik) };
};

/** GET /comic/bacakomik/only/:type — manhwa | manga | manhua */
const fetchByType = async (type: string): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>(`/only/${encodeURIComponent(type)}`);
  const list: any[] = json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);
  return { status: true, data: list.map(mapKomik) };
};

/** GET /comic/bacakomik/komikberwarna/:page */
const fetchKomikBerwarna = async (page = 1): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>(`/komikberwarna/${page}`);
  const list: any[] = json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);
  return { status: true, data: list.map(mapKomik) };
};

/** GET /comic/bacakomik/genres */
const fetchGenres = async (): Promise<ApiResponse<Genre[]>> => {
  const json = await get<any>('/genres');
  const list: any[] = json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);
  const genres: Genre[] = list.map((g: any) => ({
    id:   g.slug ?? g.id ?? g.name ?? String(g),
    name: g.name ?? g.label ?? String(g),
  }));
  return { status: true, data: genres };
};

/** GET /comic/bacakomik/genre/:genre */
const fetchByGenre = async (genre: string): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>(`/genre/${encodeURIComponent(genre)}`);
  const list: any[] = json?.data ?? json?.result ?? (Array.isArray(json) ? json : []);
  return { status: true, data: list.map(mapKomik) };
};

/** GET /comic/bacakomik/search/:query */
const fetchSearch = async (query: string): Promise<ApiResponse<Komik[]>> => {
  const json = await get<any>(`/search/${encodeURIComponent(query.trim())}`);
  const list: any[] =
    json?.data ?? json?.result ?? json?.results ?? (Array.isArray(json) ? json : []);
  return { status: true, data: list.map(mapKomik) };
};

/** GET /comic/bacakomik/detail/:slug */
const fetchDetail = async (slug: string): Promise<ApiResponse<KomikDetail>> => {
  const json = await get<any>(`/detail/${encodeURIComponent(slug)}`);
  const raw = json?.data?.[0] ?? json?.data ?? json?.result ?? json;
  if (!raw) return { status: false, data: null as any };
  return { status: true, data: mapKomikDetail(raw) };
};

/** GET /comic/bacakomik/chapter/:slug */
const fetchChapter = async (slug: string): Promise<ApiResponse<ChapterPage[]>> => {
  const json = await get<any>(`/chapter/${encodeURIComponent(slug)}`);

  // API kemungkinan return array of URL string, atau array of { url, src, image }
  const raw: any[] =
    json?.data ?? json?.images ?? json?.pages ?? (Array.isArray(json) ? json : []);

  const pages: ChapterPage[] = raw.map((item: any, i: number) => ({
    url:   typeof item === 'string' ? item : (item.url ?? item.src ?? item.image ?? ''),
    index: i,
  }));

  return { status: true, data: pages };
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const api = {
  // Home
  home:           ()                    => Promise.all([fetchLatest(), fetchPopuler(), fetchTop(), fetchRekomendasi()]),

  // Lists
  latest:         ()                    => fetchLatest(),
  populer:        ()                    => fetchPopuler(),
  top:            ()                    => fetchTop(),
  list:           ()                    => fetchList(),
  rekomendasi:    ()                    => fetchRekomendasi(),
  komikBerwarna:  (page?: number)       => fetchKomikBerwarna(page),

  // Filter
  byType:         (type: string)        => fetchByType(type),
  byGenre:        (genre: string)       => fetchByGenre(genre),

  // Search
  search:         (q: string)           => fetchSearch(q),

  // Genres
  genres:         ()                    => fetchGenres(),

  // Detail & Reader
  detail:         (slug: string)        => fetchDetail(slug),
  chapter:        (slug: string)        => fetchChapter(slug),
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
