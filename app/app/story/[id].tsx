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
import { C, F, IMG, R, shadow, WORLD_IMG } from '../../src/theme';
import { Header, Press } from '../../src/ui';

const HERO = 380;
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
          <Image source={WORLD_IMG[st.world] ?? IMG.book} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(15,10,30,0.82)']} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
          <View style={s.heroText}>
            <Text style={s.kicker}>{st.name}</Text>
            <Animated.Text entering={FadeInDown.springify().damping(16)} style={s.title}>{st.title}</Animated.Text>
          </View>
        </Animated.View>
        <View style={s.sheet}>
          {st.paragraphs.map((p, i) => (
            <Animated.Text key={i} entering={FadeInDown.delay(120 + i * 70).springify().damping(18)} style={s.p}>
              {i === 0 ? <Text style={s.cap}>{p.charAt(0)}</Text> : null}{i === 0 ? p.slice(1) : p}
            </Animated.Text>
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
      <View style={[s.top, { top: ins.top + 6 }]} pointerEvents="box-none">
        <Press onPress={() => router.back()} style={s.back}><Image source={require('../../assets/ui/back.png')} tintColor="#FFFFFF" style={{ width: 18, height: 18 }} /></Press>
      </View>
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
  top: { position: 'absolute', left: 16 },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  heroText: { position: 'absolute', left: 22, right: 22, bottom: 44 },
  kicker: { fontFamily: F.bodyHeavy, fontSize: 13, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 },
  title: { fontFamily: F.serif, fontSize: 34, lineHeight: 38, color: '#FFFFFF', marginTop: 2 },
  sheet: { marginTop: -28, backgroundColor: C.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 26 },
  cap: { fontFamily: F.serif, fontSize: 44, lineHeight: 44, color: C.blue },
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
