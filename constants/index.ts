// ─── API ──────────────────────────────────────────────────────────────────────

export const API_BASE = 'https://www.sankavollerei.com';
export const API_PREFIX = '/comic/bacakomik';

// ─── App ──────────────────────────────────────────────────────────────────────

export const APP_NAME = 'Claw';
export const APP_VERSION = '1.0.0';

// ─── Theme ────────────────────────────────────────────────────────────────────

export type Theme = {
  id: string;
  name: string;
  bg: string;
  card: string;
  accent: string;
  accentDim: string;
  border: string;
  text: string;
  subtext: string;
};

export const THEMES: Theme[] = [
  {
  id: 'yokai',
  name: 'Yōkai',
  bg: '#040d14',
  card: '#0a1a24',
  accent: '#00d4ff',
  accentDim: 'rgba(0,212,255,0.2)',
  border: 'rgba(0,212,255,0.08)',
  text: '#ffffff',
  subtext: 'rgba(255,255,255,0.4)',
},
  {
    id: 'gold',
    name: 'Gold',
    bg: '#0a0a0c',
    card: '#16161a',
    accent: '#F6CF80',
    accentDim: 'rgba(246,207,128,0.2)',
    border: 'rgba(255,255,255,0.05)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    bg: '#0d0a12',
    card: '#1a1220',
    accent: '#ff6b9d',
    accentDim: 'rgba(255,107,157,0.2)',
    border: 'rgba(255,107,157,0.08)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'abyss',
    name: 'Abyss',
    bg: '#050d1a',
    card: '#0d1a2e',
    accent: '#4a9eff',
    accentDim: 'rgba(74,158,255,0.2)',
    border: 'rgba(74,158,255,0.08)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    bg: '#0f0505',
    card: '#1a0a0a',
    accent: '#e63946',
    accentDim: 'rgba(230,57,70,0.2)',
    border: 'rgba(230,57,70,0.08)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    bg: '#050f08',
    card: '#0a1a0f',
    accent: '#2ecc71',
    accentDim: 'rgba(46,204,113,0.2)',
    border: 'rgba(46,204,113,0.08)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'violet',
    name: 'Violet',
    bg: '#0a0512',
    card: '#130a1e',
    accent: '#a855f7',
    accentDim: 'rgba(168,85,247,0.2)',
    border: 'rgba(168,85,247,0.08)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    bg: '#0f0800',
    card: '#1a1000',
    accent: '#ff8c42',
    accentDim: 'rgba(255,140,66,0.2)',
    border: 'rgba(255,140,66,0.08)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    bg: '#00080f',
    card: '#001525',
    accent: '#00d4ff',
    accentDim: 'rgba(0,212,255,0.2)',
    border: 'rgba(0,212,255,0.08)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    bg: '#0f0a0a',
    card: '#1e1212',
    accent: '#e8a598',
    accentDim: 'rgba(232,165,152,0.2)',
    border: 'rgba(232,165,152,0.08)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'mint',
    name: 'Mint',
    bg: '#040f0d',
    card: '#081a16',
    accent: '#00e5c3',
    accentDim: 'rgba(0,229,195,0.2)',
    border: 'rgba(0,229,195,0.08)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'pure-white',
    name: 'Pure White',
    bg: '#f5f5f5',
    card: '#ffffff',
    accent: '#333333',
    accentDim: 'rgba(51,51,51,0.15)',
    border: 'rgba(0,0,0,0.08)',
    text: '#111111',
    subtext: 'rgba(0,0,0,0.4)',
  },
  {
    id: 'pure-black',
    name: 'Pure Black',
    bg: '#000000',
    card: '#0a0a0a',
    accent: '#ffffff',
    accentDim: 'rgba(255,255,255,0.15)',
    border: 'rgba(255,255,255,0.05)',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.4)',
  },
];

// Backward compat
export const COLORS = {
  bg: '#0a0a0c',
  card: '#16161a',
  gold: '#F6CF80',
  goldDim: 'rgba(246, 207, 128, 0.2)',
  white: '#ffffff',
  whiteDim: 'rgba(255,255,255,0.05)',
  whiteMid: 'rgba(255,255,255,0.1)',
};

// ─── Komik Type Filter ────────────────────────────────────────────────────────

export const KOMIK_TYPES = ['manhwa', 'manga', 'manhua'] as const;
export type KomikType = (typeof KOMIK_TYPES)[number];
