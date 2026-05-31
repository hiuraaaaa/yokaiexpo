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
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.claw.manhwa',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0a0c',
    },
    package: 'com.claw.manhwa',
    googleServicesFile: './google-services.json',
  },
  plugins: [
    'expo-router',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    'expo-font',
    ['expo-updates', { username: 'claw' }],
    './plugins/withAndroidSdk35.js',
    './plugins/disable-media-session.js',
  ],
  scheme: 'claw',
  experiments: { typedRoutes: true },
});
