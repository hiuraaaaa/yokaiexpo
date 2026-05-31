import { MMKV } from 'react-native-mmkv';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const storage = new MMKV({ id: 'nefusoft-xp' });
const XP_KEY  = 'nefusoft_xp';

export interface XPData {
  xp: number;
  level: number;
  streak: number;
  lastWatchDate: string;
  _todayXP?: number;
}

export const LEVELS = [
  { level: 1,   title: 'Newbie',       min: 0      },
  { level: 5,   title: 'Pemula',       min: 500    },
  { level: 10,  title: 'Wibu',         min: 2000   },
  { level: 15,  title: 'Otaku',        min: 5000   },
  { level: 20,  title: 'Weeb',         min: 10000  },
  { level: 25,  title: 'Anime Freak',  min: 18000  },
  { level: 30,  title: 'Sub Addict',   min: 30000  },
  { level: 35,  title: 'No Lifer',     min: 45000  },
  { level: 40,  title: 'Plot Armor',   min: 65000  },
  { level: 50,  title: 'Final Boss',   min: 90000  },
  { level: 60,  title: "Isekai'd",     min: 130000 },
  { level: 70,  title: 'True Ending',  min: 180000 },
  { level: 80,  title: 'Beyond Canon', min: 250000 },
  { level: 90,  title: 'Ascended',     min: 350000 },
  { level: 100, title: 'Sensei',       min: 500000 },
];

export const getLevelData = (xp: number) => {
  let current = LEVELS[0];
  let next: typeof LEVELS[0] | null = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1;
  return { current, next, progress };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getLocal = (): XPData => {
  try {
    const raw = storage.getString(XP_KEY);
    return raw ? JSON.parse(raw) : { xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0 };
  } catch {
    return { xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0 };
  }
};

const setLocal = (data: XPData): void => {
  try {
    storage.set(XP_KEY, JSON.stringify(data));
  } catch {}
};

const syncToFirestore = async (data: XPData): Promise<void> => {
  try {
    const user = auth().currentUser;
    if (!user) return;
    // ✅ _todayXP ikut di-sync — biar daily cap ga ke-reset pas logout/login
    await firestore().collection('users').doc(user.uid).update({
      xp:            data.xp,
      level:         data.level,
      streak:        data.streak,
      lastWatchDate: data.lastWatchDate,
      _todayXP:      data._todayXP ?? 0,
    });
  } catch {}
};

const getFromFirestore = async (): Promise<XPData | null> => {
  try {
    const user = auth().currentUser;
    if (!user) return null;
    const doc = await firestore().collection('users').doc(user.uid).get();
    if (!doc.exists) return null;
    const d = doc.data()!;
    return {
      xp:            d.xp            ?? 0,
      level:         d.level         ?? 1,
      streak:        d.streak        ?? 0,
      lastWatchDate: d.lastWatchDate ?? '',
      // ✅ _todayXP diambil dari Firestore juga
      _todayXP:      d._todayXP      ?? 0,
    };
  } catch {
    return null;
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const xpStorage = {
  get: async (): Promise<XPData> => {
    const remote = await getFromFirestore();
    if (remote) {
      setLocal(remote);
      return remote;
    }
    return getLocal();
  },

  add: async (amount: number): Promise<XPData> => {
    try {
      const data  = await xpStorage.get();
      const today    = new Date().toDateString();
      const isNewDay = data.lastWatchDate !== today;

      // ✅ streak hanya naik kalau user beneran nonton (ada episode yang di-add)
      // bukan sekedar buka app
      const streak      = isNewDay ? data.streak + 1 : data.streak;
      const streakBonus = isNewDay ? 10 : 0;

      // Daily cap 50 XP — max 5 episode per hari
      const todayXP = isNewDay ? 0 : (data._todayXP ?? 0);
      const capped  = Math.min(amount, Math.max(0, 50 - todayXP));
      const newXp   = data.xp + capped + streakBonus;
      const { current } = getLevelData(newXp);

      const updated: XPData = {
        xp:            newXp,
        level:         current.level,
        streak,
        lastWatchDate: today,
        _todayXP:      isNewDay ? capped : todayXP + capped,
      };

      setLocal(updated);        // instant lokal
      syncToFirestore(updated); // background, ga di-await
      return updated;
    } catch {
      return getLocal();
    }
  },

  reset: async (): Promise<void> => {
    storage.delete(XP_KEY);
    try {
      const user = auth().currentUser;
      if (user) {
        await firestore().collection('users').doc(user.uid).update({
          xp: 0, level: 1, streak: 0, lastWatchDate: '', _todayXP: 0,
        });
      }
    } catch {}
  },
};
