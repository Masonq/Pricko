import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mediaUrl } from '../../src/api';
import { useStore } from '../../src/store';
import { C, F, IMG, R, shadow } from '../../src/theme';
import { Header, Press } from '../../src/ui';

const HERO = 340;
export default function Reader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, stories, removeStory } = useStore();
  const st = stories.find(x => x.id === id);
  const ins = useSafeAreaInsets();
  const player = useAudioPlayer(mediaUrl(st?.audio) ? { uri: mediaUrl(st?.audio)! } : null);
  const status = useAudioPlayerStatus(player);
  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {}); }, []);
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { y.value = e.contentOffset.y; });
  const heroA = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(y.value, [-200, 0, HERO], [-100, 0, HERO * 0.45]) }, { scale: interpolate(y.value, [-200, 0], [1.4, 1], 'clamp') }] }));
  if (!st) return <View style={{ flex: 1, backgroundColor: C.paper }}><Header /></View>;
  const playing = status.playing;
  const prog = status.duration ? Math.min(1, status.currentTime / status.duration) : 0;
  const toggle = () => { if (playing) player.pause(); else { if (status.didJustFinish || prog >= 0.999) player.seekTo(0); player.play(); } };
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: ins.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={[{ height: HERO, overflow: 'hidden' }, heroA]}>
          <Image source={st.world === 'space' ? IMG.space : IMG.book} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['rgba(255,244,224,0)', C.paper]} start={{ x: 0, y: 0.55 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <View style={{ paddingHorizontal: 22, marginTop: -40 }}>
          <Animated.Text entering={FadeInDown.springify().damping(16)} style={s.title}>{st.title}</Animated.Text>
          {st.paragraphs.map((p, i) => (
            <Animated.Text key={i} entering={FadeInDown.delay(120 + i * 70).springify().damping(18)} style={s.p}>{p}</Animated.Text>
          ))}
          {st.words?.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} style={[s.words, shadow(6)]}>
              <Text style={s.wordsT}>{t('words')}</Text>
              {st.words.map((w, i) => (
                <View key={i} style={s.wordRow}><Text style={s.wSr}>{w.sr}</Text><Text style={s.wTr}>{w.tr}</Text></View>
              ))}
            </Animated.View>
          )}
          <Press onPress={() => { removeStory(st.id); router.back(); }} style={{ alignSelf: 'center', marginTop: 26, padding: 10 }}>
            <Text style={{ fontFamily: F.bodyBold, color: C.faint, fontSize: 14 }}>{t('delete')}</Text>
          </Press>
        </View>
      </Animated.ScrollView>
      <View style={[s.top, { paddingTop: 0 }]} pointerEvents="box-none"><Header /></View>
      {mediaUrl(st.audio) && (
        <View style={[s.player, shadow(14), { bottom: ins.bottom + 14 }]}>
          <Press onPress={toggle} style={s.play} scale={0.9}>
            {playing ? <View style={{ flexDirection: 'row', gap: 5 }}><View style={s.bar} /><View style={s.bar} /></View> : <View style={s.tri} />}
          </Press>
          <View style={{ flex: 1 }}>
            <Text style={s.pl}>{playing ? t('pause') : t('listen')}</Text>
            <View style={s.track}><View style={[s.fill, { width: `${prog * 100}%` }]} /></View>
          </View>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: 'transparent' },
  title: { fontFamily: F.serif, fontSize: 34, lineHeight: 38, color: C.ink, marginBottom: 14 },
  p: { fontFamily: 'Alegreya_700Bold', fontSize: 21, lineHeight: 31, color: C.ink, marginBottom: 14 },
  words: { backgroundColor: C.card, borderRadius: R.m, padding: 16, marginTop: 10 },
  wordsT: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.ochre, marginBottom: 6 },
  wordRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  wSr: { fontFamily: F.bodyHeavy, fontSize: 16, color: C.ink }, wTr: { fontFamily: F.body, fontSize: 15, color: C.soft },
  player: { position: 'absolute', left: 16, right: 16, height: 74, borderRadius: 20, backgroundColor: C.blue, borderBottomWidth: 5, borderBottomColor: C.blueShade, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 14 },
  play: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFF4E0', alignItems: 'center', justifyContent: 'center' },
  tri: { width: 0, height: 0, borderLeftWidth: 17, borderTopWidth: 11, borderBottomWidth: 11, borderLeftColor: C.blue, borderTopColor: 'transparent', borderBottomColor: 'transparent', marginLeft: 5 },
  bar: { width: 5, height: 20, borderRadius: 2, backgroundColor: C.blue },
  pl: { fontFamily: F.bodyHeavy, fontSize: 15, color: '#FFF4E0', marginBottom: 8 },
  track: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,244,224,0.25)', marginRight: 18, overflow: 'hidden' },
  fill: { height: 5, backgroundColor: C.ochre },
});
