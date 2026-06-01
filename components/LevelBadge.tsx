import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getLevelData, LEVELS } from '@/hooks/xp';

const LEVEL_COLORS = [
  '#9ca3af', // 1 Newbie — gray
  '#60a5fa', // 2 Pemula — blue
  '#34d399', // 3 Wibu — green
  '#a78bfa', // 4 Otaku — purple
  '#f59e0b', // 5 Weeb — amber
  '#f97316', // 6 Anime Freak — orange
  '#ef4444', // 7 Legend Wibu — red
  '#ec4879', // 8 Otaku Master — pink
];

export function LevelBadge({ xp, size = 'md' }: { xp: number; size?: 'sm' | 'md' | 'lg' }) {
  const { current } = getLevelData(xp);
  const color = LEVEL_COLORS[current.level - 1];
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  return (
    <View style={[
      styles.badge,
      {
        borderColor: color,
        backgroundColor: `${color}18`,
        paddingHorizontal: isLg ? 12 : isSm ? 6 : 8,
        paddingVertical: isLg ? 6 : isSm ? 3 : 4,
        borderRadius: isLg ? 10 : 6,
      }
    ]}>
      <Text style={[
        styles.text,
        { color, fontSize: isLg ? 13 : isSm ? 9 : 11 }
      ]}>
        LV.{current.level} {current.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
