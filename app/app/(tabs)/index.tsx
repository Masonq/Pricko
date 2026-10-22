import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { allLessons, COURSE } from '../../src/course';
import { sfx } from '../../src/sfx';
import { useStore } from '../../src/store';
import { C, F, IMG, R, shadow } from '../../src/theme';
import { Press } from '../../src/ui';

const UI = { flame: require('../../assets/ui/flame.png'), star: require('../../assets/ui/star.png'), lock: require('../../assets/ui/lock.png'), check: require('../../assets/ui/check.png') };
const OFFS = [0, 52, 78, 52, 0, -52, -78, -52];

function Bounce({ children }: { children: React.ReactNode }) {
  const y = useSharedValue(0);
  useEffect(() => { y.value = withRepeat(withSequence(withTiming(-6, { duration: 600, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) })), -1); }, []);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={a}>{children}</Animated.View>;
}

export default function Path() {
  const { t, lang, progress } = useStore();
  const ins = useSafeAreaInsets();
  const nextIdx = allLessons.findIndex(l => !progress.done[l.id]);
  let n = 0;
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={[s.top, { paddingTop: ins.top + 8 }]}>
        <Image source={IMG.pricko} style={{ width: 34, height: 40 }} contentFit="contain" />
        <View style={{ flex: 1 }} />
        <View style={s.stat}><Image source={UI.flame} tintColor={progress.streak ? '#E8762C' : C.faint} style={s.statIc} /><Text style={[s.statT, { color: progress.streak ? '#E8762C' : C.faint }]}>{progress.streak}</Text></View>
        <View style={s.stat}><Image source={UI.star} tintColor={C.ochre} style={s.statIc} /><Text style={[s.statT, { color: C.ochre }]}>{progress.xp}</Text></View>
        <Press onPress={() => router.push('/settings')} style={s.gear}><View style={{ flexDirection: 'row', gap: 3 }}>{[0, 1, 2].map(i => <View key={i} style={s.dot} />)}</View></Press>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {COURSE.map((u, ui) => (
          <View key={u.id}>
            <Animated.View entering={FadeInDown.delay(ui * 60).springify().damping(16)} style={[s.unit, { backgroundColor: u.color }, shadow(8)]}>
              <Text style={s.unitN}>{t('unit')} {ui + 1}</Text>
              <Text style={s.unitT}>{lang === 'en' ? u.title.en : lang === 'ru' ? u.title.ru : u.title.sr}</Text>
              {lang !== 'sr' && <Text style={s.unitS}>{u.title.sr}</Text>}
            </Animated.View>
            <View style={{ alignItems: 'center', paddingVertical: 14, gap: 18 }}>
              {u.lessons.map(l => {
                const idx = n++; const done = !!progress.done[l.id]; const cur = idx === nextIdx; const locked = !done && !cur;
                const node = (
                  <Press disabled={locked} onPress={() => { sfx('pop'); router.push({ pathname: '/lesson/[id]', params: { id: l.id } }); }} scale={0.9}
                    style={[s.node, { backgroundColor: locked ? '#E3D8C6' : u.color, transform: [{ translateX: OFFS[idx % OFFS.length] }] }, !locked && shadow(6)]}>
                    <View style={[s.nodeLip, { backgroundColor: locked ? '#CFC1AA' : 'rgba(0,0,0,0.22)' }]} />
                    <Image source={done ? UI.check : locked ? UI.lock : UI.star} tintColor={locked ? '#A69686' : '#FFF4E0'} style={{ width: 34, height: 34 }} />
                  </Press>
                );
                return (
                  <View key={l.id} style={{ alignItems: 'center' }}>
                    {cur ? (
                      <>
                        <Bounce><View style={[s.startTag, { transform: [{ translateX: OFFS[idx % OFFS.length] }] }]}><Text style={[s.startT, { color: u.color }]}>{done ? t('repeat') : t('start')}</Text></View></Bounce>
                        {node}
                      </>
                    ) : node}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ alignItems: 'center', marginTop: 10 }}><Image source={IMG.pricko} style={{ width: 120, height: 140 }} contentFit="contain" /></View>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: C.paper, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statIc: { width: 22, height: 22 },
  statT: { fontFamily: F.bodyHeavy, fontSize: 16 },
  gear: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  dot: { width: 4.5, height: 4.5, borderRadius: 3, backgroundColor: C.ink },
  unit: { marginHorizontal: 16, marginTop: 18, borderRadius: R.m, padding: 16 },
  unitN: { fontFamily: F.bodyHeavy, fontSize: 12.5, color: 'rgba(255,244,224,0.75)' },
  unitT: { fontFamily: F.display, fontSize: 25, color: '#FFF4E0', marginTop: 1 },
  unitS: { fontFamily: F.bodyBold, fontSize: 13.5, color: 'rgba(255,244,224,0.8)' },
  node: { width: 74, height: 70, borderRadius: 37, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  nodeLip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 7 },
  startTag: { backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 8, borderWidth: 2, borderColor: C.line },
  startT: { fontFamily: F.bodyHeavy, fontSize: 14 },
});
