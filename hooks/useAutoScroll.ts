import { useRef, useState, useCallback, useEffect } from 'react';
import { FlashList } from '@shopify/flash-list';
import { ChapterPage } from '@/types';

// ─── Konstanta ────────────────────────────────────────────────────────────────

// Kecepatan dalam px/detik
export const AUTO_SCROLL_SPEEDS = [
  { label: '0.5×', px: 30  },
  { label: '1×',   px: 60  },
  { label: '1.5×', px: 100 },
  { label: '2×',   px: 150 },
  { label: '3×',   px: 220 },
] as const;

export type SpeedIndex = 0 | 1 | 2 | 3 | 4;
const DEFAULT_SPEED_IDX: SpeedIndex = 1; // 1×
const TICK_MS = 16; // ~60fps

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAutoScroll(listRef: React.RefObject<FlashList<ChapterPage>>) {
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [speedIdx,   setSpeedIdx]   = useState<SpeedIndex>(DEFAULT_SPEED_IDX);

  // Internal refs — tidak trigger re-render
  const playingRef    = useRef(false);
  const offsetRef     = useRef(0);       // posisi scroll saat ini (float)
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const userScrollRef = useRef(false);   // true saat user lagi scroll manual
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPxPerSec = AUTO_SCROLL_SPEEDS[speedIdx].px;

  // ─── Core ticker ──────────────────────────────────────────────────────────

  const startTicker = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (!playingRef.current || userScrollRef.current) return;

      const pxPerTick = (AUTO_SCROLL_SPEEDS[speedIdx].px / 1000) * TICK_MS;
      offsetRef.current += pxPerTick;

      listRef.current?.scrollToOffset({
        offset: offsetRef.current,
        animated: false, // animated:true tiap 16ms = lag, false = smooth
      });
    }, TICK_MS);
  }, [speedIdx, listRef]);

  const stopTicker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ─── Play / Pause ─────────────────────────────────────────────────────────

  const play = useCallback(() => {
    playingRef.current = true;
    setIsPlaying(true);
    startTicker();
  }, [startTicker]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
    stopTicker();
  }, [stopTicker]);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [play, pause]);

  // ─── Speed control ────────────────────────────────────────────────────────

  const faster = useCallback(() => {
    setSpeedIdx(prev => {
      const next = Math.min(prev + 1, AUTO_SCROLL_SPEEDS.length - 1) as SpeedIndex;
      return next;
    });
  }, []);

  const slower = useCallback(() => {
    setSpeedIdx(prev => {
      const next = Math.max(prev - 1, 0) as SpeedIndex;
      return next;
    });
  }, []);

  const setSpeed = useCallback((idx: SpeedIndex) => {
    setSpeedIdx(idx);
  }, []);

  // Restart ticker setiap speedIdx berubah (biar px/tick ikut update)
  useEffect(() => {
    if (playingRef.current) {
      stopTicker();
      startTicker();
    }
  }, [speedIdx, startTicker, stopTicker]);

  // ─── Sync offset saat user scroll manual ──────────────────────────────────
  // Panggil ini dari onScroll FlashList supaya offsetRef selalu up-to-date

  const onScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    offsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  // Panggil dari onScrollBeginDrag — pause sementara saat user drag
  const onScrollBeginDrag = useCallback(() => {
    userScrollRef.current = true;

    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
  }, []);

  // Panggil dari onScrollEndDrag — resume setelah user lepas
  const onScrollEndDrag = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);

    // Delay resume 800ms supaya momentum scroll selesai dulu
    pauseTimerRef.current = setTimeout(() => {
      userScrollRef.current = false;
    }, 800);
  }, []);

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    pause();
    offsetRef.current = 0;
    setSpeedIdx(DEFAULT_SPEED_IDX);
  }, [pause]);

  useEffect(() => {
    return () => {
      stopTicker();
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [stopTicker]);

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    isPlaying,
    speedIdx,
    speedLabel: AUTO_SCROLL_SPEEDS[speedIdx].label,
    toggle,
    faster,
    slower,
    setSpeed,
    reset,
    // Event handlers — pasang langsung ke FlashList
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
  };
}

