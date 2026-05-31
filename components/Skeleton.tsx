import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { useTheme } from '@/hooks/theme';

const { width } = Dimensions.get('window');

function SkeletonBox({ style }: { style?: any }) {
  const theme   = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View style={[{ backgroundColor: theme.card, borderRadius: 8 }, style, animStyle]} />
  );
}

export function KomikCardSkeleton({ cardWidth }: { cardWidth?: number }) {
  const w = cardWidth ?? (width / 3 - 14);
  return (
    <View style={{ width: w, marginRight: 8 }}>
      <SkeletonBox style={{ width: w, aspectRatio: 2 / 3, borderRadius: 10 }} />
      <SkeletonBox style={{ height: 10, marginTop: 6, borderRadius: 4, width: '90%' }} />
      <SkeletonBox style={{ height: 8, marginTop: 4, borderRadius: 4, width: '60%' }} />
    </View>
  );
}

export function HeroSkeleton() {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 12 }}>
      <SkeletonBox style={{ height: 220, borderRadius: 16 }} />
    </View>
  );
}

export function SectionSkeleton({ count = 4 }: { count?: number }) {
  const cardW = width / 3 - 14;
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
      <SkeletonBox style={{ height: 14, width: 120, borderRadius: 6, marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: count }).map((_, i) => (
          <KomikCardSkeleton key={i} cardWidth={cardW} />
        ))}
      </View>
    </View>
  );
}

export function ChapterItemSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
      <SkeletonBox style={{ height: 44, borderRadius: 10 }} />
    </View>
  );
}

export function DetailHeroSkeleton() {
  return (
    <View>
      <SkeletonBox style={{ height: 280 }} />
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <SkeletonBox style={{ height: 22, width: '80%', borderRadius: 6, marginBottom: 8 }} />
        <SkeletonBox style={{ height: 14, width: '50%', borderRadius: 4, marginBottom: 6 }} />
        <SkeletonBox style={{ height: 14, width: '40%', borderRadius: 4 }} />
      </View>
    </View>
  );
}
