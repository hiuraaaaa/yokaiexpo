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

const TAB_HEIGHT = 60;

const TABS = [
  { name: 'index',   label: 'Home',    iconActive: 'home',     iconInactive: 'home-outline' },
  { name: 'explore', label: 'Explore', iconActive: 'compass',  iconInactive: 'compass-outline' },
  { name: 'library', label: 'Library', iconActive: 'bookmark', iconInactive: 'bookmark-outline' },
  { name: 'browse',  label: 'Browse',  iconActive: 'grid',     iconInactive: 'grid-outline' },
  { name: 'profile', label: 'Profile', iconActive: 'person',   iconInactive: 'person-outline' },
] as const;

function TabIcon({ focused, label, iconActive, iconInactive }: {
  focused: boolean; label: string;
  iconActive: string; iconInactive: string;
}) {
  const theme   = useTheme();
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(focused ? 1 : 0.5);
  const bgOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value      = withSpring(focused ? 1.05 : 1, { damping: 15, stiffness: 200 });
    opacity.value    = withTiming(focused ? 1 : 0.5,  { duration: 180 });
    bgOpacity.value  = withTiming(focused ? 1 : 0,    { duration: 200 });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <View style={styles.iconWrapper}>
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.iconBg, { backgroundColor: `${theme.accent}20`, borderColor: `${theme.accent}35` }, bgStyle]} />
        <Animated.View style={iconStyle}>
          <Ionicons
            name={(focused ? iconActive : iconInactive) as any}
            size={22}
            color={focused ? theme.accent : theme.subtext}
          />
        </Animated.View>
      </View>
      <Text style={[styles.label, { color: focused ? theme.accent : theme.subtext, opacity: focused ? 1 : 0.5 }]}>
        {label}
      </Text>
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
    gap: 3,
  },
  iconContainer: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
