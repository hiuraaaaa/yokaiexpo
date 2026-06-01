import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Modal, ScrollView, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring,
} from 'react-native-reanimated';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';

import { api, decodeSlug } from '@/hooks/api';
import { useTheme } from '@/hooks/theme';
import { historyStorage, progressStorage, readerSettingsStorage } from '@/hooks/storage';
import { ChapterPage, ReaderSettings } from '@/types';

const { width, height } = Dimensions.get('window');

// ─── Page Item ────────────────────────────────────────────────────────────────

function PageItem({ page, readerBg }: { page: ChapterPage; readerBg: string }) {
  const [imgH, setImgH] = useState(height * 0.8);

  Image.prefetch(page.url);

  return (
    <View style={{ width, backgroundColor: readerBg }}>
      <Image
        source={{ uri: page.url, priority: 'high', cachePolicy: 'memory-disk' }}
        style={{ width, height: imgH }}
        contentFit="contain"
        onLoad={e => {
          const { width: iw, height: ih } = e.source;
          if (iw && ih) setImgH((ih / iw) * width);
        }}
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
            <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 24 }} />
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, marginBottom: 20 }}>Pengaturan Baca</Text>

              {/* Background */}
              <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Background</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                {BG_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => { Haptics.selectionAsync(); onChange({ background: opt.value }); }}
                    style={{
                      flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', gap: 6,
                      backgroundColor: opt.color,
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

              {/* Keep screen on */}
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
                  <View style={{
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

  const chapterId   = decodeSlug(rawSlug ?? '');
  const chapterIdx  = parseInt(chapterIndex ?? '0');
  const chapterTitle = decodeURIComponent(title ?? 'Chapter');

  const [pages,    setPages]    = useState<ChapterPage[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const [settings, setSettings] = useState<ReaderSettings>(() => readerSettingsStorage.get());
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage]   = useState(0);

  const listRef  = useRef<FlashList<ChapterPage>>(null);
  const uiOpacity = useSharedValue(1);

  const BG_COLOR: Record<ReaderSettings['background'], string> = {
    black: '#000',
    white: '#fff',
    sepia: '#f4ecd8',
  };

  const readerBg = BG_COLOR[settings.background];

  // Load pages
  useEffect(() => {
    if (!chapterId) return;
    setLoading(true);
    api.chapter(chapterId)
      .then(res => {
        const data = res?.data ?? [];
        setPages(data);
        // Resume progress
        const prog = progressStorage.get(chapterId);
        if (prog && prog.pageIndex > 0 && listRef.current) {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: prog.pageIndex, animated: false });
          }, 500);
        }
      })
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, [chapterId]);

  // Keep screen awake
  useEffect(() => {
    if (settings.keepScreenOn) activateKeepAwakeAsync();
    else deactivateKeepAwake();
    return () => deactivateKeepAwake();
  }, [settings.keepScreenOn]);

  // Save history + progress on unmount
  useEffect(() => {
    return () => {
      if (komikId && pages.length > 0) {
        progressStorage.save(chapterId, currentPage, pages.length);
      }
    };
  }, [currentPage, pages.length]);

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

  return (
    <View style={[styles.container, { backgroundColor: readerBg }]}>
      <StatusBar hidden={!uiVisible} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.accent} size="large" />
          <Text style={{ color: theme.subtext, marginTop: 12 }}>Memuat chapter...</Text>
        </View>
      ) : (
        <FlashList
          ref={listRef}
          data={pages}
          estimatedItemSize={height * 0.8}
          keyExtractor={item => String(item.index)}
          onViewableItemsChanged={({ viewableItems }) => {
            if (viewableItems[0]) {
              const idx = viewableItems[0].index ?? 0;
              setCurrentPage(idx);
              // Save progress every 3 pages
              if (idx % 3 === 0) progressStorage.save(chapterId, idx, pages.length);
            }
          }}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={1} onPress={toggleUI}>
              <PageItem page={item} readerBg={readerBg} />
            </TouchableOpacity>
          )}
          ListFooterComponent={() => (
            <View style={{ paddingVertical: 40, alignItems: 'center', backgroundColor: readerBg, gap: 8 }}>
              <Ionicons name="checkmark-circle" size={40} color={theme.accent} />
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>Chapter Selesai!</Text>
              <TouchableOpacity onPress={() => router.back()} style={[styles.backToDetail, { borderColor: theme.accent }]}>
                <Text style={{ color: theme.accent, fontWeight: '700' }}>← Kembali ke Detail</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Top bar */}
      <Animated.View style={[styles.topBar, { paddingTop: insets.top + 8 }, navStyle]}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.topTitle} numberOfLines={1}>{chapterTitle}</Text>
          {pages.length > 0 && (
            <Text style={styles.topSub}>{currentPage + 1} / {pages.length}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.navBtn}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom progress bar */}
      {pages.length > 0 && (
        <Animated.View style={[styles.progressBar, { bottom: insets.bottom + 12 }, navStyle]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: `${((currentPage + 1) / pages.length) * 100}%`,
              backgroundColor: theme.accent,
            }]} />
          </View>
          <Text style={styles.progressText}>{currentPage + 1} / {pages.length}</Text>
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
    paddingBottom: 12, paddingHorizontal: 12,
    overflow: 'hidden',
  },
  navBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  topTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  topSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  progressBar: {
    position: 'absolute', left: 24, right: 24,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10,
    overflow: 'hidden',
  },
  progressTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },
  progressText:  { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', minWidth: 40, textAlign: 'right' },
  backToDetail:  { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 8 },
});
