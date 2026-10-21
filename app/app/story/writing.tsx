import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { ApiError, makeStory } from '../../src/api';
import { Story, useStore } from '../../src/store';
import { C, F, IMG } from '../../src/theme';
import { Button, P } from '../../src/ui';

export default function Writing() {
  const { body } = useLocalSearchParams<{ body: string }>();
  const { t, device, addStory } = useStore();
  const [err, setErr] = useState('');
  const y = useSharedValue(0), r = useSharedValue(0), dots = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-14, { duration: 700, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) })), -1);
    r.value = withRepeat(withSequence(withTiming(-6, { duration: 1400 }), withTiming(6, { duration: 1400 })), -1, true);
    dots.value = withRepeat(withTiming(1, { duration: 1200 }), -1);
  }, []);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: `${r.value}deg` }] }));
  const run = async () => {
    setErr('');
    try {
      const st = (await makeStory(device, JSON.parse(body || '{}'))) as Story;
      addStory(st);
      router.replace({ pathname: '/story/[id]', params: { id: st.id, fresh: '1' } });
    } catch (e) {
      setErr(e instanceof ApiError ? (e.code === 'limit' ? t('limit') : e.code === 'offline' ? t('offline') : t('busy')) : t('busy'));
    }
  };
  useEffect(() => { run(); }, []);
  return (
    <View style={s.wrap}>
      <Animated.View style={a}><Image source={IMG.pricko} style={{ width: 170, height: 200 }} contentFit="contain" /></Animated.View>
      <View style={s.shadow} />
      {!err ? (
        <Animated.View entering={FadeIn.delay(200)} style={{ alignItems: 'center' }}>
          <Text style={s.t}>{t('writing')}</Text>
          <P style={{ textAlign: 'center', marginTop: 6 }}>{t('writingSub')}</P>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn} style={{ alignItems: 'center', gap: 14, width: '100%' }}>
          <Text style={[s.t, { color: C.red, fontSize: 20 }]}>{err}</Text>
          <Button title={t('again')} onPress={run} style={{ alignSelf: 'stretch' }} />
          <Button title="‹" kind="ghost" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </Animated.View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', padding: 30 },
  shadow: { width: 110, height: 14, borderRadius: 60, backgroundColor: 'rgba(58,36,20,0.12)', marginTop: 4, marginBottom: 26 },
  t: { fontFamily: F.display, fontSize: 26, color: C.ink, textAlign: 'center' },
});
