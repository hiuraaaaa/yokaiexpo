import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { api, extractKomikId, encodeSlug } from '@/hooks/api';
import { useTheme } from '@/hooks/theme';
import { favoritStorage } from '@/hooks/storage';
import { KomikDetail, Chapter } from '@/types';
import { DetailHeroSkeleton, ChapterItemSkeleton } from '@/components/Skeleton';

const { width } = Dimensions.get('window');

function ChapterRow({ chapter, isLast, onPress, lastReadId }: {
  chapter: Chapter; isLast: boolean; onPress: () => void; lastReadId?: string;
}) {
  const theme    = useTheme();
  const isActive = chapter.id === lastReadId;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.chapterRow, {
        backgroundColor: isActive ? theme.accentDim : theme.card,
        borderColor: isActive ? theme.accent : theme.border,
        marginBottom: isLast ? 0 : 8,
      }]}
    >
      <View style={[styles.chapterIcon, { backgroundColor: isActive ? theme.accent : theme.card }]}>
        <Ionicons name="book-outline" size={14} color={isActive ? theme.bg : theme.subtext} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.chapterTitle, { color: isActive ? theme.accent : theme.text }]}>
          {chapter.title}
        </Text>
        {chapter.date ? (
          <Text style={[styles.chapterDate, { color: theme.subtext }]}>{chapter.date}</Text>
        ) : null}
      </View>
      <Ionicons
        name={isActive ? 'checkmark-circle' : 'chevron-forward'}
        size={16}
        color={isActive ? theme.accent : theme.subtext}
      />
    </TouchableOpacity>
  );
}

