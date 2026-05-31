// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Komik {
  id: string;          // slug dari URL
  title: string;
  image_poster: string;
  image_cover: string;
  synopsis?: string;
  type?: string;       // "Manhwa" | "Manga" | "Manhua"
  status?: string;     // "Ongoing" | "Completed"
  year?: string;
  author?: string;
  artist?: string;
  genre?: string;      // comma-separated, e.g. "Action, Romance"
  rating?: string;
  views?: string;
  serialization?: string;
}

export interface Chapter {
  id: string;          // slug chapter
  index: number;       // nomor chapter, e.g. 1, 2, 100.5
  title: string;       // "Chapter 1" atau judul custom
  date?: string;       // tanggal rilis
}

export interface ChapterPage {
  url: string;         // URL gambar per halaman
  index: number;
}

export interface KomikDetail extends Komik {
  chapter_list: Chapter[];
}

// ─── API Wrappers ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: boolean;
  data: T;
}

export interface Genre {
  id: string;
  name: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export interface HistoryItem {
  komik: Komik;
  chapterIndex: number;   // index terakhir dibaca
  chapterId: string;      // slug chapter terakhir
  timestamp: number;
}

export interface ReadProgress {
  pageIndex: number;      // halaman terakhir dibaca
  totalPages: number;
}

// ─── Reader ───────────────────────────────────────────────────────────────────

export type ReadingDirection = 'vertical' | 'ltr' | 'rtl';
export type ReaderBackground = 'black' | 'white' | 'sepia';

export interface ReaderSettings {
  direction: ReadingDirection;
  background: ReaderBackground;
  keepScreenOn: boolean;
}
