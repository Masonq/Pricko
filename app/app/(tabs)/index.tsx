import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, SlideInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { allLessons, COURSE } from '../../src/course';
import { sfx } from '../../src/sfx';
import { useStore } from '../../src/store';
import { C, F, ICON, IMG } from '../../src/theme';
import { Btn3D, Press } from '../../src/ui';
import { WORD_IMG } from '../../src/words';

const UNIT_ART: Record<string, any> = { pozdravi: WORD_IMG.kafa, pekara: WORD_IMG.burek, brojevi: ICON.star, grad: WORD_IMG.tramvaj, porodica: WORD_IMG.kuca, kafana: WORD_IMG.cevapi, dani: ICON.flame, prodavnica: WORD_IMG.kesa, stan: WORD_IMG.krevet };

export const darken = (hex: string, f = 0.78) => { const n = parseInt(hex.slice(1), 16); const c = (v: number) => Math.round(v * f).toString(16).padStart(2, '0'); return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`; };
const OFFS = [0, -56, -84, -56, 0, 56, 84, 56];
const POSES = [IMG.wave, IMG.think, IMG.happy, IMG.pricko, IMG.think, IMG.happy];

function Flag() {
  return <View style={s.flag}><View style={{ flex: 1, backgroundColor: '#C6363C' }} /><View style={{ flex: 1, backgroundColor: '#0C4076' }} /><View style={{ flex: 1, backgroundColor: '#FFFFFF' }} /></View>;
}
function Bounce({ children }: { children: React.ReactNode }) {
  const y = useSharedValue(0);
  useEffect(() => { y.value = withRepeat(withSequence(withTiming(-5, { duration: 650, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 650, easing: Easing.inOut(Easing.quad) })), -1); }, []);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={a}>{children}</Animated.View>;
}

export default function Path() {
  const { t, lang, progress, goal } = useStore();
  const dayXp = progress.daily?.[new Date().toISOString().slice(0, 10)] ?? 0;
  const ins = useSafeAreaInsets();
  const nextIdx = allLessons.findIndex(l => !progress.done[l.id]);
  const [sheet, setSheet] = useState<{ id: string; color: string; title: string; n: number; done: boolean } | null>(null);
  const scroll = useRef<ScrollView>(null); const unitY = useRef<Record<number, number>>({}); const nodesY = useRef<Record<number, number>>({}); const scrolled = useRef(false);
  const goTo = (ui: number, y: number) => { if (scrolled.current) return; scrolled.current = true; const top = (unitY.current[ui] ?? 0) + (nodesY.current[ui] ?? 0) + y - 220; if (top > 40) setTimeout(() => scroll.current?.scrollTo({ y: top, animated: true }), 350); };
  let n = 0;
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={[s.top, { paddingTop: ins.top + 6 }]}>
        <Flag />
        <View style={s.stat}><Image source={ICON.flame} style={[s.ic, !progress.streak && { opacity: 0.35 }]} contentFit="contain" /><Text style={[s.statT, { color: progress.streak ? C.orange : C.faint }]}>{progress.streak}</Text></View>
        <View style={s.stat}><Image source={ICON.star} style={s.ic} contentFit="contain" /><Text style={[s.statT, { color: '#E5A500' }]}>{progress.xp}</Text></View>
        <View style={s.stat}><Image source={ICON.chest} style={[s.ic, { opacity: dayXp >= goal ? 1 : 0.45 }]} contentFit="contain" /><Text style={[s.statT, { color: dayXp >= goal ? C.greenShade : C.faint }]}>{Math.min(dayXp, goal)}/{goal}</Text></View>
        <Press onPress={() => router.push('/settings')} style={s.more}><View style={{ flexDirection: 'row', gap: 3 }}>{[0, 1, 2].map(i => <View key={i} style={s.dot} />)}</View></Press>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().damping(17)} style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Btn3D onPress={() => { sfx('pop'); router.push('/speed'); }} face="#2B2552" shade="#17132F" radius={18} depth={5} faceStyle={s.speed}>
            <View style={s.speedGlow} />
            <Image source={ICON.bolt} style={{ width: 52, height: 52 }} contentFit="contain" />
            <View style={{ flex: 1 }}><Text style={s.speedT}>{t('speed')}</Text><Text style={s.speedS}>{t('speedSub')}</Text></View>
          </Btn3D>
        </Animated.View>
        {(progress.mistakes?.length ?? 0) >= 3 && (
          <Animated.View entering={FadeInDown.springify().damping(17)} style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Btn3D onPress={() => { sfx('pop'); router.push({ pathname: '/lesson/[id]', params: { id: 'practice' } }); }} border={C.line} shade={C.line} radius={16} faceStyle={s.practice}>
              <Image source={IMG.think} style={{ width: 54, height: 60 }} contentFit="contain" />
              <View style={{ flex: 1 }}><Text style={s.practiceT}>{t('practice')} ({progress.mistakes.length})</Text><Text style={s.practiceS}>{t('practiceSub')}</Text></View>
            </Btn3D>
          </Animated.View>
        )}
        {COURSE.map((u, ui) => {
          const unitDone = u.lessons.every(l => progress.done[l.id]);
          return (
            <View key={u.id} onLayout={e => { unitY.current[ui] = e.nativeEvent.layout.y; }}>
              <Animated.View entering={FadeInDown.delay(ui * 50).springify().damping(17)} style={{ marginHorizontal: 16, marginTop: 20 }}>
                <Btn3D face={u.color} shade={darken(u.color)} radius={16} haptic={false} faceStyle={s.unitFace}>
                  <View style={{ flex: 1, paddingRight: 86 }}>
                    <Text style={s.unitN}>{t('unit').toUpperCase()} {ui + 1}</Text>
                    <Text style={s.unitT}>{lang === 'en' ? u.title.en : lang === 'ru' ? u.title.ru : u.title.sr}</Text>
                    {lang !== 'sr' && <Text style={s.unitSr}>{u.title.sr}</Text>}
                  </View>
                  <View style={s.unitArtBg} />
                  <Image source={UNIT_ART[u.id] ?? IMG.pricko} style={s.unitArt} contentFit="contain" />
                </Btn3D>
              </Animated.View>
              <View style={{ alignItems: 'center', paddingTop: 22, gap: 16 }} onLayout={e => { nodesY.current[ui] = e.nativeEvent.layout.y; }}>
                <Image source={POSES[ui % POSES.length]} style={[s.pose, ui % 2 ? { left: 20 } : { right: 20 }]} contentFit="contain" />
                {u.lessons.map(l => {
                  const idx = n++; const done = !!progress.done[l.id]; const cur = idx === nextIdx; const locked = !done && !cur;
                  const off = OFFS[idx % OFFS.length];
                  const face = locked ? C.gray : done ? '#FFC800' : u.color, sh = locked ? C.grayShade : done ? '#E5A500' : darken(u.color);
                  return (
                    <View key={l.id} style={{ alignItems: 'center', transform: [{ translateX: off }] }} onLayout={cur ? e => goTo(ui, e.nativeEvent.layout.y) : undefined}>
                      {cur && <Bounce><View style={s.tip}><Text style={[s.tipT, { color: u.color }]}>{t('start').toUpperCase()}</Text><View style={s.tipArrow} /></View></Bounce>}
                      <View style={cur ? s.ring : undefined}>
                        <Btn3D disabled={locked} onPress={() => { sfx('pop'); setSheet({ id: l.id, color: u.color, title: lang === 'en' ? u.title.en : lang === 'ru' ? u.title.ru : u.title.sr, n: (idx % 3) + 1, done }); }} face={face} shade={sh} depth={7} radius={40} faceStyle={s.node}>
                          <Image source={done ? ICON.crown : locked ? ICON.lock : ICON.star} style={{ width: 38, height: 38, opacity: locked ? 0.55 : 1 }} contentFit="contain" />
                        </Btn3D>
                      </View>
                    </View>
                  );
                })}
                <View style={{ transform: [{ translateX: OFFS[n % OFFS.length] }], opacity: unitDone ? 1 : 0.45 }}>
                  <Image source={ICON.chest} style={{ width: 70, height: 62 }} contentFit="contain" />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      {sheet && (
        <Animated.View entering={FadeIn.duration(150)} style={s.dim}>
          <Press haptic={false} scale={1} onPress={() => setSheet(null)} style={StyleSheet.absoluteFill}><View /></Press>
          <Animated.View entering={SlideInDown.springify().damping(17)} style={[s.sheet, { backgroundColor: sheet.color }]}>
            <Text style={s.sheetK}>{t('lessonN').toUpperCase()} {sheet.n} {t('ofN')} 3</Text>
            <Text style={s.sheetT}>{sheet.title}</Text>
            <Btn3D onPress={() => { const id = sheet.id; setSheet(null); router.push({ pathname: '/lesson/[id]', params: { id } }); }} face="#FFFFFF" shade="rgba(0,0,0,0.25)" radius={16} style={{ marginTop: 16 }} faceStyle={{ height: 54 }}>
              <Text style={[s.sheetBtn, { color: sheet.color }]}>{(sheet.done ? t('repeat') : t('start')).toUpperCase()} +10 XP</Text>
            </Btn3D>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  dim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { margin: 14, marginBottom: 24, borderRadius: 22, padding: 20 },
  sheetK: { fontFamily: F.bodyHeavy, fontSize: 13, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 },
  sheetT: { fontFamily: F.display, fontSize: 26, color: '#FFFFFF', marginTop: 2 },
  sheetBtn: { fontFamily: F.display, fontSize: 16, letterSpacing: 0.6 },
  speed: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, overflow: 'hidden', justifyContent: 'flex-start' },
  speedGlow: { position: 'absolute', left: -20, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,200,0,0.18)' },
  speedT: { fontFamily: F.display, fontSize: 20, color: '#FFC800' },
  speedS: { fontFamily: F.bodyBold, fontSize: 13.5, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: C.paper, borderBottomWidth: 2, borderBottomColor: C.line },
  flag: { width: 34, height: 25, borderRadius: 6, overflow: 'hidden', borderWidth: 2, borderColor: C.line },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ic: { width: 26, height: 26 },
  statT: { fontFamily: F.bodyHeavy, fontSize: 17 },
  more: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.faint },
  unitFace: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 18, minHeight: 96, overflow: 'hidden', justifyContent: 'flex-start' },
  unitN: { fontFamily: F.bodyHeavy, fontSize: 13, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.4 },
  unitT: { fontFamily: F.display, fontSize: 22, color: '#FFFFFF', marginTop: 1 },
  unitSr: { fontFamily: F.bodyBold, fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  unitArtBg: { position: 'absolute', right: -20, top: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.14)' },
  unitArt: { position: 'absolute', right: 10, bottom: 8, width: 84, height: 74 },
  unitTag: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  unitTagT: { fontFamily: F.bodyHeavy, fontSize: 13, color: '#FFFFFF' },
  node: { width: 74, height: 68 },
  ring: { padding: 6, borderRadius: 50, borderWidth: 5, borderColor: C.gray },
  tip: { backgroundColor: C.card, borderRadius: 12, borderWidth: 2, borderColor: C.line, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10, alignItems: 'center' },
  tipT: { fontFamily: F.display, fontSize: 15, letterSpacing: 0.5 },
  tipArrow: { position: 'absolute', bottom: -8, width: 14, height: 14, backgroundColor: C.card, borderRightWidth: 2, borderBottomWidth: 2, borderColor: C.line, transform: [{ rotate: '45deg' }] },
  practice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, justifyContent: 'flex-start' },
  practiceT: { fontFamily: F.display, fontSize: 17, color: C.ink },
  practiceS: { fontFamily: F.bodyBold, fontSize: 13.5, color: C.soft, marginTop: 1 },
  pose: { position: 'absolute', top: 70, width: 110, height: 120 },
});
