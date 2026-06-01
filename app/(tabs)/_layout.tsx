import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/theme';

const TAB_HEIGHT  = 60;

const TABS = [
  { name: 'index',    label: 'Home',     iconActive: 'home',      iconInactive: 'home-outline' },
  { name: 'explore',  label: 'Explore',  iconActive: 'compass',   iconInactive: 'compass-outline' },
  { name: 'library',  label: 'Library',  iconActive: 'bookmark',  iconInactive: 'bookmark-outline' },
  { name: 'browse',   label: 'Browse',   iconActive: 'grid',      iconInactive: 'grid-outline' },
  { name: 'profile',  label: 'Profile',  iconActive: 'person',    iconInactive: 'person-outline' },
] as const;

function TabIcon({ focused, label, iconActive, iconInactive }: {
  focused: boolean; label: string;
  iconActive: string; iconInactive: string;
}) {
  const theme   = useTheme();
  const scale   = useSharedValue(focused ? 1 : 0.9);
  const opacity = useSharedValue(focused ? 1 : 0.45);
  const labelW  = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value   = withSpring(focused ? 1 : 0.9,  { damping: 15, stiffness: 200 });
    opacity.value = withTiming(focused ? 1 : 0.45, { duration: 180 });
    labelW.value  = withSpring(focused ? 1 : 0,    { damping: 16, stiffness: 180 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pillStyle = useAnimatedStyle(() => ({
    width: labelW.value * 68 + 36,
    opacity: labelW.value,
  }));

  return (
    <View style={styles.iconWrapper}>
      <Animated.View style={[styles.pill, { backgroundColor: focused ? `${theme.accent}20` : 'transparent', borderColor: focused ? `${theme.accent}30` : 'transparent' }, pillStyle]}>
        <Animated.View style={animStyle}>
          <Ionicons
            name={(focused ? iconActive : iconInactive) as any}
            size={22}
            color={focused ? theme.accent : theme.subtext}
          />
        </Animated.View>
        {focused && (
          <Animated.Text style={[styles.label, { color: theme.accent }, { opacity: labelW }]}>
            {label}
          </Animated.Text>
        )}
      </Animated.View>
    </View>
  );
}

function TabBarBackground() {
  const theme = useTheme();
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: `${theme.accent}15`,
        backgroundColor: `${theme.bg}85`,
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
            href: tab.name === 'browse' ? null : undefined,
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
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
