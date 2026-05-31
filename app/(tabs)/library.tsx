import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import FastImage from 'react-native-fast-image';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/theme';
import { historyStorage, favoritStorage } from '@/hooks/storage';
import { getKomikParam } from '@/hooks/api';
import { Komik, HistoryItem } from '@/types';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 3;

type Tab = 'history' | 'favorites';

function KomikItem({ komik, subtitle, onPress, onLongPress }: {
  komik: Komik; subtitle?: string;
  onPress: () => void; onLongPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.8} style={{ width: CARD_W }}>
      <View style={{ position: 'relative' }}>
        <FastImage
          source={{ uri: komik.image_poster }}
          style={{ width: CARD_W, aspectRatio: 2 / 3, borderRadius: 10 }}
          resizeMode={FastImage.resizeMode.cover}
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
      </View>
      <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{komik.title}</Text>
      {subtitle ? <Text style={[styles.cardSub, { color: theme.accent }]} numberOfLines={1}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

export default function LibraryScreen() {
  const theme  = useTheme();
  const router = useRouter();

  const [activeTab,  setActiveTab]  = useState<Tab>('history');
  const [history,    setHistory]    = useState<HistoryItem[]>([]);
  const [favorites,  setFavorites]  = useState<Komik[]>([]);
  const [loadingFav, setLoadingFav] = useState(false);

  useFocusEffect(useCallback(() => {
    setHistory(historyStorage.getAll());
  }, []));

  useFocusEffect(useCallback(() => {
    if (activeTab === 'favorites') {
      setLoadingFav(true);
      favoritStorage.getAll().then(fav => { setFavorites(fav); setLoadingFav(false); });
    }
  }, [activeTab]));

  const clearHistory = () => {
    Alert.alert('Hapus Riwayat', 'Yakin mau hapus semua riwayat baca?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => { historyStorage.clear(); setHistory([]); } },
    ]);
  };

  const removeFav = async (komikId: string) => {
    await favoritStorage.remove(komikId);
    setFavorites(prev => prev.filter(k => k.id !== komikId));
  };

  const isEmpty = activeTab === 'history' ? history.length === 0 : favorites.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Library</Text>
          {activeTab === 'history' && history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Ionicons name="trash-outline" size={20} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {(['history', 'favorites'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, activeTab === tab && { backgroundColor: theme.accent }]}
            >
              <Ionicons
                name={tab === 'history' ? 'time-outline' : 'bookmark-outline'}
                size={14}
                color={activeTab === tab ? theme.bg : theme.subtext}
              />
              <Text style={[styles.tabText, { color: activeTab === tab ? theme.bg : theme.subtext }]}>
                {tab === 'history' ? 'Riwayat' : 'Favorit'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {isEmpty ? (
        <View style={styles.empty}>
          <Ionicons
            name={activeTab === 'history' ? 'time-outline' : 'bookmark-outline'}
            size={52} color={theme.subtext}
          />
          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            {activeTab === 'history' ? 'Belum ada riwayat baca' : 'Belum ada favorit'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={activeTab === 'history' ? history : favorites}
          numColumns={3}
          estimatedItemSize={CARD_W * 1.5}
          keyExtractor={(item: any) => activeTab === 'history' ? item.komik.id : item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item, index }: { item: any; index: number }) => {
            const komik: Komik = activeTab === 'history' ? item.komik : item;
            const subtitle = activeTab === 'history' ? `Ch. ${item.chapterIndex}` : undefined;
            return (
              <View style={{ flex: 1, marginRight: (index % 3) < 2 ? 8 : 0, marginBottom: 16 }}>
                <KomikItem
                  komik={komik}
                  subtitle={subtitle}
                  onPress={() => router.push(`/detail/${getKomikParam(komik)}`)}
                  onLongPress={activeTab === 'favorites' ? () => {
                    Alert.alert('Hapus Favorit', `Hapus "${komik.title}" dari favorit?`, [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Hapus', style: 'destructive', onPress: () => removeFav(komik.id) },
                    ]);
                  } : undefined}
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title:   { fontSize: 22, fontWeight: '900' },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, borderWidth: 1, padding: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 9, gap: 6,
  },
  tabText:   { fontSize: 13, fontWeight: '700' },
  cardTitle: { fontSize: 10, fontWeight: '600', marginTop: 6, lineHeight: 14 },
  cardSub:   { fontSize: 9,  fontWeight: '700', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14 },
});
