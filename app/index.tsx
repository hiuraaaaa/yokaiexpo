import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/theme';

export default function Index() {
  const router = useRouter();
  const theme  = useTheme();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/(tabs)'), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}
