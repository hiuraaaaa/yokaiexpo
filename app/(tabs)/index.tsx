import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, StyleSheet,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { api, getKomikParam, shuffleArray } from '@/hooks/api';
import { useTheme } from '@/hooks/theme';
import { Komik } from '@/types';
import { APP_NAME } from '@/constants';
import KomikCard from '@/components/KomikCard';
import SearchModal from '@/components/SearchModal';
import { HeroSkeleton, SectionSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');
const CARD_W = width / 3 - 14;
const HERO_H = 240;

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ komik, onPress }: { komik: Komik; onPress: () => void }) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.heroWrapper}>
      <FastImage
        source={{ uri: komik.image_cover || komik.image_poster, priority: FastImage.priority.high }}
        style={styles.heroImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <LinearGradient
        colors={['transparent', `${theme.bg}dd`, theme.bg]}
        style={styles.heroGradient}
      />
      <View style={styles.heroInfo}>
        {komik.type ? (
          <View style={[styles.heroBadge, { backgroundColor: `${theme.accent}25`, borderColor: `${theme.accent}50` }]}>
            <Text style={[styles.heroBadgeText, { color: theme.accent }]}>{komik.type.toUpperCase()}</Text>
          </View>
        ) : null}
        <Text style={[styles.heroTitle, { color: theme.text }]} numberOfLines={2}>{komik.title}</Text>
        {komik.genre ? (
          <Text style={[styles.heroGenre, { color: theme.subtext }]} numberOfLines={1}>{komik.genre}</Text>
        ) : null}
        <TouchableOpacity
          onPress={onPress}
          style={[styles.heroBtn, { backgroundColor: theme.accent }]}
        >
          <Ionicons name="book-outline" size={14} color={theme.bg} />
          <Text style={[styles.heroBtnText, { color: theme.bg }]}>Baca Sekarang</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: theme.accent }]} />
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: theme.accent }]}>Lihat semua →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Horizontal Row ───────────────────────────────────────────────────────────
function HorizontalRow({ data, onPress }: { data: Komik[]; onPress: (k: Komik) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {data.slice(0, 12).map(item => (
        <KomikCard key={item.id} komik={item} onPress={() => onPress(item)} width={CARD_W} />
      ))}
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const theme  = useTheme();
  const router = useRouter();

  const [latest,       setLatest]       = useState<Komik[]>([]);
  const [populer,      setPopuler]      = useState<Komik[]>([]);
  const [top,          setTop]          = useState<Komik[]>([]);
  const [rekomendasi,  setRekomendasi]  = useState<Komik[]>([]);
  const [heroKomik,    setHeroKomik]    = useState<Komik | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [latestRes, populerRes, topRes, rekomenRes] = await api.home();
      setLatest(latestRes.data ?? []);
      setPopuler(populerRes.data ?? []);
      setTop(topRes.data ?? []);
      setRekomendasi(rekomenRes.data ?? []);

      // Pick random hero from populer or latest
      const pool = [...(populerRes.data ?? []), ...(latestRes.data ?? [])];
      const withCover = pool.filter(k => k.image_cover || k.image_poster);
      if (withCover.length > 0) {
        setHeroKomik(shuffleArray(withCover)[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const goDetail = (komik: Komik) => {
    router.push(`/detail/${getKomikParam(komik)}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.accent }]}>{APP_NAME}</Text>
          <TouchableOpacity onPress={() => setSearchOpen(true)} style={[styles.searchBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={16} color={theme.subtext} />
            <Text style={[styles.searchPlaceholder, { color: theme.subtext }]}>Cari komik...</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero */}
        {loading ? <HeroSkeleton /> : heroKomik ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <HeroBanner komik={heroKomik} onPress={() => goDetail(heroKomik)} />
          </Animated.View>
        ) : null}

        {/* Latest */}
        {loading ? <SectionSkeleton /> : latest.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ marginTop: 24 }}>
            <SectionHeader title="Terbaru" onSeeAll={() => router.push('/(tabs)/explore')} />
            <HorizontalRow data={latest} onPress={goDetail} />
          </Animated.View>
        ) : null}

        {/* Populer */}
        {loading ? <SectionSkeleton /> : populer.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={{ marginTop: 24 }}>
            <SectionHeader title="Populer" onSeeAll={() => router.push('/(tabs)/browse')} />
            <HorizontalRow data={populer} onPress={goDetail} />
          </Animated.View>
        ) : null}

        {/* Top Ranking */}
        {!loading && top.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(240).duration(400)} style={{ marginTop: 24 }}>
            <SectionHeader title="Top Ranking" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
              {top.slice(0, 10).map((item, idx) => (
                <TouchableOpacity key={item.id} onPress={() => goDetail(item)} activeOpacity={0.85}>
                  <View style={{ width: CARD_W + 10 }}>
                    <View style={{ position: 'relative' }}>
                      <FastImage
                        source={{ uri: item.image_poster }}
                        style={{ width: CARD_W + 10, aspectRatio: 2 / 3, borderRadius: 10 }}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                      {/* Rank number */}
                      <View style={[styles.rankBadge, { backgroundColor: theme.accent }]}>
                        <Text style={[styles.rankText, { color: theme.bg }]}>#{idx + 1}</Text>
                      </View>
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {/* Rekomendasi */}
        {!loading && rekomendasi.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(320).duration(400)} style={{ marginTop: 24 }}>
            <SectionHeader title="Rekomendasi" />
            <HorizontalRow data={rekomendasi} onPress={goDetail} />
          </Animated.View>
        ) : null}
      </ScrollView>

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 12,
  },
  logo: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  searchBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, height: 38, borderRadius: 12, borderWidth: 1,
  },
  searchPlaceholder: { fontSize: 13 },
  heroWrapper: { marginHorizontal: 16, marginTop: 8, borderRadius: 16, overflow: 'hidden', height: HERO_H },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO_H * 0.75 },
  heroInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  heroBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, marginBottom: 6 },
  heroBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: { fontSize: 18, fontWeight: '900', lineHeight: 24, marginBottom: 4 },
  heroGenre: { fontSize: 11, marginBottom: 10 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  heroBtnText: { fontSize: 12, fontWeight: '800' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12, gap: 8,
  },
  sectionDot: { width: 4, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', flex: 1 },
  seeAll: { fontSize: 12, fontWeight: '600' },
  rankBadge: {
    position: 'absolute', bottom: 6, left: 6,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  rankText: { fontSize: 10, fontWeight: '900' },
  cardTitle: { fontSize: 10, fontWeight: '600', marginTop: 6, lineHeight: 14 },
});
