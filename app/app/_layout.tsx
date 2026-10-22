import { Alegreya_700Bold, Alegreya_800ExtraBold } from '@expo-google-fonts/alegreya';
import { Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { preloadSfx } from '../src/sfx';
import { StoreProvider, useStore } from '../src/store';
import { C } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(C.paper).catch(() => {});

function Root() {
  const { ready } = useStore();
  const [fonts] = useFonts({ Alegreya_700Bold, Alegreya_800ExtraBold, Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold });
  useEffect(() => { if (ready && fonts) SplashScreen.hideAsync().catch(() => {}); }, [ready, fonts]);
  useEffect(() => { preloadSfx(); }, []);
  if (!ready || !fonts) return null;
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper }, animation: 'slide_from_right', gestureEnabled: true }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lesson/[id]" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="story/writing" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
    </>
  );
}
export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.paper }}>
      <SafeAreaProvider><StoreProvider><Root /></StoreProvider></SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
