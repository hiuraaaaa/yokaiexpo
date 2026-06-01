import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { loadSavedTheme, useTheme } from '@/hooks/theme';
import { isAdmin, onAuthStateChanged } from '@/hooks/auth';
import DebugOverlay from '@/components/DebugOverlay';
import MaintenancePage from '@/components/MaintenancePage';
import firestore from '@react-native-firebase/firestore';
import '../global.css';

SplashScreen.preventAutoHideAsync();

interface MaintenanceData {
  isActive: boolean;
  message?: string;
  estimasi?: string;
}

function AppLayout() {
  const theme = useTheme();
  const [maintenance, setMaintenance] = useState<MaintenanceData | null>(null);
  const [adminUser, setAdminUser]     = useState(false);
  const [appReady, setAppReady]       = useState(false);

  useEffect(() => { loadSavedTheme(); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(() => setAdminUser(isAdmin()));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = firestore()
      .collection('config').doc('maintenance')
      .onSnapshot(snap => {
        const data = snap.data() as MaintenanceData | undefined;
        if (data?.isActive && !adminUser) setMaintenance(data);
        else setMaintenance(null);
      }, () => setMaintenance(null));
    return unsub;
  }, [adminUser]);

  useEffect(() => {
    if (!appReady) { setAppReady(true); SplashScreen.hideAsync(); }
  }, [theme]);

  useEffect(() => {
    async function checkUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {}
    }
    if (!__DEV__) checkUpdate();
  }, []);

  if (maintenance) {
    return (
      <>
        <StatusBar style={theme.id === 'pure-white' ? 'dark' : 'light'} backgroundColor={theme.bg} />
        <MaintenancePage message={maintenance.message} estimasi={maintenance.estimasi} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme.id === 'pure-white' ? 'dark' : 'light'} backgroundColor={theme.bg} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="detail/[slug]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="read/[slug]"   options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      </Stack>
      {__DEV__ && <DebugOverlay />}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppLayout />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
