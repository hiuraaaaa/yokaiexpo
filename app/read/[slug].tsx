import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Modal, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withRepeat, cancelAnimation, interpolate,
} from 'react-native-reanimated';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';

import { api, decodeSlug } from '@/hooks/api';
import { useTheme } from '@/hooks/theme';
import { progressStorage, readerSettingsStorage } from '@/hooks/storage';
import { useAutoScroll, AUTO_SCROLL_SPEEDS, SpeedIndex } from '@/hooks/useAutoScroll';
import { ChapterPage, ReaderSettings } from '@/types';

const { width } = Dimensions.get('window');
const DEFAULT_IMG_H = Math.round(width * 1.5);

const BG_COLOR: Record<ReaderSettings['background'], string> = {
  black: '#000',
  white: '#fff',
  sepia: '#f4ecd8',
};

const imgHeightCache = new Map<string, number>();

// ─── Shimmer ──────────────────────────────────────────────────────────────────
function ShimmerPlaceholder({ readerBg }: { readerBg: string }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    return () => cancelAnimation(shimmer);
  }, []);

  const base = readerBg === '#000' ? 20 : readerBg === '#fff' ? 220 : 210;
  const glow = readerBg === '#000' ? 42 : readerBg === '#fff' ? 200 : 192;

  const animStyle = useAnimatedStyle(() => {
    const v = Math.round(interpolate(shimmer.value, [0, 1], [base, glow]));
    return { backgroundColor: `rgb(${v},${v},${v})` };
  });

  return <Animated.View style={[StyleSheet.absoluteFillObject, animStyle]} />;
}

// ─── Page Item ────────────────────────────────────────────────────────────────
function PageItem({ page, readerBg }: { page: ChapterPage; readerBg: string }) {
  const cached = imgHeightCache.get(page.url);
  const [imgH,   setImgH]  = useState<number>(cached ?? DEFAULT_IMG_H);
  const [loaded, setLoaded] = useState(!!cached);

  const handleLoad = useCallback((e: any) => {
    const { width: iw, height: ih } = e.source;
    if (iw && ih) {
      const h = Math.round((ih / iw) * width);
      imgHeightCache.set(page.url, h);
      setImgH(h);
    }
    setLoaded(true);
  }, [page.url]);

  return (
    <View style={{ width, height: imgH, backgroundColor: readerBg }}>
      {!loaded && <ShimmerPlaceholder readerBg={readerBg} />}
      <Image
        source={{ uri: page.url, priority: 'high', cachePolicy: 'memory-disk' }}
        style={{ width, height: imgH }}
        contentFit="contain"
        onLoad={handleLoad}
      />
    </View>
  );
}

