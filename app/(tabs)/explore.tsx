import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator,
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
import SearchModal from '@/components/SearchModal';

const { width } = Dimensions.get('window');
const NUM_COLS  = 4;
const CARD_W    = (width - 16 * 2 - 8 * (NUM_COLS - 1)) / NUM_COLS;

type FilterMode = 'latest' | 'populer' | 'top' | 'type' | 'genre' | 'colored';

const FILTER_TABS: { key: FilterMode; label: string; icon: any }[] = [
  { key: 'latest',  label: 'Terbaru',  icon: 'time-outline' },
  { key: 'populer', label: 'Populer',  icon: 'flame-outline' },
  { key: 'top',     label: 'Top',      icon: 'trophy-outline' },
  { key: 'type',    label: 'Tipe',     icon: 'layers-outline' },
  { key: 'genre',   label: 'Genre',    icon: 'grid-outline' },
  { key: 'colored', label: 'Berwarna', icon: 'color-palette-outline' },
];

export default function ExploreScreen() {
  const theme  = useTheme();
  const router = useRouter();

  const [data,        setData]        = useState<Komik[]>([]);
  const [genres,      setGenres]      = useState<Genre[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filterMode,  setFilterMode]  = useState<FilterMode>('latest');
  const [activeType,  setActiveType]  = useState('manhwa');
  const [activeGenre, setActiveGenre] = useState('');
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [page,        setPage]        = useState(1);

  const loadData = useCallback(async (mode: FilterMode, type: string, genre: string, pg = 1) => {
    setLoading(true);
    try {
      let res;
      if (mode === 'latest')       res = await api.latest();
      else if (mode === 'populer') res = await api.populer();
      else if (mode === 'top')     res = await api.top();
      else if (mode === 'type')    res = await api.byType(type);
      else if (mode === 'genre')   res = await api.byGenre(genre);
      else if (mode === 'colored') res = await api.komikBerwarna(pg);
      else                         res = await api.latest();
      setData(res?.data ?? []);
    } catch { setData([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData(filterMode, activeType, activeGenre, page);
  }, [filterMode, activeType, activeGenre, page]);

  useEffect(() => {
    api.genres().then(r => setGenres(r.data ?? []));
  }, []);

  const setFilter = (mode: FilterMode) => { setFilterMode(mode); setPage(1); };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Explore</Text>
          <TouchableOpacity
            onPress={() => setSearchOpen(true)}
            style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="search-outline" size={18} color={theme.subtext} />
          </TouchableOpacity>
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

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      ) : (
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
});
