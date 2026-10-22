import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sfx } from '../../src/sfx';
import { useStore } from '../../src/store';
import { C, F } from '../../src/theme';

const ICON = { index: require('../../assets/ui/tab-path.png'), talk: require('../../assets/ui/tab-talk.png'), stories: require('../../assets/ui/tab-story.png'), profile: require('../../assets/img/pricko.png') };
export default function TabsLayout() {
  const { t, onboarded } = useStore();
  useEffect(() => { if (!onboarded) setTimeout(() => router.replace('/onboarding'), 0); }, [onboarded]);
  const ins = useSafeAreaInsets();
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: C.blueShade, tabBarInactiveTintColor: C.faint,
      tabBarStyle: { backgroundColor: C.card, borderTopColor: C.line, borderTopWidth: 2, height: 66 + ins.bottom, paddingTop: 6 },
      tabBarLabelStyle: { fontFamily: F.bodyHeavy, fontSize: 11.5, marginTop: 2 },
      tabBarIcon: ({ color, focused }) => (
        <View style={{ paddingHorizontal: 14, paddingVertical: 3, borderRadius: 12, borderWidth: 2, borderColor: focused ? C.blueLine : 'transparent', backgroundColor: focused ? C.blueSoft : 'transparent' }}>
          <Image source={ICON[route.name as keyof typeof ICON]} style={{ width: 26, height: 26, opacity: route.name === 'profile' && !focused ? 0.75 : 1 }} tintColor={route.name === 'profile' ? undefined : String(color)} contentFit="contain" />
        </View>),
    })}
      screenListeners={{ tabPress: () => sfx('tap') }}>
      <Tabs.Screen name="index" options={{ title: t('learn') }} />
      <Tabs.Screen name="talk" options={{ title: t('talk') }} />
      <Tabs.Screen name="stories" options={{ title: t('stories') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile') }} />
    </Tabs>
  );
}
