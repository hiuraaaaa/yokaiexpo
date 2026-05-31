import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';

import { api, getKomikParam } from '@/hooks/api';
import { useTheme } from '@/hooks/theme';
import { Komik } from '@/types';
import KomikCard from '@/components/KomikCard';

const { width } = Dimensions.get('window');
const NUM_COLS  = 3;
const CARD_W    = (width - 16 * 2 - 8 * (NUM_COLS - 1)) / NUM_COLS;

export default function BrowseScreen() {
  const theme  = useTheme();
  const router = useRouter();

  const [data,    setData]    = useState<Komik[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.list()
      .then(r => setData(r.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Semua Komik</Text>
          {!loading && (
            <Text style={[styles.count, { color: theme.subtext }]}>{data.length} judul</Text>
          )}
        </View>
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
              marginBottom: 16,
            }}>
              <KomikCard
                komik={item}
                onPress={() => router.push(`/detail/${getKomikParam(item)}`)}
              />
            </View>
          )}
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
  title: { fontSize: 22, fontWeight: '900' },
  count: { fontSize: 12 },
});
