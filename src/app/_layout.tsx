import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { StoreProvider } from '@/store';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const t = useTheme();
  return (
    <StoreProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.card },
          headerTintColor: t.text,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="exercise/[id]" options={{ presentation: 'modal', title: 'Exercise' }} />
      </Stack>
    </StoreProvider>
  );
}
