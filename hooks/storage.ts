import { MMKV } from 'react-native-mmkv';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Komik, HistoryItem, ReadProgress, ReaderSettings, ReadingDirection, ReaderBackground } from '@/types';

// ─── MMKV Instance ────────────────────────────────────────────────────────────

const storage = new MMKV({ id: 'claw-storage' });

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  HISTORY:        'claw_history',
  SEARCH_HISTORY: 'claw_search_history',
  READER_SETTINGS:'claw_reader_settings',
  PROGRESS:       (chapterId: string) => `claw_progress_${sanitize(chapterId)}`,
} as const;

const MAX_HISTORY        = 50;
const MAX_SEARCH_HISTORY = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = storage.getString(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setJSON = (key: string, value: any): void => {
  try { storage.set(key, JSON.stringify(value)); } catch {}
};

const sanitize = (id: string): string =>
  id
    .replace(/[\/\.\s]/g, '_')
    .replace(/[^\w-]/g, '')
    .slice(0, 500) || 'unknown';

// ─── History ──────────────────────────────────────────────────────────────────

export const historyStorage = {
  getAll: (): HistoryItem[] =>
    getJSON<HistoryItem[]>(KEYS.HISTORY, []),

  add: (komik: Komik, chapterId: string, chapterIndex: number): void => {
    const history = historyStorage.getAll();
    const filtered = history.filter(h => h.komik.id !== komik.id);
    const updated: HistoryItem[] = [
      { komik, chapterId, chapterIndex, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY);
    setJSON(KEYS.HISTORY, updated);
  },

  remove: (komikId: string): void => {
    const history = historyStorage.getAll();
    setJSON(KEYS.HISTORY, history.filter(h => h.komik.id !== komikId));
  },

  clear: (): void => { storage.delete(KEYS.HISTORY); },
};

// ─── Search History ───────────────────────────────────────────────────────────

export const searchHistoryStorage = {
  getAll: (): string[] =>
    getJSON<string[]>(KEYS.SEARCH_HISTORY, []),

  add: (term: string): void => {
    if (!term?.trim()) return;
    const prev = searchHistoryStorage.getAll();
    const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
    setJSON(KEYS.SEARCH_HISTORY, [term.trim(), ...filtered].slice(0, MAX_SEARCH_HISTORY));
  },

  clear: (): void => { storage.delete(KEYS.SEARCH_HISTORY); },
};

// ─── Read Progress (per chapter) ─────────────────────────────────────────────

export const progressStorage = {
  get: (chapterId: string): ReadProgress | null => {
    try {
      const raw = storage.getString(KEYS.PROGRESS(chapterId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ReadProgress;
      if (typeof parsed.pageIndex !== 'number') return null;
      return parsed;
    } catch {
      return null;
    }
  },

  save: (chapterId: string, pageIndex: number, totalPages: number): void => {
    try {
      const key = KEYS.PROGRESS(chapterId);
      if (totalPages > 0 && pageIndex > 0 && pageIndex < totalPages - 1) {
        storage.set(key, JSON.stringify({ pageIndex, totalPages }));
      } else if (totalPages > 0 && pageIndex >= totalPages - 1) {
        // Udah selesai — hapus progress biar mulai dari awal lagi
        storage.delete(key);
      }
    } catch {}
  },

  clear: (chapterId: string): void => {
    try { storage.delete(KEYS.PROGRESS(chapterId)); } catch {}
  },
};

// ─── Reader Settings ─────────────────────────────────────────────────────────

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  direction:     'vertical',
  background:    'black',
  keepScreenOn:  true,
};

export const readerSettingsStorage = {
  get: (): ReaderSettings =>
    getJSON<ReaderSettings>(KEYS.READER_SETTINGS, DEFAULT_READER_SETTINGS),

  set: (settings: Partial<ReaderSettings>): void => {
    const current = readerSettingsStorage.get();
    setJSON(KEYS.READER_SETTINGS, { ...current, ...settings });
  },

  setDirection: (direction: ReadingDirection): void =>
    readerSettingsStorage.set({ direction }),

  setBackground: (background: ReaderBackground): void =>
    readerSettingsStorage.set({ background }),
};

// ─── Favorit (Firestore) ─────────────────────────────────────────────────────

const getFavRef = () => {
  const user = auth().currentUser;
  if (!user) return null;
  return firestore()
    .collection('users')
    .doc(user.uid)
    .collection('favorites');
};

export const favoritStorage = {
  getAll: async (): Promise<Komik[]> => {
    try {
      const ref = getFavRef();
      if (!ref) return [];
      const snap = await ref.orderBy('savedAt', 'desc').get();
      return snap.docs.map(d => d.data().komik as Komik);
    } catch {
      return [];
    }
  },

  add: async (komik: Komik): Promise<void> => {
    try {
      const ref = getFavRef();
      if (!ref) return;
      await ref.doc(sanitize(komik.id)).set({ komik, savedAt: Date.now() });
    } catch {}
  },

  remove: async (komikId: string): Promise<void> => {
    try {
      const ref = getFavRef();
      if (!ref) return;
      await ref.doc(sanitize(komikId)).delete();
    } catch {}
  },

  isFavorited: async (komikId: string): Promise<boolean> => {
    try {
      const ref = getFavRef();
      if (!ref) return false;
      const doc = await ref.doc(sanitize(komikId)).get();
      return doc.exists;
    } catch {
      return false;
    }
  },

  toggle: async (komik: Komik): Promise<boolean> => {
    const isFav = await favoritStorage.isFavorited(komik.id);
    if (isFav) { await favoritStorage.remove(komik.id); return false; }
    else { await favoritStorage.add(komik); return true; }
  },
};
