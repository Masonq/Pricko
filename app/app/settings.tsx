import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Lang } from '../src/i18n';
import { useStore } from '../src/store';
import { C, F, R } from '../src/theme';
import { Chip, Header, P } from '../src/ui';

export default function Settings() {
  const { t, lang, setLang, showTr, setShowTr } = useStore();
  const L: { id: Lang; name: string }[] = [{ id: 'sr', name: 'Srpski' }, { id: 'ru', name: 'Русский' }, { id: 'en', name: 'English' }];
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Header title={t('settings')} />
      <View style={{ padding: 18, gap: 14 }}>
        <View style={s.card}>
          <Text style={s.label}>{t('appLang')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>{L.map(l => <Chip key={l.id} label={l.name} on={lang === l.id} onPress={() => setLang(l.id)} />)}</View>
        </View>
        <View style={[s.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={s.row}>{t('showTr')}</Text>
          <Switch value={showTr} onValueChange={setShowTr} trackColor={{ true: C.indigo, false: C.paper2 }} />
        </View>
        <P style={{ textAlign: 'center', marginTop: 10 }}>{t('about')}</P>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.m, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  label: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.soft, marginBottom: 10 },
  row: { fontFamily: F.bodyBold, fontSize: 16, color: C.ink },
});
