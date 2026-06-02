import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/theme';
import { prefetchHome } from '@/hooks/homeCache';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSequence,
  withSpring, Easing, runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const LOGO_URI = 'https://raw.githubusercontent.com/hiuraaaaa/assets/main/yoaki-icon.png';

export default function SplashScreen() {
  const router = useRouter();
  const theme  = useTheme();

  // Animasi values
  const logoScale    = useSharedValue(0.6);
  const logoOpacity  = useSharedValue(0);
  const logoY        = useSharedValue(20);
  const textOpacity  = useSharedValue(0);
  const textY        = useSharedValue(10);
  const tagOpacity   = useSharedValue(0);
  const barWidth     = useSharedValue(0);
  const barOpacity   = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  const navigate = () => router.replace('/(tabs)');

  useEffect(() => {
    // Langsung prefetch di background — tidak nunggu selesai
    prefetchHome().catch(() => {}); // error di-handle di home screen

    // 1. Logo muncul
    logoOpacity.value  = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoScale.value    = withSpring(1, { damping: 14, stiffness: 120 });
    logoY.value        = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });

    // 2. Nama app muncul
    textOpacity.value  = withDelay(400, withTiming(1, { duration: 400 }));
    textY.value        = withDelay(400, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // 3. Tagline muncul
    tagOpacity.value   = withDelay(650, withTiming(1, { duration: 350 }));

    // 4. Loading bar muncul + fill
    barOpacity.value   = withDelay(800, withTiming(1, { duration: 200 }));
    barWidth.value     = withDelay(900, withTiming(100, { duration: 900, easing: Easing.inOut(Easing.cubic) }));

    // 5. Fade out seluruh screen → navigate
    screenOpacity.value = withDelay(2000, withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) }, (done) => {
      if (done) runOnJS(navigate)();
    }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: logoY.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
  }));

  const barContainerStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
  }));

  const barFillStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.bg }, screenStyle]}>

      {/* Glow belakang logo */}
      <Animated.View style={[styles.glow, { backgroundColor: theme.accent }, logoStyle]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <Image
          source={{ uri: LOGO_URI, cachePolicy: 'memory-disk' }}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      {/* Nama app */}
      <Animated.Text style={[styles.appName, { color: theme.text }, textStyle]}>
        Yokai
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { color: theme.subtext }, tagStyle]}>
        Baca komik favoritmu
      </Animated.Text>

      {/* Loading bar */}
      <Animated.View style={[styles.barContainer, { backgroundColor: theme.card }, barContainerStyle]}>
        <Animated.View style={[styles.barFill, { backgroundColor: theme.accent }, barFillStyle]} />
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.08,
    // blur effect via borderRadius + opacity (expo-blur ga support di sini)
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 60,
    letterSpacing: 0.2,
  },
  barContainer: {
    position: 'absolute',
    bottom: 80,
    width: 140,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
