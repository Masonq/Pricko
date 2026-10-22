import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, useAnimatedStyle, useSharedValue, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Confetti } from '../src/confetti';
import { COURSE, shuffle, ui, W } from '../src/course';
import { sfx } from '../src/sfx';
import { useStore } from '../src/store';
import { C, F, ICON, IMG } from '../src/theme';
import { Btn3D, Press } from '../src/ui';

const DUR = 60;
export default function Speed() {
  const { t, lang, progress, finishLesson } = useStore();
  const ins = useSafeAreaInsets();
  const pool = useMemo(() => {
    const units = COURSE.filter(u => u.lessons.some(l => progress.done[l.id]));
    return (units.length ? units : COURSE.slice(0, 2)).flatMap(u => u.lessons.flatMap(l => l.ex).flatMap((e: any) => e.item && e.t?.startsWith('mc') ? [e.item as W] : []))
      .filter((w, i, a) => a.findIndex(x => x.sr === w.sr) === i);
  }, []);
  const [phase, setPhase] = useState<'count' | 'play' | 'end'>('count');
  const [count, setCount] = useState(3);
  const [q, setQ] = useState<{ w: W; opts: W[] } | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [best, setBest] = useState(0);
  const [isBest, setIsBest] = useState(false);
  const timer = useSharedValue(1);
  const shake = useSharedValue(0);
  const tA = useAnimatedStyle(() => ({ width: `${timer.value * 100}%`, backgroundColor: timer.value < 0.2 ? '#FF4B4B' : '#FFC800' }));
  const sA = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const scoreRef = useRef(0);
  const next = () => { const w = pool[Math.floor(Math.random() * pool.length)]; setQ({ w, opts: shuffle([w, ...shuffle(pool.filter(x => x !== w)).slice(0, 3)]) }); };
  useEffect(() => { AsyncStorage.getItem('pricko.speedBest').then(v => setBest(+(v || 0))); }, []);
  useEffect(() => {
    if (phase !== 'count') return;
    if (count === 0) { sfx('combo'); setPhase('play'); next(); timer.value = withTiming(0, { duration: DUR * 1000, easing: Easing.linear }); const tm = setTimeout(end, DUR * 1000); return () => clearTimeout(tm); }
    sfx('pop'); const tm = setTimeout(() => setCount(c => c - 1), 750); return () => clearTimeout(tm);
  }, [count, phase]);
  const end = () => {
    cancelAnimation(timer); setPhase('end'); sfx('complete');
    const sc = scoreRef.current;
    AsyncStorage.getItem('pricko.speedBest').then(v => { if (sc > +(v || 0)) { setIsBest(true); setBest(sc); AsyncStorage.setItem('pricko.speedBest', String(sc)); } });
    if (sc > 0) finishLesson('practice', Math.min(20, sc), 100);
  };
  const pick = (o: W) => {
    if (!q || phase !== 'play') return;
    if (o === q.w) {
      const st = streak + 1; setStreak(st); const add = st >= 5 ? 2 : 1; scoreRef.current += add; setScore(scoreRef.current);
      sfx(st % 5 === 0 ? 'combo' : 'correct'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setFlash('+' + add);
    } else {
      setStreak(0); sfx('wrong'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      shake.value = withSequence(withTiming(-12, { duration: 50 }), withTiming(12, { duration: 50 }), withTiming(-8, { duration: 50 }), withTiming(0, { duration: 50 }));
      setFlash(null);
    }
    next();
  };
  if (phase === 'count') return (
    <View style={[s.wrap, { justifyContent: 'center', alignItems: 'center' }]}>
      <View style={s.glow} />
      <Image source={ICON.bolt} style={{ width: 120, height: 120 }} contentFit="contain" />
      <Animated.Text key={count} entering={ZoomIn.springify().damping(8)} style={s.count}>{count === 0 ? t('go') : count}</Animated.Text>
    </View>
  );
  if (phase === 'end') return (
    <View style={[s.wrap, { alignItems: 'center', paddingTop: ins.top + 40, paddingBottom: ins.bottom + 20 }]}>
      {isBest && <Confetti />}
      <Animated.View entering={ZoomIn.springify().damping(9)}><Image source={isBest ? IMG.happy : IMG.wave} style={{ width: 200, height: 210 }} contentFit="contain" /></Animated.View>
      <Text style={[s.endT, { color: isBest ? '#FF9600' : '#3C3C3C' }]}>{isBest ? t('newBest') : t('score')}</Text>
      <Text style={s.big}>{score}</Text>
      <Text style={s.bestT}>{t('best')}: {Math.max(best, score)}</Text>
      <View style={{ flex: 1 }} />
      <Btn3D onPress={() => { sfx('tap'); scoreRef.current = 0; setScore(0); setStreak(0); setIsBest(false); timer.value = 1; setCount(3); setPhase('count'); }} face="#FFC800" shade="#E5A500" radius={16} style={{ alignSelf: 'stretch', marginHorizontal: 20 }} faceStyle={{ height: 54 }}>
        <Text style={[s.ctaT, { color: '#3C2A00' }]}>{t('again').toUpperCase()}</Text>
      </Btn3D>
      <Press onPress={() => router.back()} style={{ padding: 14 }}><Text style={s.quit}>{t('quit').toUpperCase()}</Text></Press>
    </View>
  );
  return (
    <View style={[s.wrap, { paddingTop: ins.top + 8, paddingBottom: ins.bottom + 16 }]}>
      <View style={s.head}>
        <Press onPress={end} style={{ padding: 6 }}><Image source={require('../assets/ui/close.png')} tintColor="#AFAFAF" style={{ width: 22, height: 22 }} /></Press>
        <View style={s.track}><Animated.View style={[s.fill, tA]} /></View>
        <View style={s.scoreBox}><Image source={ICON.bolt} style={{ width: 22, height: 22 }} contentFit="contain" /><Text style={s.scoreT}>{score}</Text></View>
      </View>
      {streak >= 5 && <Animated.Text entering={FadeIn} style={s.mult}>×2</Animated.Text>}
      <View style={[s.glow, { top: '24%' }]} />
      <Animated.View style={[{ flex: 1, justifyContent: 'center' }, sA]}>
        {q && <Animated.Text key={q.w.sr + score} entering={ZoomIn.duration(180)} style={s.word}>{q.w.sr}</Animated.Text>}
        {flash && <Animated.Text key={'f' + score} entering={ZoomIn.springify()} style={s.flash}>{flash}</Animated.Text>}
      </Animated.View>
      <View style={s.grid}>
        {q?.opts.map((o, i) => (
          <View key={o.sr + i} style={{ width: '50%', padding: 6 }}>
            <Btn3D onPress={() => pick(o)} face="#FFFFFF" border="#E5E5E5" shade="#E5E5E5" radius={18} depth={5} faceStyle={{ height: 84, paddingHorizontal: 10 }}>
              <Text style={s.opt}>{ui(o, lang)}</Text>
            </Btn3D>
          </View>
        ))}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 16 },
  glow: { position: 'absolute', alignSelf: 'center', top: '18%', width: 300, height: 300, borderRadius: 150, backgroundColor: '#FFF6CC' },
  count: { fontFamily: F.display, fontSize: 96, color: '#FF9600', marginTop: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 16, borderRadius: 8, backgroundColor: '#E5E5E5', overflow: 'hidden' },
  fill: { height: 16, borderRadius: 8 },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreT: { fontFamily: F.display, fontSize: 20, color: '#E5A500', minWidth: 28 },
  mult: { alignSelf: 'center', fontFamily: F.display, fontSize: 18, color: '#FF9600', marginTop: 8 },
  word: { fontFamily: F.display, fontSize: 46, color: '#3C3C3C', textAlign: 'center' },
  flash: { position: 'absolute', alignSelf: 'center', top: '22%', fontFamily: F.display, fontSize: 30, color: '#58CC02' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  opt: { fontFamily: F.bodyHeavy, fontSize: 18, color: '#3C3C3C', textAlign: 'center' },
  endT: { fontFamily: F.display, fontSize: 26, marginTop: 8 },
  big: { fontFamily: F.display, fontSize: 84, color: '#E5A500' },
  bestT: { fontFamily: F.bodyHeavy, fontSize: 16, color: '#AFAFAF' },
  ctaT: { fontFamily: F.display, fontSize: 16, letterSpacing: 0.6 },
  quit: { fontFamily: F.bodyHeavy, fontSize: 14, color: '#AFAFAF', letterSpacing: 0.5 },
});
