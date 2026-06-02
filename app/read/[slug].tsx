import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Modal, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';

import { api, decodeSlug } from '@/hooks/api';
import { useTheme } from '@/hooks/theme';
import { progressStorage, readerSettingsStorage } from '@/hooks/storage';
import { ChapterPage, ReaderSettings } from '@/types';

const { width, height } = Dimensions.get('window');

// Aspect ratio default manhwa = portrait panjang (2:3 → 1.5)
// Ini dipakai sebagai estimatedItemSize dan placeholder sebelum gambar load
const DEFAULT_ASPECT = 1.5;
const DEFAULT_IMG_H  = Math.round(width * DEFAULT_ASPECT);

const BG_COLOR: Record<ReaderSettings['background'], string> = {
  black: '#000',
  white: '#fff',
  sepia: '#f4ecd8',
};

// ─── Cache ukuran gambar ──────────────────────────────────────────────────────
// Disimpan di luar komponen supaya persist antar render & ga bikin re-fetch
const imgHeightCache = new Map<string, number>();

// ─── Page Item ────────────────────────────────────────────────────────────────
function PageItem({
  page, readerBg, onHeightKnown,
}: {
  page: ChapterPage;
  readerBg: string;
  onHeightKnown: (url: string, h: number) => void;
}) {
  // Pakai cached height kalau ada, baru fallback ke default
  const cachedH  = imgHeightCache.get(page.url);
  const [imgH, setImgH] = useState<number>(cachedH ?? DEFAULT_IMG_H);
  const [loaded, setLoaded] = useState(!!cachedH); // kalau cache ada, langsung "loaded"

  const handleLoad = useCallback((e: any) => {
    const { width: iw, height: ih } = e.source;
    if (iw && ih) {
      const h = Math.round((ih / iw) * width);
      imgHeightCache.set(page.url, h);
      setImgH(h);
      onHeightKnown(page.url, h);
    }
    setLoaded(true);
  }, [page.url, onHeightKnown]);

  return (
    // Height sudah diketahui dari awal (cache atau default) → tidak ada layout shift
    <View style={{ width, height: imgH, backgroundColor: readerBg }}>
      {/* Placeholder shimmer tipis supaya ga keliatan blank */}
      {!loaded && (
        <View style={[StyleSheet.absoluteFillObject, {
          backgroundColor: readerBg === '#000' ? '#111' : readerBg === '#fff' ? '#eee' : '#e8dcc8',
        }]} />
      )}
      <Image
        source={{ uri: page.url, priority: 'high', cachePolicy: 'memory-disk' }}
        style={{ width, height: imgH }}
        contentFit="contain"
        onLoad={handleLoad}
        // Jangan pakai recyclingKey — bikin gambar flicker saat scroll cepat
      />
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

              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, marginBottom: 20 }}>
                Pengaturan Baca
              </Text>

              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
                Background
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                {BG_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => { Haptics.selectionAsync(); onChange({ background: opt.value }); }}
                    style={{
                      flex: 1, paddingVertical: 14, borderRadius: 12,
                      alignItems: 'center', gap: 6,
                      backgroundColor: opt.color,
                      borderWidth: settings.background === opt.value ? 2 : 1,
                      borderColor: settings.background === opt.value ? theme.accent : 'rgba(128,128,128,0.3)',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: opt.value === 'black' ? '#fff' : '#111' }}>
                      {opt.label}
                    </Text>
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

  const { slug: rawSlug, komikId, chapterIndex, title } = useLocalSearchParams<{
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

  // Map url → height yang sudah diketahui, trigger re-render FlashList
  // supaya estimatedItemSize akurat setelah gambar pertama load
  const [knownHeights, setKnownHeights] = useState<Record<string, number>>({});

  const listRef   = useRef<FlashList<ChapterPage>>(null);
  const uiOpacity = useSharedValue(1);

  const readerBg = BG_COLOR[settings.background];

  // Callback dari PageItem saat height diketahui
  const handleHeightKnown = useCallback((url: string, h: number) => {
    setKnownHeights(prev => {
      if (prev[url] === h) return prev; // no-op kalau sama
      return { ...prev, [url]: h };
    });
  }, []);

  // estimatedItemSize = rata-rata dari semua height yang sudah diketahui
  // Makin banyak gambar yang load, makin akurat → scroll makin stabil
  const estimatedItemSize = useMemo(() => {
    const vals = Object.values(knownHeights);
    if (vals.length === 0) return DEFAULT_IMG_H;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [knownHeights]);

  useEffect(() => {
    if (!chapterId) return;
    setLoading(true);
    setPages([]);
    setCurrentPage(0);
    setKnownHeights({});
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
      if (chapterId && pages.length > 0) {
        progressStorage.save(chapterId, currentPage, pages.length);
      }
    };
  }, [currentPage, pages.length, chapterId]);

  const toggleUI = useCallback(() => {
    const next = !uiVisible;
    setUiVisible(next);
    uiOpacity.value = withTiming(next ? 1 : 0, { duration: 200 });
  }, [uiVisible]);

  const updateSettings = (partial: Partial<ReaderSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    readerSettingsStorage.set(partial);
  };

  const navStyle = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
    pointerEvents: uiVisible ? 'auto' : 'none',
  }));

  const progress = pages.length > 0 ? ((currentPage + 1) / pages.length) * 100 : 0;

  // renderItem di-memoize supaya FlashList ga re-render semua item saat state berubah
  const renderItem = useCallback(({ item }: { item: ChapterPage }) => (
    <TouchableOpacity activeOpacity={1} onPress={toggleUI}>
      <PageItem page={item} readerBg={readerBg} onHeightKnown={handleHeightKnown} />
    </TouchableOpacity>
  ), [readerBg, toggleUI, handleHeightKnown]);

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
          estimatedItemSize={estimatedItemSize}
          keyExtractor={item => `${listKey}-${item.index}`}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          // drawDistance lebih besar = pre-load gambar lebih jauh di luar viewport
          // Default 250, naik ke 600 supaya gambar sudah siap sebelum user sampai
          drawDistance={600}
          onViewableItemsChanged={({ viewableItems }) => {
            if (viewableItems.length > 0) {
              const idx = viewableItems[0].index ?? 0;
              setCurrentPage(idx);
              if (idx % 3 === 0) progressStorage.save(chapterId, idx, pages.length);
            }
          }}
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

      {/* Top Bar */}
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

      {/* Bottom Progress */}
      {pages.length > 0 && (
        <Animated.View style={[styles.progressBar, { bottom: insets.bottom + 16 }, navStyle]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 }]} />
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: theme.accent }]}>
            {Math.round(progress)}%
          </Text>
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
    paddingBottom: 14, paddingHorizontal: 12,
    overflow: 'hidden',
  },
  navBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  topSub:   { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 },
  progressBar: {
    position: 'absolute', left: 20, right: 20,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10,
    overflow: 'hidden',
  },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill:  { height: '100%', borderRadius: 2 },
  progressText:  { fontSize: 11, fontWeight: '800', minWidth: 36, textAlign: 'right' },
  backToDetail:  {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, marginTop: 8,
  },
});
