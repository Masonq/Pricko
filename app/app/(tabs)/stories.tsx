import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sfx } from '../../src/sfx';
import { useStore } from '../../src/store';
import { C, F, IMG, WORLD_IMG } from '../../src/theme';
import { Btn3D, Press } from '../../src/ui';

export default function Stories() {
  const { t, stories } = useStore();
  const ins = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ paddingTop: ins.top + 10, paddingHorizontal: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={s.head}>
        <View style={{ flex: 1 }}><Text style={s.h1}>{t('stories')}</Text><Text style={s.sub}>{t('storiesSub')}</Text></View>
        <Image source={IMG.happy} style={{ width: 70, height: 72 }} contentFit="contain" />
      </View>
      <Animated.View entering={FadeInDown.springify().damping(16)}>
        <Btn3D onPress={() => { sfx('pop'); router.push('/story/new'); }} face="#2B2552" shade="#1A1638" radius={22} depth={6} faceStyle={s.hero}>
          <Image source={IMG.space} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['rgba(20,16,50,0.05)', 'rgba(20,16,50,0.85)']} start={{ x: 0, y: 0.2 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={s.heroIn}>
            <Text style={s.heroT}>{t('newStory')}</Text>
            <Text style={s.heroS}>{t('writingSub')}</Text>
          </View>
          <View style={s.plus}><Text style={s.plusT}>+</Text></View>
        </Btn3D>
      </Animated.View>
      <Text style={s.h2}>{t('recent')}</Text>
      {stories.length === 0 ? (
        <View style={s.empty}><Image source={IMG.think} style={{ width: 90, height: 96 }} contentFit="contain" /><Text style={s.emptyT}>{t('noStories')}</Text></View>
      ) : (
        <View style={s.grid}>
          {stories.map((st, i) => (
            <Animated.View key={st.id} entering={FadeInDown.delay(60 * i).springify().damping(17)} style={{ width: '50%', padding: 6 }}>
              <Press onPress={() => router.push({ pathname: '/story/[id]', params: { id: st.id } })} style={s.card} scale={0.96}>
                <Image source={WORLD_IMG[st.world] ?? IMG.book} style={s.cover} contentFit="cover" />
                <View style={{ padding: 10 }}>
                  <Text numberOfLines={2} style={s.cardT}>{st.title}</Text>
                  <Text style={s.cardS}>{st.name}</Text>
                </View>
              </Press>
            </Animated.View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  h1: { fontFamily: F.display, fontSize: 30, color: C.ink },
  sub: { fontFamily: F.bodyBold, fontSize: 15, color: C.soft, marginTop: 2 },
  hero: { height: 190, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'stretch' },
  heroIn: { padding: 18, paddingRight: 80 },
  heroT: { fontFamily: F.display, fontSize: 26, color: '#FFFFFF' },
  heroS: { fontFamily: F.bodyBold, fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  plus: { position: 'absolute', right: 16, bottom: 16, width: 52, height: 52, borderRadius: 26, backgroundColor: C.green, borderBottomWidth: 4, borderBottomColor: C.greenShade, alignItems: 'center', justifyContent: 'center' },
  plusT: { fontFamily: F.display, fontSize: 30, color: '#FFFFFF', marginTop: -3 },
  h2: { fontFamily: F.display, fontSize: 21, color: C.ink, marginTop: 26, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  card: { borderRadius: 18, borderWidth: 2, borderColor: C.line, borderBottomWidth: 5, overflow: 'hidden', backgroundColor: C.card },
  cover: { width: '100%', height: 120 },
  cardT: { fontFamily: F.bodyHeavy, fontSize: 15.5, color: C.ink, lineHeight: 19, minHeight: 38 },
  cardS: { fontFamily: F.bodyBold, fontSize: 13, color: C.faint, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8, borderWidth: 2, borderColor: C.line, borderRadius: 18, borderStyle: 'dashed' },
  emptyT: { fontFamily: F.bodyHeavy, fontSize: 15, color: C.soft },
});
