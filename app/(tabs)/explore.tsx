import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';

import { api, getKomikParam } from '@/hooks/api';
import { useTheme } from '@/hooks/theme';
import { Komik, Genre } from '@/types';
import { KOMIK_TYPES } from '@/constants';
import KomikCard from '@/components/KomikCard';
import { KomikCardSkeleton } from '@/components/Skeleton';
import SearchModal from '@/components/SearchModal';

const { width } = Dimensions.get('window');
const NUM_COLS  = 4;
const CARD_W    = (width - 16 * 2 - 8 * (NUM_COLS - 1)) / NUM_COLS;
const SKELETON_COUNT = 16; // 4 cols x 4 rows

type FilterMode = 'latest' | 'populer' | 'top' | 'type' | 'genre' | 'colored';

const FILTER_TABS: { key: FilterMode; label: string; icon: any }[] = [
  { key: 'latest',  label: 'Terbaru',  icon: 'time-outline' },
  { key: 'populer', label: 'Populer',  icon: 'flame-outline' },
  { key: 'top',     label: 'Top',      icon: 'trophy-outline' },
  { key: 'type',    label: 'Tipe',     icon: 'layers-outline' },
  { key: 'genre',   label: 'Genre',    icon: 'grid-outline' },
  { key: 'colored', label: 'Berwarna', icon: 'color-palette-outline' },
];

// ─── Skeleton Grid ────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <View
          key={i}
          style={{
            width: CARD_W,
            marginRight: (i % NUM_COLS) < NUM_COLS - 1 ? 8 : 0,
            marginBottom: 14,
          }}
        >
          <KomikCardSkeleton cardWidth={CARD_W} />
        </View>
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const theme  = useTheme();
  const router = useRouter();

  const [data,        setData]        = useState<Komik[]>([]);
  const [genres,      setGenres]      = useState<Genre[]>([]);
  // "initialLoad" = belum ada data sama sekali (first open / ganti filter)
  // "refreshing"  = ada data lama, lagi fetch yang baru (di-bg, user masih bisa liat)
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [filterMode,  setFilterMode]  = useState<FilterMode>('latest');
  const [activeType,  setActiveType]  = useState('manhwa');
  const [activeGenre, setActiveGenre] = useState('');
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [page,        setPage]        = useState(1);

  // Track filter state buat cancel stale response
  const fetchId = useRef(0);

  const loadData = useCallback(async (
    mode: FilterMode, type: string, genre: string, pg: number, hasExistingData: boolean,
  ) => {
    const id = ++fetchId.current;

    if (hasExistingData) {
      setRefreshing(true);
    } else {
      setInitialLoad(true);
    }

    try {
      let res;
      if (mode === 'latest')       res = await api.latest();
      else if (mode === 'populer') res = await api.populer();
      else if (mode === 'top')     res = await api.top();
      else if (mode === 'type')    res = await api.byType(type);
      else if (mode === 'genre')   res = await api.byGenre(genre);
      else if (mode === 'colored') res = await api.komikBerwarna(pg);
      else                         res = await api.latest();

      // Abaikan kalau sudah ada request lebih baru
      if (id !== fetchId.current) return;

      setData(res?.data ?? []);
    } catch {
      if (id !== fetchId.current) return;
      setData([]);
    } finally {
      if (id !== fetchId.current) return;
      setInitialLoad(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Kalau filter berubah, clear data lama supaya skeleton muncul
    setData([]);
    setInitialLoad(true);
    loadData(filterMode, activeType, activeGenre, page, false);
  }, [filterMode, activeType, activeGenre, page]);

  useEffect(() => {
    api.genres().then(r => setGenres(r.data ?? []));
  }, []);

  const setFilter = (mode: FilterMode) => {
    if (mode === filterMode) return; // no-op kalau sama
    setFilterMode(mode);
    setPage(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Explore</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Indikator refresh kecil — ga ganggu tapi keliatan ada aktivitas */}
            {refreshing && (
              <View style={[styles.refreshDot, { backgroundColor: theme.accent }]} />
            )}
            <TouchableOpacity
              onPress={() => setSearchOpen(true)}
              style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Ionicons name="search-outline" size={18} color={theme.subtext} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_TABS.map(tab => {
            const active = filterMode === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={[styles.filterTab, {
                  backgroundColor: active ? theme.accent : theme.card,
                  borderColor:     active ? theme.accent : theme.border,
                }]}
              >
                <Ionicons name={tab.icon} size={12} color={active ? theme.bg : theme.subtext} />
                <Text style={[styles.filterTabText, { color: active ? theme.bg : theme.subtext }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Type sub-filter */}
        {filterMode === 'type' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {KOMIK_TYPES.map(t => {
              const active = activeType === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setActiveType(t)}
                  style={[styles.filterTab, {
                    backgroundColor: active ? `${theme.accent}25` : 'transparent',
                    borderColor:     active ? theme.accent : theme.border,
                  }]}
                >
                  <Text style={[styles.filterTabText, { color: active ? theme.accent : theme.subtext }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Genre sub-filter */}
        {filterMode === 'genre' && genres.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {genres.map(g => {
              const active = activeGenre === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setActiveGenre(g.id)}
                  style={[styles.filterTab, {
                    backgroundColor: active ? `${theme.accent}25` : 'transparent',
                    borderColor:     active ? theme.accent : theme.border,
                  }]}
                >
                  <Text style={[styles.filterTabText, { color: active ? theme.accent : theme.subtext }]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

      </SafeAreaView>

      {/* Content area */}
      {initialLoad ? (
        // Belum ada data → tampilin skeleton grid
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <SkeletonGrid />
        </ScrollView>
      ) : (
        // Ada data → tampilin langsung, refresh indicator cuma dot kecil di header
        <FlashList
          data={data}
          numColumns={NUM_COLS}
          estimatedItemSize={CARD_W * 1.5}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item, index }) => (
            <View style={{
              flex: 1,
              marginRight: (index % NUM_COLS) < NUM_COLS - 1 ? 8 : 0,
              marginBottom: 14,
            }}>
              <KomikCard
                komik={item}
                onPress={() => router.push(`/detail/${getKomikParam(item)}`)}
              />
            </View>
          )}
        />
      )}

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title:         { fontSize: 22, fontWeight: '900' },
  iconBtn:       { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  filterRow:     { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterTab:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterTabText: { fontSize: 12, fontWeight: '700' },
  skeletonGrid:  { flexDirection: 'row', flexWrap: 'wrap' },
  refreshDot:    { width: 7, height: 7, borderRadius: 4, opacity: 0.8 },
});