export default function DetailScreen() {
  const theme  = useTheme();
  const router = useRouter();
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();

  const komikId = extractKomikId(rawSlug ?? '');

  const [detail,      setDetail]      = useState<KomikDetail | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [expanded,    setExpanded]    = useState(false);
  const [lastReadId,  setLastReadId]  = useState<string | undefined>();

  useEffect(() => {
    if (!komikId) return;
    setLoading(true);
    api.detail(komikId)
      .then(res => {
        if (res?.data) setDetail(res.data);
      })
      .catch(() => Alert.alert('Error', 'Gagal memuat detail komik'))
      .finally(() => setLoading(false));
  }, [komikId]);

  useEffect(() => {
    if (!detail) return;
    favoritStorage.isFavorited(detail.id).then(setIsFavorited);
  }, [detail]);

  const toggleFavorite = async () => {
    if (!detail) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nowFav = await favoritStorage.toggle(detail);
    setIsFavorited(nowFav);
  };

  const openChapter = (chapter: Chapter) => {
    if (!detail) return;
    setLastReadId(chapter.id);
    router.push(`/read/${encodeSlug(chapter.id)}?komikId=${encodeURIComponent(detail.id)}&chapterIndex=${chapter.index}&title=${encodeURIComponent(chapter.title)}`);
  };

  const synopsis  = detail?.synopsis ?? '';
  const showMore  = synopsis.length > 150;
  const displaySynopsis = expanded || !showMore ? synopsis : synopsis.slice(0, 150) + '…';

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
        </SafeAreaView>
        <DetailHeroSkeleton />
        {[...Array(6)].map((_, i) => <ChapterItemSkeleton key={i} />)}
      </View>
    );
  }

  if (!detail) return null;

  const genres = detail.genre ? detail.genre.split(',').map(g => g.trim()).filter(Boolean) : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlashList
        data={detail.chapter_list}
        estimatedItemSize={56}
        keyExtractor={item => item.id}
        ListHeaderComponent={() => (
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <FastImage
                source={{ uri: detail.image_cover || detail.image_poster, priority: FastImage.priority.high }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={FastImage.resizeMode.cover}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', theme.bg]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Back + Fav */}
              <SafeAreaView edges={['top']} style={styles.heroNav}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleFavorite} style={[styles.navBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                  <Ionicons
                    name={isFavorited ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isFavorited ? theme.accent : '#fff'}
                  />
                </TouchableOpacity>
              </SafeAreaView>

              {/* Info */}
              <View style={styles.heroInfo}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  {/* Poster kecil */}
                  <FastImage
                    source={{ uri: detail.image_poster }}
                    style={styles.miniPoster}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.text }]}>{detail.title}</Text>
                    {detail.author ? (
                      <Text style={[styles.author, { color: theme.subtext }]}>by {detail.author}</Text>
                    ) : null}

                    {/* Badges */}
                    <View style={styles.badgeRow}>
                      {detail.status ? (
                        <View style={[styles.badge, {
                          backgroundColor: detail.status.toLowerCase() === 'completed'
                            ? 'rgba(46,204,113,0.2)' : 'rgba(74,158,255,0.2)',
                          borderColor: detail.status.toLowerCase() === 'completed' ? '#2ecc71' : '#4a9eff',
                        }]}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: detail.status.toLowerCase() === 'completed' ? '#2ecc71' : '#4a9eff' }}>
                            {detail.status.toUpperCase()}
                          </Text>
                        </View>
                      ) : null}
                      {detail.type ? (
                        <View style={[styles.badge, { backgroundColor: theme.accentDim, borderColor: `${theme.accent}60` }]}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: theme.accent }}>{detail.type.toUpperCase()}</Text>
                        </View>
                      ) : null}
                      {detail.rating ? (
                        <View style={[styles.badge, { backgroundColor: 'rgba(246,207,128,0.15)', borderColor: 'rgba(246,207,128,0.4)' }]}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#F6CF80' }}>★ {detail.rating}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Synopsis */}
            {synopsis.length > 0 && (
              <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <Text style={[styles.sectionLabel, { color: theme.subtext }]}>SINOPSIS</Text>
                <Text style={[styles.synopsis, { color: theme.text }]}>{displaySynopsis}</Text>
                {showMore && (
                  <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                    <Text style={[styles.moreText, { color: theme.accent }]}>
                      {expanded ? 'Lebih sedikit ↑' : 'Selengkapnya ↓'}
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}

            {/* Genre pills */}
            {genres.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6, marginBottom: 16 }}>
                  {genres.map(g => (
                    <View key={g} style={[styles.genrePill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.genreText, { color: theme.subtext }]}>{g}</Text>
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {/* Chapter header */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.chapterHeader}>
              <View style={[styles.sectionDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.sectionLabel, { color: theme.text, marginBottom: 0 }]}>
                CHAPTER LIST
              </Text>
              <Text style={[styles.chapterCount, { color: theme.subtext }]}>
                {detail.chapter_list.length} chapter
              </Text>
            </Animated.View>

            {/* Read first/latest buttons */}
            {detail.chapter_list.length > 0 && (
              <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.ctaRow}>
                <TouchableOpacity
                  onPress={() => openChapter(detail.chapter_list[detail.chapter_list.length - 1])}
                  style={[styles.ctaBtn, { backgroundColor: theme.accent, flex: 1 }]}
                >
                  <Ionicons name="play" size={14} color={theme.bg} />
                  <Text style={[styles.ctaBtnText, { color: theme.bg }]}>Chapter 1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openChapter(detail.chapter_list[0])}
                  style={[styles.ctaBtn, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, flex: 1 }]}
                >
                  <Ionicons name="flash" size={14} color={theme.accent} />
                  <Text style={[styles.ctaBtnText, { color: theme.accent }]}>Terbaru</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        )}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <ChapterRow
              chapter={item}
              isLast={index === detail.chapter_list.length - 1}
              lastReadId={lastReadId}
              onPress={() => openChapter(item)}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 320, position: 'relative', marginBottom: 16 },
  heroNav: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  heroInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  miniPoster: { width: 80, aspectRatio: 2 / 3, borderRadius: 10, marginTop: -20 },
  title:  { fontSize: 18, fontWeight: '900', lineHeight: 24, marginBottom: 4 },
  author: { fontSize: 11, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  backBtn: { margin: 16, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  synopsis: { fontSize: 13, lineHeight: 20, fontWeight: '400' },
  moreText: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  genrePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  genreText: { fontSize: 11, fontWeight: '600' },
  chapterHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, marginBottom: 12,
  },
  sectionDot: { width: 4, height: 14, borderRadius: 2 },
  chapterCount: { fontSize: 11, marginLeft: 'auto' },
  ctaRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
  },
  ctaBtnText: { fontSize: 13, fontWeight: '800' },
  chapterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  chapterIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  chapterTitle: { fontSize: 13, fontWeight: '600' },
  chapterDate:  { fontSize: 10, marginTop: 2 },
});
