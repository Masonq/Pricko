import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { likeList, worldName } from '../../src/i18n';
import { useStore } from '../../src/store';
import { C, F, IMG, R, shadow } from '../../src/theme';
import { Button, Chip, H1, H2, Header, P, Press } from '../../src/ui';

const WORLDS: { id: 'dragons' | 'space' | 'sea' | 'forest'; img: any; tint?: string }[] = [
  { id: 'dragons', img: IMG.book }, { id: 'space', img: IMG.space }, { id: 'sea', img: IMG.sea }, { id: 'forest', img: IMG.forest },
];

export default function StoryHome() {
  const { t, lang, stories } = useStore();
  const ins = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [age, setAge] = useState(5);
  const [gender, setGender] = useState<'f' | 'm'>('f');
  const [world, setWorld] = useState<typeof WORLDS[number]['id']>('dragons');
  const [likes, setLikes] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [err, setErr] = useState('');
  const toggle = (v: string) => setLikes(l => (l.includes(v) ? l.filter(x => x !== v) : l.length >= 5 ? l : [...l, v]));
  const go = () => {
    if (!name.trim()) { setErr(t('needName')); return; }
    const all = custom.trim() ? [...likes, custom.trim()] : likes;
    router.replace({ pathname: '/story/writing', params: { body: JSON.stringify({ name: name.trim(), age, gender, likes: all, world, ui: lang }) } });
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: ins.bottom + 30 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <H1>{t('newStory')}</H1>
          <P style={{ marginTop: 6 }}>{t('storiesSub')}</P>

          <Text style={s.label}>{t('childName')}</Text>
          <TextInput value={name} onChangeText={v => { setName(v); setErr(''); }} placeholder="Mila" placeholderTextColor={C.faint} style={s.input} maxLength={30} autoCapitalize="words" />
          {!!err && <Text style={s.err}>{err}</Text>}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { marginTop: 0 }]}>{t('age')}</Text>
              <View style={s.stepper}>
                <Press onPress={() => setAge(a => Math.max(2, a - 1))} style={s.step}><Text style={s.stepT}>−</Text></Press>
                <Text style={s.ageT}>{age} <Text style={s.ageU}>{t('years')}</Text></Text>
                <Press onPress={() => setAge(a => Math.min(12, a + 1))} style={s.step}><Text style={s.stepT}>+</Text></Press>
              </View>
            </View>
            <View style={{ flex: 1.15 }}>
              <Text style={[s.label, { marginTop: 0 }]}>{' '}</Text>
              <View style={s.seg}>
                {(['f', 'm'] as const).map(g => (
                  <Press key={g} onPress={() => setGender(g)} style={[s.segItem, gender === g && s.segOn]} scale={0.96}>
                    <Text style={[s.segT, gender === g && { color: '#FFF4E0' }]}>{g === 'f' ? t('girl') : t('boy')}</Text>
                  </Press>
                ))}
              </View>
            </View>
          </View>

          <Text style={s.label}>{t('world')}</Text>
          <View style={s.worlds}>
            {WORLDS.map((w, i) => (
              <Animated.View key={w.id} entering={FadeInDown.delay(i * 50).duration(260)} style={{ width: '50%', padding: 5 }}>
                <Press onPress={() => setWorld(w.id)} style={[s.world, world === w.id && s.worldOn, shadow(world === w.id ? 10 : 4)]} scale={0.95}>
                  {w.img ? <Image source={w.img} style={StyleSheet.absoluteFill} contentFit="cover" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: w.tint }]} />}
                  <LinearGradient colors={['rgba(20,14,10,0)', 'rgba(20,14,10,0.7)']} start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                  <Text style={s.worldT}>{worldName(lang, w.id)}</Text>
                  {world === w.id && <View style={s.tick}><Text style={s.tickT}>✓</Text></View>}
                </Press>
              </Animated.View>
            ))}
          </View>

          <Text style={s.label}>{t('likes')}</Text>
          <View style={s.chips}>{likeList(lang).map(l => <Chip key={l} label={l} on={likes.includes(l)} onPress={() => toggle(l)} />)}</View>
          <TextInput value={custom} onChangeText={setCustom} placeholder={t('likeAdd')} placeholderTextColor={C.faint} style={[s.input, { marginTop: 10 }]} maxLength={30} />

          <Button title={t('write')} onPress={go} style={{ marginTop: 26 }} />

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
const s = StyleSheet.create({
  label: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.soft, marginTop: 22, marginBottom: 8 },
  input: { height: 54, borderRadius: 16, backgroundColor: C.paper2, paddingHorizontal: 16, fontFamily: F.bodyBold, fontSize: 17, color: C.ink, borderWidth: 2, borderColor: C.line },
  err: { fontFamily: F.bodyBold, color: C.red, marginTop: 6 },
  stepper: { height: 54, borderRadius: 16, backgroundColor: C.paper2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, borderWidth: 2, borderColor: C.line },
  step: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  stepT: { fontFamily: F.bodyHeavy, fontSize: 22, lineHeight: 24, color: C.ink },
  ageT: { fontFamily: F.display, fontSize: 22, color: C.ink }, ageU: { fontFamily: F.bodyBold, fontSize: 13, color: C.soft },
  seg: { height: 54, borderRadius: 16, backgroundColor: C.paper2, flexDirection: 'row', padding: 5, borderWidth: 2, borderColor: C.line },
  segItem: { flex: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.blue },
  segT: { fontFamily: F.bodyHeavy, fontSize: 14.5, color: C.ink },
  worlds: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  world: { height: 118, borderRadius: R.m, overflow: 'hidden', justifyContent: 'flex-end', borderWidth: 3, borderColor: 'transparent' },
  worldOn: { borderColor: C.blue },
  worldT: { fontFamily: F.display, fontSize: 19, color: '#FFF4E0', padding: 11 },
  tick: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  tickT: { fontFamily: F.bodyHeavy, color: '#FFF', fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 8, borderWidth: 2, borderColor: C.line },
  rowImg: { width: 64, height: 64, borderRadius: 12 },
  rowT: { fontFamily: F.displayBold, fontSize: 17, color: C.ink, lineHeight: 20 },
  rowS: { fontFamily: F.body, fontSize: 13, color: C.soft, marginTop: 2 },
});
