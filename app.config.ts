import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Yōkai',
  slug: 'yokai',
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
    package: 'com.yokai.app',
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
    url: 'https://u.expo.dev/d17fab3f-cb7b-4a97-bb88-827d9c745662', // ← ganti ini
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    eas: {
      projectId: 'd17fab3f-cb7b-4a97-bb88-827d9c745662', // ← dan ini
    },
  },
  owner: 'henxena', // ← username expo lo
  // ──────────────────────────────────────────────
  experiments: { typedRoutes: true },
});
