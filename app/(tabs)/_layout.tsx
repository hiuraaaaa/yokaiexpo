import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/theme';

const TAB_HEIGHT  = 64;
const BUBBLE_SIZE = 58;

const TABS = [
  { name: 'index',    label: 'Home',     iconActive: 'home',      iconInactive: 'home-outline' },
  { name: 'explore',  label: 'Explore',  iconActive: 'compass',   iconInactive: 'compass-outline' },
  { name: 'library',  label: 'Library',  iconActive: 'bookmark',  iconInactive: 'bookmark-outline' },
  { name: 'browse',   label: 'Browse',   iconActive: 'grid',      iconInactive: 'grid-outline' },
  { name: 'profile',  label: 'Profile',  iconActive: 'person',    iconInactive: 'person-outline' },
] as const;

function TabIcon({ focused, label, iconActive, iconInactive, badge }: {
  focused: boolean; label: string;
  iconActive: string; iconInactive: string; badge?: string;
}) {
  const theme      = useTheme();
  const scale      = useSharedValue(focused ? 1 : 0.85);
  const translateY = useSharedValue(focused ? 0 : 4);
  const opacity    = useSharedValue(focused ? 1 : 0.6);

  useEffect(() => {
    scale.value      = withSpring(focused ? 1 : 0.85,  { damping: 14, stiffness: 120 });
    translateY.value = withSpring(focused ? 0 : 4,     { damping: 14, stiffness: 120 });
    opacity.value    = withTiming(focused ? 1 : 0.6,   { duration: 200 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (focused) {
    return (
      <Animated.View style={[styles.activeBubbleWrapper, animStyle]}>
        <View style={[styles.activeBubble, { shadowColor: theme.accent, borderColor: `${theme.accent}60` }]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: `${theme.accent}30`, borderRadius: BUBBLE_SIZE / 2 }]} />
          <Ionicons name={iconActive as any} size={26} color={theme.accent} />
          {badge && (
            <View style={[styles.badge, { backgroundColor: theme.accent }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.activeLabel, { color: theme.accent }]}>{label.toUpperCase()}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.inactiveWrapper, animStyle]}>
      <View>
        <Ionicons name={iconInactive as any} size={24} color={theme.subtext} />
        {badge && (
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function TabBarBackground() {
  const theme = useTheme();
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, {
        borderTopWidth: 1,
        borderTopColor: `${theme.accent}20`,
        backgroundColor: `${theme.bg}70`,
      }]} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme  = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bg },
        animation: 'fade',
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
          position: 'absolute',
          elevation: 0,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.subtext,
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                label={tab.label}
                iconActive={tab.iconActive}
                iconInactive={tab.iconInactive}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeBubbleWrapper: { alignItems: 'center', justifyContent: 'flex-start', marginTop: -(BUBBLE_SIZE / 2 + 4) },
  activeBubble: {
    width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 1, shadowOpacity: 0.5, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 12,
  },
  activeLabel:    { fontSize: 9, fontWeight: '900', marginTop: 5, letterSpacing: 0.5 },
  inactiveWrapper:{ alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  badge: { position: 'absolute', top: -4, right: -8, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
  badgeText: { fontSize: 7, fontWeight: '900', color: '#000', letterSpacing: 0.3 },
});
