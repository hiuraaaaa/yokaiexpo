import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/theme';
import { Komik } from '@/types';

interface Props {
  komik: Komik;
  onPress: () => void;
  width?: number;
  showType?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TYPE_COLORS: Record<string, string> = {
  manhwa: '#ff6b9d',
  manga:  '#4a9eff',
  manhua: '#2ecc71',
};

export default function KomikCard({ komik, onPress, width, showType = true }: Props) {
  const theme   = useTheme();
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={() => {
        scale.value   = withSpring(0.93, { damping: 15, stiffness: 300 });
        opacity.value = withTiming(0.75, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value   = withSpring(1, { damping: 12, stiffness: 200 });
        opacity.value = withTiming(1, { duration: 150 });
      }}
      activeOpacity={1}
      style={[animStyle, width ? { width } : { flex: 1 }]}
    >
      <View style={[styles.posterWrapper, { backgroundColor: theme.card }]}>
        <Image
          source={{ uri: komik.image_poster, priority: 'normal', cachePolicy: 'memory-disk' }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
          locations={[0.4, 0.7, 1]}
          style={styles.gradient}
        />

        {/* Status badge */}
        {komik.status ? (
          <View style={[styles.statusBadge, {
            backgroundColor: komik.status.toLowerCase() === 'completed'
              ? 'rgba(46,204,113,0.85)' : 'rgba(74,158,255,0.85)',
          }]}>
            <Text style={styles.statusText}>
              {komik.status.toLowerCase() === 'completed' ? 'END' : 'ON'}
            </Text>
          </View>
        ) : null}

        {/* Type badge */}
        {showType && komik.type ? (
          <View style={[styles.typeBadge, {
            backgroundColor: `${TYPE_COLORS[komik.type.toLowerCase()] ?? '#888'}30`,
            borderColor: `${TYPE_COLORS[komik.type.toLowerCase()] ?? '#888'}60`,
          }]}>
            <Text style={[styles.typeText, {
              color: TYPE_COLORS[komik.type.toLowerCase()] ?? '#aaa',
            }]}>
              {komik.type.toUpperCase()}
            </Text>
          </View>
        ) : null}

        {/* Rating */}
        {komik.rating ? (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingText}>{komik.rating}</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
        {komik.title}
      </Text>
      {komik.author ? (
        <Text style={[styles.sub, { color: theme.subtext }]} numberOfLines={1}>
          {komik.author}
        </Text>
      ) : null}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  posterWrapper: {
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
  },
  statusBadge: {
    position: 'absolute', top: 6, right: 6,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: { fontSize: 7, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  typeBadge: {
    position: 'absolute', top: 6, left: 6,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1,
  },
  typeText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.4 },
  ratingBadge: {
    position: 'absolute', bottom: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  ratingStar: { fontSize: 8, color: '#F6CF80' },
  ratingText: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  title: { fontSize: 10, fontWeight: '600', marginTop: 6, lineHeight: 14, letterSpacing: 0.1 },
  sub:   { fontSize: 8,  fontWeight: '500', marginTop: 2, letterSpacing: 0.2 },
});
