import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCENARIOS } from '../../src/scenarios';
import { useStore } from '../../src/store';
import { C, F, IMG, R, shadow } from '../../src/theme';
import { H1, P, Press } from '../../src/ui';

export default function Places() {
  const { t, lang } = useStore();
  const ins = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={{ height: ins.top + 14 }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: ins.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flex: 1 }}><H1>{t('pickPlace')}</H1><P style={{ marginTop: 4 }}>{t('pickPlaceSub')}</P></View>
          <Image source={IMG.wave} style={{ width: 70, height: 72 }} contentFit="contain" />
        </View>
        <View style={s.grid}>
          {SCENARIOS.map((sc, i) => (
            <Animated.View key={sc.id} entering={FadeInDown.delay(60 * i).springify().damping(16)} style={s.cell}>
              <Press onPress={() => router.push({ pathname: '/talk/[id]', params: { id: sc.id } })} style={[s.card, shadow(10)]} scale={0.95}>
                {sc.img ? <Image source={sc.img} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: C.ochre, alignItems: 'center', justifyContent: 'center' }]}>
                    <Image source={IMG.pricko} style={{ width: '62%', height: '62%' }} contentFit="contain" />
                  </View>
                )}
                <LinearGradient colors={['rgba(20,14,10,0)', 'rgba(20,14,10,0.82)']} start={{ x: 0, y: 0.4 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <View style={{ padding: 13 }}>
                  <Text style={s.title}>{sc.title[lang]}</Text>
                  <Text numberOfLines={2} style={s.goal}>{sc.goal[lang]}</Text>
                </View>
              </Press>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  cell: { width: '50%', padding: 6 },
  card: { aspectRatio: 0.74, borderRadius: 20, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: C.paper2, borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.25)' },
  title: { fontFamily: F.display, fontSize: 23, color: '#FFF4E0' },
  goal: { fontFamily: F.bodyBold, fontSize: 12.5, lineHeight: 16, color: 'rgba(255,244,224,0.85)', marginTop: 2 },
});