// ─── Speed Picker ─────────────────────────────────────────────────────────────
function SpeedPicker({ speedIdx, onSelect }: {
  speedIdx: SpeedIndex;
  onSelect: (i: SpeedIndex) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.speedPicker}>
      {AUTO_SCROLL_SPEEDS.map((s, i) => {
        const active = i === speedIdx;
        return (
          <TouchableOpacity
            key={s.label}
            onPress={() => { Haptics.selectionAsync(); onSelect(i as SpeedIndex); }}
            style={[styles.speedBtn, {
              backgroundColor: active ? theme.accent : 'rgba(255,255,255,0.08)',
              borderColor:     active ? theme.accent : 'rgba(255,255,255,0.15)',
            }]}
          >
            <Text style={[styles.speedBtnText, { color: active ? '#000' : 'rgba(255,255,255,0.7)' }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Settings Sheet ───────────────────────────────────────────────────────────
function SettingsSheet({ visible, settings, onClose, onChange }: {
  visible: boolean;
  settings: ReaderSettings;
  onClose: () => void;
  onChange: (s: Partial<ReaderSettings>) => void;
}) {
  const theme = useTheme();
  const BG_OPTIONS: { value: ReaderSettings['background']; label: string; color: string }[] = [
    { value: 'black', label: 'Hitam', color: '#000' },
    { value: 'white', label: 'Putih', color: '#fff' },
    { value: 'sepia', label: 'Sepia', color: '#f4ecd8' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={40} tint="dark" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1}>
            <View style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, paddingBottom: 48,
              borderWidth: 1, borderColor: theme.border,
            }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 24 }} />
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, marginBottom: 20 }}>Pengaturan Baca</Text>
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Background</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                {BG_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => { Haptics.selectionAsync(); onChange({ background: opt.value }); }}
                    style={{
                      flex: 1, paddingVertical: 14, borderRadius: 12,
                      alignItems: 'center', gap: 6, backgroundColor: opt.color,
                      borderWidth: settings.background === opt.value ? 2 : 1,
                      borderColor: settings.background === opt.value ? theme.accent : 'rgba(128,128,128,0.3)',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: opt.value === 'black' ? '#fff' : '#111' }}>{opt.label}</Text>
                    {settings.background === opt.value && (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
                <View>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Layar Tetap Nyala</Text>
                  <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>Cegah layar mati saat baca</Text>
                </View>
                <TouchableOpacity
                  onPress={() => { Haptics.selectionAsync(); onChange({ keepScreenOn: !settings.keepScreenOn }); }}
                  style={{
                    width: 48, height: 28, borderRadius: 14, justifyContent: 'center',
                    backgroundColor: settings.keepScreenOn ? theme.accent : theme.border,
                    paddingHorizontal: 3,
                  }}
                >
                  <Animated.View style={{
                    width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
                    transform: [{ translateX: settings.keepScreenOn ? 20 : 0 }],
                  }} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Reader ──────────────────────────────────────────────────────────────
export default function ReaderScreen() {
  const theme  = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { slug: rawSlug, title } = useLocalSearchParams<{
    slug: string; komikId: string; chapterIndex: string; title: string;
  }>();

  const chapterId    = decodeSlug(rawSlug ?? '');
  const chapterTitle = decodeURIComponent(title ?? 'Chapter');

  const [pages,        setPages]        = useState<ChapterPage[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [uiVisible,    setUiVisible]    = useState(true);
  const [settings,     setSettings]     = useState<ReaderSettings>(() => readerSettingsStorage.get());
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage,  setCurrentPage]  = useState(0);
  const [listKey,      setListKey]      = useState(chapterId);
  const [showSpeed,    setShowSpeed]    = useState(false);

  const listRef       = useRef<FlashList<ChapterPage>>(null);
  const uiOpacity     = useSharedValue(1);
  const currentPageRef = useRef(0);

  const readerBg = BG_COLOR[settings.background];

  // ── Auto scroll ────────────────────────────────────────────────────────────
  const autoScroll = useAutoScroll(listRef);

  // Reset auto scroll saat ganti chapter
  useEffect(() => {
    autoScroll.reset();
  }, [chapterId]);

  useEffect(() => {
    if (!chapterId) return;
    setLoading(true);
    setPages([]);
    setCurrentPage(0);
    currentPageRef.current = 0;
    setListKey(chapterId);

    api.chapter(chapterId)
      .then(res => setPages(res?.data ?? []))
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, [chapterId]);

  useEffect(() => {
    if (settings.keepScreenOn) activateKeepAwakeAsync();
    else deactivateKeepAwake();
    return () => deactivateKeepAwake();
  }, [settings.keepScreenOn]);

  useEffect(() => {
    return () => {
      if (chapterId && pages.length > 0)
        progressStorage.save(chapterId, currentPageRef.current, pages.length);
    };
  }, [pages.length, chapterId]);

  const toggleUI = useCallback(() => {
    const next = !uiVisible;
    setUiVisible(next);
    uiOpacity.value = withTiming(next ? 1 : 0, { duration: 200 });
    // Tutup speed picker kalau UI disembunyiin
    if (!next) setShowSpeed(false);
  }, [uiVisible]);

  const updateSettings = useCallback((partial: Partial<ReaderSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
    readerSettingsStorage.set(partial);
  }, []);

  const navStyle = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
    pointerEvents: uiVisible ? 'auto' : 'none',
  }));

  const progress = pages.length > 0 ? ((currentPage + 1) / pages.length) * 100 : 0;

  const renderItem = useCallback(({ item }: { item: ChapterPage }) => (
    <TouchableOpacity activeOpacity={1} onPress={toggleUI}>
      <PageItem page={item} readerBg={readerBg} />
    </TouchableOpacity>
  ), [readerBg, toggleUI]);

  const handleViewableChange = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      currentPageRef.current = idx;
      setCurrentPage(idx);
      if (idx % 3 === 0) progressStorage.save(chapterId, idx, pages.length);
    }
  }, [chapterId, pages.length]);

  return (
    <View style={[styles.container, { backgroundColor: readerBg }]}>
      <StatusBar hidden={!uiVisible} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={theme.accent} size="large" />
          <Text style={{ color: theme.subtext, fontSize: 13 }}>Memuat chapter...</Text>
        </View>
      ) : pages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Ionicons name="image-outline" size={48} color={theme.subtext} />
          <Text style={{ color: theme.subtext, fontSize: 14 }}>Halaman tidak tersedia</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backToDetail, { borderColor: theme.accent }]}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>← Kembali</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          key={listKey}
          ref={listRef}
          data={pages}
          estimatedItemSize={DEFAULT_IMG_H}
          keyExtractor={item => `${listKey}-${item.index}`}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          drawDistance={800}
          // ── Auto scroll handlers ──
          onScroll={autoScroll.onScroll}
          onScrollBeginDrag={autoScroll.onScrollBeginDrag}
          onScrollEndDrag={autoScroll.onScrollEndDrag}
          scrollEventThrottle={16}
          // ─────────────────────────
          onViewableItemsChanged={handleViewableChange}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          renderItem={renderItem}
          ListFooterComponent={() => (
            <View style={{ paddingVertical: 48, alignItems: 'center', backgroundColor: readerBg, gap: 10 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: `${theme.accent}20`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle" size={36} color={theme.accent} />
              </View>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18 }}>Chapter Selesai!</Text>
              <Text style={{ color: theme.subtext, fontSize: 12 }}>{pages.length} halaman dibaca</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backToDetail, { borderColor: theme.accent, backgroundColor: `${theme.accent}15` }]}
              >
                <Ionicons name="arrow-back" size={14} color={theme.accent} />
                <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 13 }}>Kembali ke Detail</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* ── Top Bar ── */}
      <Animated.View style={[styles.topBar, { paddingTop: insets.top + 8 }, navStyle]}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.topTitle} numberOfLines={1}>{chapterTitle}</Text>
          {pages.length > 0 && (
            <Text style={styles.topSub}>{currentPage + 1} / {pages.length} halaman</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.navBtn}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Bottom Bar: Progress + Auto Scroll Control ── */}
      {pages.length > 0 && (
        <Animated.View style={[styles.bottomBar, { bottom: insets.bottom + 12 }, navStyle]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 24 }]} />

          {/* Speed picker — muncul di atas bottom bar */}
          {showSpeed && (
            <SpeedPicker
              speedIdx={autoScroll.speedIdx}
              onSelect={(i) => { autoScroll.setSpeed(i); }}
            />
          )}

          <View style={styles.bottomContent}>
            {/* Progress bar + persen */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.accent }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.accent }]}>
              {Math.round(progress)}%
            </Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Tombol kecepatan */}
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setShowSpeed(v => !v); }}
              style={[styles.autoBtn, {
                backgroundColor: showSpeed ? `${theme.accent}25` : 'transparent',
                borderColor: showSpeed ? theme.accent : 'rgba(255,255,255,0.2)',
              }]}
            >
              <Text style={[styles.autoBtnSpeed, { color: autoScroll.isPlaying ? theme.accent : 'rgba(255,255,255,0.6)' }]}>
                {autoScroll.speedLabel}
              </Text>
            </TouchableOpacity>

            {/* Tombol Play / Pause */}
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); autoScroll.toggle(); }}
              style={[styles.playBtn, { backgroundColor: autoScroll.isPlaying ? theme.accent : 'rgba(255,255,255,0.12)' }]}
            >
              <Ionicons
                name={autoScroll.isPlaying ? 'pause' : 'play'}
                size={16}
                color={autoScroll.isPlaying ? '#000' : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <SettingsSheet
        visible={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onChange={updateSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 14, paddingHorizontal: 12, overflow: 'hidden',
  },
  navBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  topSub:   { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 },

  // ── Bottom ──
  bottomBar: {
    position: 'absolute', left: 16, right: 16,
    borderRadius: 24, overflow: 'hidden',
  },
  bottomContent: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 11, fontWeight: '800', minWidth: 32, textAlign: 'right' },
  divider:      { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.15)' },

  // ── Auto scroll controls ──
  autoBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  autoBtnSpeed: { fontSize: 11, fontWeight: '800' },
  playBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Speed picker ──
  speedPicker: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6,
  },
  speedBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  speedBtnText: { fontSize: 11, fontWeight: '800' },

  backToDetail: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, marginTop: 8,
  },
});
