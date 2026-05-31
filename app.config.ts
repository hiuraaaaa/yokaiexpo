import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Claw',
  slug: 'claw-manhwa',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#0a0a0c',
  },
  assetBundlePatterns: ['**/*'],
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0a0c',
    },
    package: 'com.claw.manhwa',
    googleServicesFile: './google-services.json',
    jsEngine: 'hermes',
    enableProguardInReleaseBuilds: true,
    enableShrinkResourcesInReleaseBuilds: true,
  },
  plugins: [
    'expo-router',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    'expo-font',
    './plugins/withAndroidSdk35.js',
    './plugins/disable-media-session.js',
  ],
  scheme: 'claw',
  // ─── OTA Update ───────────────────────────────
  updates: {
    url: 'https://u.expo.dev/YOUR_PROJECT_ID', // ← ganti ini
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    eas: {
      projectId: 'YOUR_PROJECT_ID', // ← dan ini
    },
  },
  owner: 'YOUR_EXPO_USERNAME', // ← username expo lo
  // ──────────────────────────────────────────────
  experiments: { typedRoutes: true },
});
