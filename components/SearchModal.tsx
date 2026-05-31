import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, FlatList, ActivityIndicator, Keyboard, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/theme';
import { api, getKomikParam } from '@/hooks/api';
import { searchHistoryStorage } from '@/hooks/storage';
import { Komik } from '@/types';
import KomikCard from './KomikCard';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 3;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SearchModal({ visible, onClose }: Props) {
  const theme   = useTheme();
  const router  = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<Komik[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(() => searchHistoryStorage.getAll());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await api.search(q.trim());
      setResults(res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onChangeText = (text: string) => {
    setQuery(text);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(text), 500);
  };

  const onSubmit = () => {
    if (!query.trim()) return;
    searchHistoryStorage.add(query.trim());
    setHistory(searchHistoryStorage.getAll());
    doSearch(query.trim());
    Keyboard.dismiss();
  };

  const onPressHistory = (term: string) => {
    setQuery(term);
    doSearch(term);
  };

  const onPressKomik = (komik: Komik) => {
    onClose();
    router.push(`/detail/${getKomikParam(komik)}`);
  };

  const onClearHistory = () => {
    searchHistoryStorage.clear();
    setHistory([]);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: `${theme.bg}cc` }]} />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.springify().damping(20)}
        exiting={SlideOutDown.duration(250)}
        style={[styles.sheet, { backgroundColor: theme.bg, borderTopColor: theme.border }]}
      >
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          {/* Search bar */}
          <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.subtext} style={{ marginLeft: 12 }} />
            <TextInput
              ref={inputRef}
              autoFocus
              value={query}
              onChangeText={onChangeText}
              onSubmitEditing={onSubmit}
              placeholder="Cari komik..."
              placeholderTextColor={theme.subtext}
              style={[styles.input, { color: theme.text }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} style={{ paddingHorizontal: 12 }}>
                <Ionicons name="close-circle" size={18} color={theme.subtext} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: theme.accent }]}>Batal</Text>
            </TouchableOpacity>
          </View>

          {/* Loading */}
          {loading && (
            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <ActivityIndicator color={theme.accent} />
            </View>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={item => item.id}
              numColumns={3}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              columnWrapperStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <KomikCard komik={item} onPress={() => onPressKomik(item)} width={CARD_W} />
              )}
            />
          )}

          {/* Empty state */}
          {!loading && query.length > 0 && results.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <Ionicons name="search-outline" size={48} color={theme.subtext} />
              <Text style={{ color: theme.subtext, marginTop: 12, fontSize: 14 }}>
                Tidak ada hasil untuk "{query}"
              </Text>
            </View>
          )}

          {/* History */}
          {!loading && query.length === 0 && history.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                  RIWAYAT
                </Text>
                <TouchableOpacity onPress={onClearHistory}>
                  <Text style={{ color: theme.accent, fontSize: 11 }}>Hapus semua</Text>
                </TouchableOpacity>
              </View>
              {history.map((term, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => onPressHistory(term)}
                  style={[styles.historyItem, { borderColor: theme.border }]}
                >
                  <Ionicons name="time-outline" size={14} color={theme.subtext} />
                  <Text style={{ color: theme.text, fontSize: 13, flex: 1, marginLeft: 10 }}>{term}</Text>
                  <Ionicons name="arrow-up-outline" size={14} color={theme.subtext} style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 60,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
  },
  input: { flex: 1, fontSize: 14, paddingHorizontal: 10, height: '100%' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { fontSize: 14, fontWeight: '600' },
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1,
  },
});
