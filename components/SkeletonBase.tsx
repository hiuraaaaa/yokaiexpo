import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { COLORS } from '@/constants';

const { width } = Dimensions.get('window');

// Episode size — sama persis kayak watch screen
const EP_COLS    = 6;
const EP_GAP     = 6;
const EP_PADDING = 16;
const EP_SIZE    = Math.floor((width - EP_PADDING * 2 - EP_GAP * (EP_COLS - 1)) / EP_COLS);

// ─── ShimmerBox ───────────────────────────────────────────────────────────────

export function ShimmerBox({ w, h, borderRadius = 6, style }: {
  w: number | string;
  h: number | string;
  borderRadius?: number;
  style?: object;
}) {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, { duration: 1200 }),
      -1,
      false,
    );
    return () => cancelAnimation(translateX);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { skewX: '-20deg' }],
  }));

  return (
    <View style={[{
      width: w as any, height: h as any, borderRadius,
      backgroundColor: '#1e1e24', overflow: 'hidden',
    }, style]}>
      <Animated.View style={[{
        position: 'absolute', top: 0, bottom: 0, width: 100,
        backgroundColor: 'rgba(255,255,255,0.07)',
      }, shimmerStyle]} />
    </View>
  );
}

// ─── CardSkeleton ─────────────────────────────────────────────────────────────
// Dipakai di Explore & Ongoing — width dikontrol parent

export function CardSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      <ShimmerBox w="100%" h={0} borderRadius={8} style={{ aspectRatio: 3 / 4.5 }} />
      <ShimmerBox w="75%" h={9} borderRadius={4} style={{ marginTop: 7 }} />
      <ShimmerBox w="50%" h={8} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  );
}

// ─── HeroSkeleton ─────────────────────────────────────────────────────────────
// Hero asli pakai height: width * 0.7

export function HeroSkeleton() {
  const heroH = width * 0.7;
  return (
    <View style={{ width, height: heroH, backgroundColor: COLORS.card }}>
      <ShimmerBox w="100%" h="100%" borderRadius={0} />
      <View style={{ position: 'absolute', bottom: 24, left: 24, right: 24,
        flexDirection: 'row', gap: 16, alignItems: 'flex-end' }}>
        <ShimmerBox w={80} h={0} borderRadius={8} style={{ aspectRatio: 3 / 4.2 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <ShimmerBox w="90%" h={18} borderRadius={4} />
          <ShimmerBox w="70%" h={18} borderRadius={4} />
          <ShimmerBox w="55%" h={10} borderRadius={4} />
          <ShimmerBox w={120} h={32} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

// ─── HorizontalCardSkeleton ───────────────────────────────────────────────────
// Horizontal scroll di Home

export function HorizontalCardSkeleton() {
  return (
    <View style={{ width: 100, marginRight: 10 }}>
      <ShimmerBox w={100} h={0} borderRadius={8} style={{ aspectRatio: 3 / 4.5 }} />
      <ShimmerBox w={75} h={9} borderRadius={4} style={{ marginTop: 7 }} />
      <ShimmerBox w={50} h={8} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  );
}

// ─── RankSkeleton ─────────────────────────────────────────────────────────────
// Movies section di Home

export function RankSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 10,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', height: 88 }}>
      <ShimmerBox w={40} h={40} borderRadius={20} />
      <View style={{ flex: 1, gap: 8 }}>
        <ShimmerBox w="80%" h={13} borderRadius={4} />
        <ShimmerBox w="45%" h={10} borderRadius={4} />
      </View>
    </View>
  );
}

// ─── ScheduleCardSkeleton ─────────────────────────────────────────────────────

export function ScheduleCardSkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
      {/* Timeline */}
      <View style={{ width: 40, alignItems: 'center', paddingTop: 16 }}>
        <ShimmerBox w={32} h={10} borderRadius={4} />
        <View style={{ width: 1.5, flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 6 }} />
      </View>
      {/* Dot */}
      <View style={{ width: 10, alignItems: 'center', paddingTop: 18 }}>
        <ShimmerBox w={8} h={8} borderRadius={4} />
      </View>
      {/* Card */}
      <View style={{ flex: 1, backgroundColor: COLORS.card, borderRadius: 14,
        overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
        <View style={{ flexDirection: 'row' }}>
          <ShimmerBox w={64} h={0} borderRadius={0} style={{ aspectRatio: 3 / 4 }} />
          <View style={{ flex: 1, padding: 12, gap: 8, justifyContent: 'center' }}>
            <ShimmerBox w="90%" h={13} borderRadius={4} />
            <ShimmerBox w="70%" h={13} borderRadius={4} />
            <ShimmerBox w="50%" h={9} borderRadius={4} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── WatchSkeleton ────────────────────────────────────────────────────────────
// Video height = width * 9/16, sama persis kayak watch screen

export function WatchSkeleton() {
  const videoH = width * (9 / 16);
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Video area */}
      <ShimmerBox w={width} h={videoH} borderRadius={0} />

      <View style={{ padding: 16, gap: 12 }}>
        {/* Episode nav buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ShimmerBox w="48%" h={48} borderRadius={10} />
          <ShimmerBox w="48%" h={48} borderRadius={10} />
        </View>

        {/* AutoNext */}
        <ShimmerBox w="100%" h={60} borderRadius={10} />

        {/* Daftar Episode */}
        <View style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: EP_PADDING,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 12 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ShimmerBox w={120} h={13} borderRadius={4} />
            <ShimmerBox w={40} h={13} borderRadius={4} />
          </View>
          {/* Search */}
          <ShimmerBox w="100%" h={36} borderRadius={8} />
          {/* Grid episode — pakai EP_SIZE sama persis */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: EP_GAP }}>
            {[...Array(12)].map((_, i) => (
              <ShimmerBox key={i} w={EP_SIZE} h={EP_SIZE} borderRadius={6} />
            ))}
          </View>
        </View>

        {/* Info Anime */}
        <View style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <ShimmerBox w={96} h={0} borderRadius={8} style={{ aspectRatio: 3 / 4.2 }} />
            <View style={{ flex: 1, gap: 10 }}>
              <ShimmerBox w="90%" h={15} borderRadius={4} />
              <ShimmerBox w="70%" h={15} borderRadius={4} />
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <ShimmerBox w={40} h={22} borderRadius={4} />
                <ShimmerBox w={60} h={22} borderRadius={4} />
              </View>
              <ShimmerBox w="100%" h={10} borderRadius={4} />
              <ShimmerBox w="85%" h={10} borderRadius={4} />
              <ShimmerBox w="70%" h={10} borderRadius={4} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
