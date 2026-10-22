import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mediaUrl, sayCached } from '../src/api';
import { Lang } from '../src/i18n';
import { sfx } from '../src/sfx';
import { useStore } from '../src/store';
import { C, F, IMG } from '../src/theme';
import { Btn3D } from '../src/ui';

const voicePrev = createAudioPlayer(null);
const GOALS = [{ min: 5, xp: 10, k: 'goal5' }, { min: 10, xp: 20, k: 'goal10' }, { min: 20, xp: 30, k: 'goal20' }, { min: 30, xp: 50, k: 'goal30' }] as const;

function Row({ on, onPress, left, right }: { on: boolean; onPress: () => void; left: string; right?: string }) {
  return (
    <Btn3D onPress={onPress} face={on ? C.blueSoft : C.card} border={on ? C.blueLine : C.line} shade={on ? C.blueLine : C.line} radius={16} faceStyle={s.row}>
      <Text style={[s.rowT, on && { color: C.blueShade }]}>{left}</Text>
      {!!right && <Text style={[s.rowR, on && { color: C.blueShade }]}>{right}</Text>}
    </Btn3D>
  );
}

export default function Onboarding() {
  const { t, lang, setLang, voice, setVoice, device, finishOnboarding } = useStore();
  const ins = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(1);
  const bar = useAnimatedStyle(() => ({ width: withTiming(`${((step + 1) / 4) * 100}%`, { duration: 250 }) as any }));
  const preview = async (v: 'f' | 'm') => { setVoice(v); try { const u = mediaUrl(await sayCached(device, 'Zdravo! Ja sam Pričko. Hajde da pričamo srpski.')); if (u) { await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }); voicePrev.replace({ uri: u }); voicePrev.play(); } } catch {} };
  const next = () => {
    sfx('tap');
    if (step < 3) { setStep(step + 1); return; }
    sfx('complete'); finishOnboarding(GOALS[goal].xp); router.replace('/');
  };
  const say = [t('obHi'), t('obLang'), t('obGoal'), t('obVoice')][step];
  return (
    <View style={[s.wrap, { paddingTop: ins.top + 12, paddingBottom: ins.bottom + 16 }]}>
      <View style={s.track}><Animated.View style={[s.fill, bar]} /></View>
      <View style={s.hero}>
        <Animated.View key={'p' + step} entering={FadeInDown.duration(260)}>
          <Image source={step === 0 ? IMG.wave : step === 2 ? IMG.think : IMG.happy} style={{ width: step === 0 ? 210 : 120, height: step === 0 ? 220 : 128 }} contentFit="contain" />
        </Animated.View>
        <Animated.View key={'b' + step} entering={FadeInRight.duration(260)} style={[s.bubble, step === 0 && { alignSelf: 'center' }]}>
          <Text style={s.bubbleT}>{say}</Text>
          {step === 0 && <Text style={s.bubbleS}>{t('obHiSub')}</Text>}
        </Animated.View>
      </View>
      <Animated.View key={'o' + step} entering={FadeInDown.delay(120).duration(260)} style={{ gap: 12, flex: 1 }}>
        {step === 1 && ([['sr', 'Srpski'], ['ru', 'Русский'], ['en', 'English']] as [Lang, string][]).map(([id, n]) => <Row key={id} on={lang === id} onPress={() => { sfx('tap'); setLang(id); }} left={n} />)}
        {step === 2 && GOALS.map((g, i) => <Row key={g.min} on={goal === i} onPress={() => { sfx('tap'); setGoal(i); }} left={`${g.min} ${t('minDay')}`} right={t(g.k)} />)}
        {step === 3 && (['f', 'm'] as const).map(v => <Row key={v} on={voice === v} onPress={() => preview(v)} left={v === 'f' ? t('voiceF') : t('voiceM')} right="▶" />)}
      </Animated.View>
      <Btn3D onPress={next} face={C.green} shade={C.greenShade} radius={16} faceStyle={{ height: 54 }}>
        <Text style={s.cta}>{(step === 3 ? t('obGo') : t('next')).toUpperCase()}</Text>
      </Btn3D>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper, paddingHorizontal: 20 },
  track: { height: 16, borderRadius: 8, backgroundColor: C.gray, overflow: 'hidden' },
  fill: { height: 16, borderRadius: 8, backgroundColor: C.green },
  hero: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 26, marginBottom: 26 },
  bubble: { flex: 1, minWidth: 180, backgroundColor: C.card, borderRadius: 16, borderWidth: 2, borderColor: C.line, padding: 16, marginBottom: 20 },
  bubbleT: { fontFamily: F.display, fontSize: 20, color: C.ink },
  bubbleS: { fontFamily: F.bodyBold, fontSize: 15.5, color: C.soft, marginTop: 6, lineHeight: 21 },
  row: { height: 62, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18 },
  rowT: { fontFamily: F.bodyHeavy, fontSize: 17, color: C.ink },
  rowR: { fontFamily: F.bodyBold, fontSize: 15, color: C.faint },
  cta: { fontFamily: F.display, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.6 },
});
