import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { allLessons, COURSE } from '../../src/course';
import { useStore } from '../../src/store';
import { C, F, ICON, IMG } from '../../src/theme';
import { Press } from '../../src/ui';

const DAYS = { sr: ['P', 'U', 'S', 'Č', 'P', 'S', 'N'], ru: ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'], en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] };
const ACH = {
  first: { sr: 'Prvi korak', ru: 'Первый шаг', en: 'First step' }, fire: { sr: 'Vatra', ru: 'Огонёк', en: 'On fire' },
  hundred: { sr: 'Stotka', ru: 'Сотня', en: 'Hundred' }, unit: { sr: 'Celina', ru: 'Раздел', en: 'Unit' },
  stories: { sr: 'Pričalica', ru: 'Сказочник', en: 'Storyteller' }, master: { sr: 'Majstor', ru: 'Мастер', en: 'Master' },
};
const ACH_D = {
  first: { sr: 'Završi prvu lekciju', ru: 'Пройдите первый урок', en: 'Finish your first lesson' }, fire: { sr: 'Serija od 7 dana', ru: 'Серия 7 дней', en: '7-day streak' },
  hundred: { sr: 'Skupi 100 iskustva', ru: 'Наберите 100 опыта', en: 'Earn 100 XP' }, unit: { sr: 'Završi celu celinu', ru: 'Пройдите целый раздел', en: 'Finish a whole unit' },
  stories: { sr: 'Napravi 5 priča', ru: 'Создайте 5 сказок', en: 'Create 5 stories' }, master: { sr: 'Završi sve lekcije', ru: 'Пройдите все уроки', en: 'Finish all lessons' },
};

export default function Profile() {
  const { t, lang, progress, goal, stories } = useStore();
  const ins = useSafeAreaInsets();
  const done = Object.keys(progress.done).length;
  const crowns = COURSE.filter(u => u.lessons.every(l => progress.done[l.id])).length;
  const today = new Date(); const iso = (d: Date) => d.toISOString().slice(0, 10);
  const todayXp = progress.daily?.[iso(today)] ?? 0;
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return progress.daily?.[iso(d)] ?? 0; });
  const maxW = Math.max(goal, ...week);
  const ach: [keyof typeof ACH, any, number][] = [
    ['first', ICON.check, Math.min(1, done)], ['fire', ICON.flame, Math.min(1, (progress.best || 0) / 7)], ['hundred', ICON.star, Math.min(1, progress.xp / 100)],
    ['unit', ICON.crown, Math.min(1, crowns)], ['stories', ICON.chest, Math.min(1, stories.length / 5)], ['master', ICON.crown, done / allLessons.length],
  ];
  const stat = (ic: any, v: number | string, l: string, c: string) => (
    <View style={s.stat}><Image source={ic} style={{ width: 28, height: 28 }} contentFit="contain" /><View><Text style={[s.statV, { color: c }]}>{v}</Text><Text style={s.statL}>{l}</Text></View></View>
  );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ paddingTop: ins.top + 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={s.head}>
        <View style={{ flex: 1 }}><Text style={s.h1}>{t('profile')}</Text></View>
        <Press onPress={() => router.push('/settings')} style={s.more}><View style={{ flexDirection: 'row', gap: 3 }}>{[0, 1, 2].map(i => <View key={i} style={s.dot} />)}</View></Press>
      </View>
      <Animated.View entering={FadeInDown.duration(260)} style={s.hero}><Image source={IMG.wave} style={{ width: 150, height: 150 }} contentFit="contain" /></Animated.View>

      <Text style={s.h2}>{t('stats')}</Text>
      <View style={s.grid}>
        {stat(ICON.flame, progress.streak, t('streakDays'), C.orange)}
        {stat(ICON.star, progress.xp, t('totalXp'), '#E5A500')}
        {stat(ICON.check, done, t('lessonsDone'), C.greenShade)}
        {stat(ICON.crown, crowns, t('crowns'), '#E5A500')}
      </View>

      <Text style={s.h2}>{t('dailyGoal')}</Text>
      <View style={s.box}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={s.boxT}>{todayXp} / {goal} XP</Text><Image source={ICON.chest} style={{ width: 30, height: 26 }} contentFit="contain" />
        </View>
        <View style={s.track}><View style={[s.fill, { width: `${Math.min(100, (todayXp / goal) * 100)}%` }]} /></View>
        <Text style={[s.boxS, { marginTop: 16 }]}>{t('week')}</Text>
        <View style={s.chart}>
          {week.map((v, i) => (
            <View key={i} style={{ alignItems: 'center', flex: 1 }}>
              <View style={s.col}><View style={[s.colFill, { height: `${(v / maxW) * 100}%`, backgroundColor: v >= goal ? C.green : C.blue }]} /></View>
              <Text style={[s.day, i === (today.getDay() + 6) % 7 && { color: C.blueShade }]}>{DAYS[lang][i]}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={s.h2}>{t('achievements')}</Text>
      <View style={[s.box, { paddingVertical: 4 }]}>
        {ach.map(([k, ic, p], i) => (
          <View key={k} style={[s.ach, i > 0 && { borderTopWidth: 2, borderTopColor: C.line }]}>
            <View style={[s.achIc, { opacity: p >= 1 ? 1 : 0.45 }]}><Image source={ic} style={{ width: 40, height: 40 }} contentFit="contain" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.achT}>{ACH[k][lang]}</Text>
              <Text style={s.achD}>{ACH_D[k][lang]}</Text>
              <View style={[s.track, { height: 10, marginTop: 6 }]}><View style={[s.fill, { height: 10, width: `${Math.round(p * 100)}%`, backgroundColor: '#FFC800' }]} /></View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  h1: { fontFamily: F.display, fontSize: 28, color: C.ink },
  more: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.faint },
  hero: { alignItems: 'center', marginVertical: 6, marginHorizontal: 18, borderRadius: 20, backgroundColor: C.blueSoft, paddingVertical: 10 },
  h2: { fontFamily: F.display, fontSize: 21, color: C.ink, marginHorizontal: 18, marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 18 },
  stat: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderColor: C.line, borderRadius: 16, padding: 14 },
  statV: { fontFamily: F.display, fontSize: 20 },
  statL: { fontFamily: F.bodyBold, fontSize: 13, color: C.soft },
  box: { marginHorizontal: 18, borderWidth: 2, borderColor: C.line, borderRadius: 16, padding: 16 },
  boxT: { fontFamily: F.display, fontSize: 17, color: C.ink },
  boxS: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.soft },
  track: { height: 16, borderRadius: 8, backgroundColor: C.gray, overflow: 'hidden' },
  fill: { height: 16, borderRadius: 8, backgroundColor: C.green },
  chart: { flexDirection: 'row', height: 110, marginTop: 10, alignItems: 'flex-end' },
  col: { width: 18, height: 84, borderRadius: 9, backgroundColor: C.gray, justifyContent: 'flex-end', overflow: 'hidden' },
  colFill: { width: 18, borderRadius: 9 },
  day: { fontFamily: F.bodyHeavy, fontSize: 13, color: C.faint, marginTop: 6 },
  ach: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  achIc: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#FFF5D1', alignItems: 'center', justifyContent: 'center' },
  achT: { fontFamily: F.display, fontSize: 17, color: C.ink },
  achD: { fontFamily: F.bodyBold, fontSize: 13.5, color: C.soft, marginTop: 1 },
});
