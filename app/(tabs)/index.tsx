import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Share, StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn, FadeOut, FadeInDown,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import firestore from '@react-native-firebase/firestore';

import { api, getKomikParam, shuffleArray } from '@/hooks/api';
import { useTheme } from '@/hooks/theme';
import { Komik } from '@/types';
import { APP_NAME } from '@/constants';
import KomikCard from '@/components/KomikCard';
import SearchModal from '@/components/SearchModal';
import { HeroSkeleton, SectionSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');
const CARD_W = (width - 32 - 24) / 4;
const LOGO_URL  = 'https://raw.githubusercontent.com/hiuraaaaa/assets/main/yoaki-icon.png';

const TYPE_COLORS: Record<string, string> = {
  info:        '#4a9eff',
  warning:     '#F6CF80',
  promo:       '#2ecc71',
  maintenance: '#e63946',
};

const TYPE_ICONS: Record<string, string> = {
  info:        'information-circle-outline',
  warning:     'warning-outline',
  promo:       'gift-outline',
  maintenance: 'construct-outline',
};

// ─── Announcement Banner ──────────────────────────────────────────────────────
function AnnouncementBanner({ item, onDismiss }: { item: any; onDismiss: () => void }) {
  const theme = useTheme();
  const color = TYPE_COLORS[item.type] ?? '#4a9eff';
  const icon  = TYPE_ICONS[item.type]  ?? 'information-circle-outline';

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      exiting={FadeOut.duration(200)}
      style={{
        marginHorizontal: 16, marginTop: 12,
        borderRadius: 14, overflow: 'hidden',
        backgroundColor: theme.card,
        borderWidth: 1, borderColor: theme.border,
        borderLeftWidth: 4, borderLeftColor: color,
      }}
    >
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={{ width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}20` }}>
            <Ionicons name={icon as any} size={14} color={color} />
          </View>
          <Text style={{ color, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>
            {item.type ?? 'Info'}
          </Text>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={theme.subtext} />
          </TouchableOpacity>
        </View>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13, marginBottom: 4 }}>{item.title}</Text>
        <Text style={{ color: theme.subtext, fontSize: 11, lineHeight: 17 }}>{item.body}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onSeeAll}
      activeOpacity={onSeeAll ? 0.7 : 1}
      style={{ paddingHorizontal: 16, marginBottom: 14 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: -0.5, flex: 1 }}>
          {title}
        </Text>
        {onSeeAll && <Text style={{ color: theme.subtext, fontSize: 18, fontWeight: '900' }}>›</Text>}
      </View>
      {subtitle && (
        <Text style={{ color: theme.subtext, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Rank Item ────────────────────────────────────────────────────────────────
function RankItem({ komik, index, onPress }: { komik: Komik; index: number; onPress: () => void }) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); Haptics.selectionAsync(); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        activeOpacity={1}
        style={{
          marginBottom: 10, borderRadius: 14, overflow: 'hidden',
          flexDirection: 'row', alignItems: 'center', height: 80,
          backgroundColor: theme.card, borderWidth: 1,
          borderColor: index < 3 ? theme.accentDim : theme.border,
        }}
      >
        <Image
          source={{ uri: komik.image_cover || komik.image_poster }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '55%', opacity: 0.5 }}
          contentFit="cover"
        />
        <LinearGradient
          colors={[theme.card, theme.card, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '75%' }}
        />
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          alignItems: 'center', justifyContent: 'center',
          marginLeft: 14, marginRight: 14, zIndex: 1,
          backgroundColor: index < 3 ? theme.accent : theme.border,
        }}>
          <Text style={{ fontWeight: '900', fontSize: 15, color: index < 3 ? '#000' : theme.subtext }}>
            {index + 1}
          </Text>
        </View>
        <View style={{ flex: 1, zIndex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
            {komik.title}
          </Text>
          {komik.type ? (
            <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 3 }}>
              {komik.type}{komik.rating ? ` · ★ ${komik.rating}` : ''}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Horizontal Row ───────────────────────────────────────────────────────────
function HorizontalRow({ data, onPress }: { data: Komik[]; onPress: (k: Komik) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_W + 8}
      decelerationRate="fast"
      snapToAlignment="start"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
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

  const [latest,      setLatest]      = useState<Komik[]>([]);
  const [populer,     setPopuler]     = useState<Komik[]>([]);
  const [top,         setTop]         = useState<Komik[]>([]);
  const [rekomendasi, setRekomendasi] = useState<Komik[]>([]);
  const [heroItems,   setHeroItems]   = useState<Komik[]>([]);
  const [heroIndex,   setHeroIndex]   = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [copyToast,   setCopyToast]   = useState(false);
  const [announcements,  setAnnouncements]  = useState<any[]>([]);
  const [dismissedIds,   setDismissedIds]   = useState<Set<string>>(new Set());

  const heroRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsub = firestore()
      .collection('announcements')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .onSnapshot(snap => {
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, () => {});
    return unsub;
  }, []);

  useEffect(() => {
    if (heroItems.length === 0) return;
    const itv = setInterval(() => {
      setHeroIndex(p => {
        const next = (p + 1) % heroItems.length;
        heroRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(itv);
  }, [heroItems.length]);

  const load = useCallback(async () => {
    try {
      const [latestRes, populerRes, topRes, rekomenRes] = await api.home();
      const latestData  = latestRes.data  ?? [];
      const populerData = populerRes.data ?? [];
      setLatest(latestData);
      setPopuler(populerData);
      setTop(topRes.data ?? []);
      setRekomendasi(rekomenRes.data ?? []);
      const pool = [...populerData, ...latestData].filter(k => k.image_cover || k.image_poster);
      setHeroItems(shuffleArray(pool).slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };
  const goDetail = (komik: Komik) => router.push(`/detail/${getKomikParam(komik)}`);

  const handleHeroNext = () => {
    const next = (heroIndex + 1) % heroItems.length;
    setHeroIndex(next);
    heroRef.current?.scrollTo({ x: next * width, animated: true });
    Haptics.selectionAsync();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({ message: 'Baca manhwa, manga & manhua gratis di Yōkai!\n\nhttps://yokai.app', title: 'Yōkai' });
    } catch {}
  };

  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync('https://yokai.app');
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>

      {copyToast && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          style={{
            position: 'absolute', top: 80, alignSelf: 'center', zIndex: 999,
            backgroundColor: theme.accent, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999,
          }}
        >
          <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>Tautan berhasil disalin!</Text>
        </Animated.View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Hero Carousel ── */}
        <View style={{ width, height: width * 0.72, backgroundColor: theme.card }}>
          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 }}>
              <Image
                source={{ uri: LOGO_URL }}
                style={{ width: 38, height: 38 }}
                contentFit="contain"
              />
              <View style={{ flex: 1, marginHorizontal: 12 }} />
              <TouchableOpacity
                onPress={() => { Haptics.selectionAsync(); setSearchOpen(true); }}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
              >
                <Ionicons name="search-outline" size={17} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {loading ? <HeroSkeleton /> : (
            <>
              <ScrollView
                ref={heroRef}
                horizontal
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                style={{ width, height: '100%' }}
              >
                {heroItems.map((item, i) => (
                  <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => goDetail(item)} style={{ width, height: width * 0.72 }}>
                    <Image
                      source={{ uri: item.image_cover || item.image_poster }}
                      style={{ width: '100%', height: '100%', opacity: 0.55 }}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', `${theme.bg}99`, `${theme.bg}f0`]}
                      locations={[0.2, 0.6, 1]}
                      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' }}
                    />
                    <View style={{ position: 'absolute', bottom: 24, left: 20, right: 20, flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
                      <Image
                        source={{ uri: item.image_poster }}
                        style={{ width: 72, aspectRatio: 2 / 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1, marginBottom: 2 }}>
                        {item.type ? (
                          <View style={{ alignSelf: 'flex-start', backgroundColor: `${theme.accent}25`, borderWidth: 1, borderColor: `${theme.accent}50`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 }}>
                            <Text style={{ color: theme.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>{item.type.toUpperCase()}</Text>
                          </View>
                        ) : null}
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17, lineHeight: 22, marginBottom: 4 }} numberOfLines={2}>{item.title}</Text>
                        {item.genre ? (
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 10 }} numberOfLines={1}>{item.genre}</Text>
                        ) : null}
                        <TouchableOpacity
                          onPress={() => goDetail(item)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, alignSelf: 'flex-start' }}
                        >
                          <Ionicons name="book-outline" size={11} color="#000" />
                          <Text style={{ color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 0.8 }}>BACA</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {heroItems.length > 0 && (
                <View style={{ position: 'absolute', bottom: 28, right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 20 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 10 }}>
                    {heroIndex + 1} / {heroItems.length}
                  </Text>
                  <View style={{ width: 28, height: 2, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1 }} />
                  <TouchableOpacity onPress={handleHeroNext} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>›</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Announcements ── */}
        {visibleAnnouncements.map(item => (
          <AnnouncementBanner
            key={item.id}
            item={item}
            onDismiss={() => setDismissedIds(prev => new Set([...prev, item.id]))}
          />
        ))}

        {/* ── Share Banner ── */}
        <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
          <LinearGradient
            colors={[theme.accentDim, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ padding: 18 }}>
            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
              Sebarkan Yōkai!
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 14 }}>
              Ajak temanmu baca manhwa, manga & manhua bareng. Gratis!
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleCopy}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.border, borderWidth: 1, borderColor: theme.border }}
              >
                <Ionicons name="copy-outline" size={12} color={theme.subtext} />
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 11 }}>Salin Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.border, borderWidth: 1, borderColor: theme.border }}
              >
                <Ionicons name="share-outline" size={12} color={theme.subtext} />
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 11 }}>Bagikan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Terbaru ── */}
        {loading ? (
          <View style={{ marginTop: 28 }}><SectionSkeleton /></View>
        ) : latest.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ marginTop: 28 }}>
            <SectionHeader title="Terbaru" subtitle="Baru diupload" onSeeAll={() => router.push('/(tabs)/explore')} />
            <HorizontalRow data={latest} onPress={goDetail} />
          </Animated.View>
        ) : null}

        {/* ── Populer ── */}
        {loading ? (
          <View style={{ marginTop: 28 }}><SectionSkeleton /></View>
        ) : populer.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={{ marginTop: 28 }}>
            <SectionHeader title="Populer" subtitle="Paling banyak dibaca" onSeeAll={() => router.push('/(tabs)/browse')} />
            <HorizontalRow data={populer} onPress={goDetail} />
          </Animated.View>
        ) : null}

        {/* ── Rekomendasi ── */}
        {!loading && rekomendasi.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={{ marginTop: 28 }}>
            <SectionHeader title="Rekomendasi" subtitle="Pilihan untuk kamu" />
            <HorizontalRow data={rekomendasi} onPress={goDetail} />
          </Animated.View>
        ) : null}

        {/* ── Top Ranking ── */}
        {!loading && top.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(240).duration(400)} style={{ marginTop: 28, paddingHorizontal: 16 }}>
            <SectionHeader title="Top Ranking" subtitle="Rating tertinggi" />
            {top.slice(0, 10).map((item, idx) => (
              <RankItem key={item.id} komik={item} index={idx} onPress={() => goDetail(item)} />
            ))}
          </Animated.View>
        ) : null}

      </ScrollView>

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({});
