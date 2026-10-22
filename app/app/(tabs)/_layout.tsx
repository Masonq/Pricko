import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sfx } from '../../src/sfx';
import { useStore } from '../../src/store';
import { C, F } from '../../src/theme';

const ICON = { index: require('../../assets/ui/tab-path.png'), talk: require('../../assets/ui/tab-talk.png'), stories: require('../../assets/ui/tab-story.png') };
export default function TabsLayout() {
  const { t } = useStore();
  const ins = useSafeAreaInsets();
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: C.indigo, tabBarInactiveTintColor: C.faint,
      tabBarStyle: { backgroundColor: C.card, borderTopColor: C.line, borderTopWidth: StyleSheet.hairlineWidth, height: 62 + ins.bottom, paddingTop: 8 },
      tabBarLabelStyle: { fontFamily: F.bodyHeavy, fontSize: 11.5, marginTop: 2 },
      tabBarIcon: ({ color }) => <Image source={ICON[route.name as keyof typeof ICON]} style={{ width: 26, height: 26 }} tintColor={String(color)} contentFit="contain" />,
    })}
      screenListeners={{ tabPress: () => sfx('tap') }}>
      <Tabs.Screen name="index" options={{ title: t('learn') }} />
      <Tabs.Screen name="talk" options={{ title: t('talk') }} />
      <Tabs.Screen name="stories" options={{ title: t('stories') }} />
    </Tabs>
  );
}
