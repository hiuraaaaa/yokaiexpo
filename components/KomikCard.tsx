import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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

  const typeColor = TYPE_COLORS[komik.type?.toLowerCase()] ?? '#888';

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
      {/* Poster */}
      <View style={[styles.posterWrapper, {
        borderColor: `${theme.accent}15`,
        shadowColor: theme.accent,
      }]}>
        <Image
          source={{ uri: komik.image_poster, priority: 'normal', cachePolicy: 'memory-disk' }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />

        {/* Bottom gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
          locations={[0.35, 0.65, 1]}
          style={styles.gradient}
        />

        {/* Type badge — glass */}
        {showType && komik.type ? (
          <View style={[styles.typeBadge, { overflow: 'hidden' }]}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: `${typeColor}25` }]} />
            <Text style={[styles.typeText, { color: typeColor }]}>
              {komik.type.toUpperCase()}
            </Text>
          </View>
        ) : null}

        {/* Status badge */}
        {komik.status ? (
          <View style={[styles.statusBadge, { overflow: 'hidden' }]}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, {
              backgroundColor: komik.status.toLowerCase() === 'completed'
                ? 'rgba(46,204,113,0.35)' : 'rgba(74,158,255,0.35)',
            }]} />
            <Text style={styles.statusText}>
              {komik.status.toLowerCase() === 'completed' ? 'END' : 'ON'}
            </Text>
          </View>
        ) : null}

        {/* Rating */}
        {komik.rating ? (
          <View style={[styles.ratingBadge, { overflow: 'hidden' }]}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingText}>{komik.rating}</Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
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
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  gradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
  },
  typeBadge: {
    position: 'absolute', top: 6, left: 6,
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5, zIndex: 1 },
  statusBadge: {
    position: 'absolute', top: 6, right: 6,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 5,
  },
  statusText: { fontSize: 7, fontWeight: '900', color: '#fff', letterSpacing: 0.5, zIndex: 1 },
  ratingBadge: {
    position: 'absolute', bottom: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
  },
  ratingStar: { fontSize: 8, color: '#F6CF80', zIndex: 1 },
  ratingText: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.9)', zIndex: 1 },
  title: { fontSize: 10, fontWeight: '600', marginTop: 6, lineHeight: 14, letterSpacing: 0.1 },
  sub:   { fontSize: 8,  fontWeight: '500', marginTop: 2, letterSpacing: 0.2 },
});
