import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../src/store';
import { C, F, IMG, R, shadow } from '../src/theme';
import { H1, H2, P, Press } from '../src/ui';

function Bird({ size = 120 }: { size?: number }) {
  const y = useSharedValue(0);
  useEffect(() => { y.value = withRepeat(withSequence(withTiming(-7, { duration: 1500, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })), -1); }, []);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: `${y.value * 0.4}deg` }] }));
  return <Animated.View style={a}><Image source={IMG.pricko} style={{ width: size, height: size * 1.2 }} contentFit="contain" /></Animated.View>;
}

function Big({ img, title, sub, onPress, delay }: { img: any; title: string; sub: string; onPress: () => void; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)}>
      <Press onPress={onPress} style={[s.big, shadow(14)]} scale={0.97}>
        <Image source={img} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        <LinearGradient colors={['rgba(20,14,10,0)', 'rgba(20,14,10,0.78)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }} />
        <View style={s.bigText}>
          <Text style={s.bigTitle}>{title}</Text>
          <Text style={s.bigSub}>{sub}</Text>
        </View>
        <View style={s.go}><Text style={s.goArrow}>›</Text></View>
      </Press>
    </Animated.View>
  );
}

export default function Home() {
  const { t, stories } = useStore();
  const ins = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ paddingTop: ins.top + 10, paddingBottom: ins.bottom + 40, paddingHorizontal: 18 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Press onPress={() => router.push('/settings')} style={s.gear} accessibilityLabel={t('settings')}>
          <View style={s.dots}><View style={s.dot} /><View style={s.dot} /><View style={s.dot} /></View>
        </Press>
      </View>
      <View style={s.top}>
        <View style={{ flex: 1, paddingTop: 6 }}>
          <Animated.View entering={FadeInDown.springify().damping(16)}><H1>{t('hello')}</H1></Animated.View>
          <Animated.View entering={FadeInDown.delay(80).springify().damping(16)}><P style={{ marginTop: 6, fontSize: 17 }}>{t('homeSub')}</P></Animated.View>
        </View>
        <View style={{ marginTop: 8, marginRight: 2 }}><Bird size={92} /></View>
      </View>
      <View style={{ gap: 14, marginTop: 8 }}>
        <Big img={IMG.bakery} title={t('talk')} sub={t('talkSub')} onPress={() => router.push('/talk')} delay={120} />
        <Big img={IMG.book} title={t('stories')} sub={t('storiesSub')} onPress={() => router.push('/story')} delay={200} />
      </View>
      {stories.length > 0 && (
        <Animated.View entering={FadeInDown.delay(280).springify().damping(16)} style={{ marginTop: 30 }}>
          <H2>{t('recent')}</H2>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 12 }}>
            {stories.slice(0, 8).map(st => (
              <Press key={st.id} onPress={() => router.push({ pathname: '/story/[id]', params: { id: st.id } })} style={[s.mini, shadow(8)]}>
                <Image source={st.world === 'space' ? IMG.space : IMG.book} style={s.miniImg} contentFit="cover" />
                <Text numberOfLines={2} style={s.miniTitle}>{st.title}</Text>
              </Press>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  gear: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, borderWidth: StyleSheet.hairlineWidth, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 3 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.ink },
  big: { height: 250, borderRadius: R.l, overflow: 'hidden', backgroundColor: C.paper2, justifyContent: 'flex-end' },
  bigText: { padding: 20, paddingRight: 70 },
  bigTitle: { fontFamily: F.display, fontSize: 34, color: '#FFF4E0', lineHeight: 38 },
  bigSub: { fontFamily: F.bodyBold, fontSize: 15, color: 'rgba(255,244,224,0.88)', marginTop: 4 },
  go: { position: 'absolute', right: 18, bottom: 20, width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFF4E0', alignItems: 'center', justifyContent: 'center' },
  goArrow: { fontFamily: F.bodyHeavy, fontSize: 30, lineHeight: 32, color: C.ink, marginLeft: 3, marginTop: -2 },
  mini: { width: 150, borderRadius: R.m, backgroundColor: C.card, overflow: 'hidden' },
  miniImg: { width: 150, height: 110 },
  miniTitle: { fontFamily: F.displayBold, fontSize: 16, color: C.ink, padding: 10, lineHeight: 19, minHeight: 58 },
});
