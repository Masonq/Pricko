import { AudioModule, createAudioPlayer, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, mediaUrl, say, talk } from '../../src/api';
import { SCENARIOS } from '../../src/scenarios';
import { useStore } from '../../src/store';
import { C, F, IMG, R, shadow } from '../../src/theme';
import { Press } from '../../src/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

type Msg = { id: string; role: 'user' | 'assistant'; text: string; tr?: string; audio?: string | null; fix?: { wrong: string; right: string; why: string } | null; pending?: boolean };
const uid = () => Math.random().toString(36).slice(2);

export default function Talk() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sc = SCENARIOS.find(x => x.id === id) ?? SCENARIOS[0];
  const { t, lang, device, showTr } = useStore();
  const ins = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 'open', role: 'assistant', text: sc.open, tr: lang === 'sr' ? '' : sc.openTr[lang] }]);
  const [busy, setBusy] = useState(false);
  const [rec, setRec] = useState(false);
  const [hint, setHint] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');
  const [openTr, setOpenTr] = useState<Record<string, boolean>>({});
  const scroll = useRef<ScrollView>(null);
  const player = useRef(createAudioPlayer(null)).current;
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const started = useRef(0);

  useEffect(() => () => { try { player.remove(); } catch {} }, []);
  const play = useCallback(async (url?: string | null) => {
    const u = mediaUrl(url); if (!u) return;
    try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); player.replace({ uri: u }); player.play(); } catch {}
  }, []);
  // приветствие голосом
  useEffect(() => { say(device, sc.open).then(r => { setMsgs(m => m.map(x => x.id === 'open' ? { ...x, audio: r.audio } : x)); play(r.audio); }).catch(() => {}); }, []);
  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60); }, [msgs.length, busy]);

  const flash = (s: string) => { setNote(s); setTimeout(() => setNote(n => (n === s ? '' : n)), 4500); };
  const errText = (e: unknown) => e instanceof ApiError ? (e.code === 'limit' ? t('limit') : e.code === 'offline' ? t('offline') : e.code === 'empty' ? t('notHeard') : t('busy')) : t('busy');

  const send = useCallback(async (a: { audioUri?: string; text?: string }) => {
    const mine: Msg = { id: uid(), role: 'user', text: a.text ?? '…', pending: !a.text };
    const history = msgs.map(m => ({ role: m.role, text: m.text }));
    setMsgs(m => [...m, mine]); setBusy(true); setHint('');
    try {
      const r = await talk(device, { scenario: sc.id, history, ui: lang, ...a });
      if (r.empty || !r.heard) { setMsgs(m => m.filter(x => x.id !== mine.id)); flash(t('notHeard')); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setMsgs(m => [...m.map(x => x.id === mine.id ? { ...x, text: r.heard, pending: false, fix: r.correction } : x),
        { id: uid(), role: 'assistant', text: r.reply, tr: r.translation, audio: r.audio }]);
      setHint(r.hint || ''); if (r.done) setDone(true);
      play(r.audio);
    } catch (e) {
      setMsgs(m => m.filter(x => x.id !== mine.id)); flash(errText(e) + (e instanceof ApiError ? ` (${e.message.slice(0, 50)})` : ''));
    } finally { setBusy(false); }
  }, [msgs, device, lang]);

  // кнопка микрофона: держать — запись
  const pulse = useSharedValue(0);
  const ring = useAnimatedStyle(() => ({ opacity: 0.35 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 0.7 }] }));
  const btnScale = useSharedValue(1);
  const btnA = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  // Запись: удержание — говоришь и отпускаешь; короткое нажатие — запись до второго нажатия.
  const recRef = useRef(false), startingRef = useRef(false), pressAt = useRef(0), releaseAction = useRef<'none' | 'send' | 'keep'>('none'), maxTimer = useRef<any>(null);
  const [tapMode, setTapMode] = useState(false);
  const startRec = async () => {
    startingRef.current = true; releaseAction.current = 'none';
    try {
      let p = await AudioModule.getRecordingPermissionsAsync();
      if (!p.granted) p = await AudioModule.requestRecordingPermissionsAsync();
      if (!p.granted) { flash(t('micDenied')); startingRef.current = false; return; }
      try { player.pause(); } catch {}
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync(); recorder.record();
      started.current = Date.now(); recRef.current = true; setRec(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      btnScale.value = withTiming(1.12, { duration: 200 });
      pulse.value = 0; pulse.value = withRepeat(withTiming(1, { duration: 1100 }), -1, false);
      clearTimeout(maxTimer.current); maxTimer.current = setTimeout(() => { if (recRef.current) stopRec(true); }, 30000);
    } catch (e) { flash(t('busy') + ' (mic: ' + String((e as any)?.message ?? e).slice(0, 60) + ')'); }
    finally {
      startingRef.current = false;
      // палец отпустили, пока запись запускалась
      const act = releaseAction.current as string;
      if (recRef.current && act === 'send') stopRec(true);
      if (recRef.current && act === 'keep') setTapMode(true);
    }
  };
  const stopRec = async (sendIt: boolean) => {
    if (!recRef.current) return;
    recRef.current = false; setRec(false); setTapMode(false); clearTimeout(maxTimer.current);
    btnScale.value = withTiming(1, { duration: 200 }); cancelAnimation(pulse); pulse.value = withTiming(0);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const dur = Date.now() - started.current;
      if (!sendIt) return;
      if (dur < 600 || !recorder.uri) { flash(t('tooShort')); return; }
      send({ audioUri: recorder.uri });
    } catch (e) { flash(t('busy') + ' (rec: ' + String((e as any)?.message ?? e).slice(0, 60) + ')'); }
  };
  const onMicIn = () => {
    if (busy) return;
    pressAt.current = Date.now();
    if (recRef.current) { stopRec(true); return; }   // второе нажатие в режиме «нажал — говори»
    if (!startingRef.current) startRec();
  };
  const onMicOut = () => {
    const held = Date.now() - pressAt.current;
    const action = held >= 450 ? 'send' : 'keep';
    if (startingRef.current) { releaseAction.current = action; return; }
    if (!recRef.current) return;
    if (action === 'send') stopRec(true); else setTapMode(true);
  };
  useEffect(() => () => { clearTimeout(maxTimer.current); if (recRef.current) recorder.stop().catch(() => {}); }, []);
  const sendText = () => { const v = text.trim(); if (!v || busy) return; setText(''); send({ text: v }); };
  const restart = () => { setMsgs([{ id: 'open', role: 'assistant', text: sc.open, tr: lang === 'sr' ? '' : sc.openTr[lang] }]); setDone(false); setHint(''); };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={[s.hero, { paddingTop: ins.top }]}>
        {sc.img ? <Image source={sc.img} style={StyleSheet.absoluteFill} contentFit="cover" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: C.ochre }]} />}
        <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
        <View style={[s.heroTop, { top: ins.top + 6 }]}>
          <Press onPress={() => router.back()} style={s.glass}><Image source={require('../../assets/ui/back.png')} tintColor="#FFFFFF" style={{ width: 18, height: 18 }} /></Press>
          <Press onPress={() => setTyping(v => !v)} style={s.glass}>{typing ? <View style={{ alignItems: 'center' }}><View style={[s.micHead, { width: 9, height: 14 }]} /><View style={[s.micBase, { width: 10, height: 2, marginTop: 2 }]} /></View> : <Text style={[s.kbdText, { color: '#FFFFFF' }]}>Aa</Text>}</Press>
        </View>
        <Text style={s.heroT}>{sc.title[lang]}</Text>
        <View style={s.goalChip}><Text style={s.goalLabel}>{t('goal')}</Text><Text style={s.goalText} numberOfLines={1}>{sc.goal[lang]}</Text></View>
      </View>
      <View style={{ display: 'none' }}><Press onPress={() => setTyping(v => !v)} style={s.kbd}>{typing ? <View style={{ alignItems: 'center' }}><View style={[s.micHead, { width: 9, height: 14, backgroundColor: C.ink }]} /><View style={[s.micBase, { width: 10, height: 2, backgroundColor: C.ink, marginTop: 2 }]} /></View> : <Text style={s.kbdText}>Aa</Text>}</Press></View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {msgs.map(m => (
            <Animated.View key={m.id} entering={FadeInUp.duration(260)} style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '88%' }}>
                {m.role === 'assistant' && <Image source={IMG.pricko} style={s.ava} contentFit="contain" />}
                <Press haptic={false} scale={0.98} onPress={() => { if (m.role === 'assistant') { play(m.audio); setOpenTr(o => ({ ...o, [m.id]: !o[m.id] })); } }}
                  style={[s.bubble, m.role === 'user' ? s.me : s.bot]}>
                  <Text style={[s.msg, m.role === 'user' && { color: '#FFFFFF' }, m.pending && { opacity: 0.6 }]}>{m.text}</Text>
                  {m.role === 'assistant' && !!m.tr && (showTr || openTr[m.id]) && <Text style={s.tr}>{m.tr}</Text>}
                </Press>
              </View>
              {m.fix && (
                <Animated.View entering={FadeIn.delay(200)} style={s.fix}>
                  <Text style={s.fixLine}><Text style={s.wrong}>{m.fix.wrong}</Text>  →  <Text style={s.right}>{m.fix.right}</Text></Text>
                  {!!m.fix.why && <Text style={s.why}>{m.fix.why}</Text>}
                </Animated.View>
              )}
            </Animated.View>
          ))}
          {busy && <Animated.View entering={FadeIn} style={s.thinking}><Text style={s.thinkingText}>{t('thinking')}</Text></Animated.View>}
          {done && (
            <Animated.View entering={FadeInDown.duration(260)} style={[s.done, shadow(8)]}>
              <Text style={s.doneText}>{t('bravo')}</Text>
              <Press onPress={restart} style={s.again}><Text style={s.againText}>{t('again')}</Text></Press>
            </Animated.View>
          )}
        </ScrollView>
        {!!hint && !busy && (
          <Animated.View entering={FadeInDown} style={s.hintWrap}>
            <Press onPress={() => say(device, hint).then(r => play(r.audio)).catch(() => {})} style={s.hint}>
              <Text style={s.hintLabel}>{t('youCanSay')}</Text><Text style={s.hintText}>{hint}</Text>
            </Press>
          </Animated.View>
        )}
        {!!note && <Animated.Text entering={FadeIn} style={s.note}>{note}</Animated.Text>}
        <View style={[s.bar, { paddingBottom: Math.max(ins.bottom, 12) + 6 }]}>
          {typing ? (
            <View style={s.inputRow}>
              <TextInput value={text} onChangeText={setText} placeholder={t('typeHere')} placeholderTextColor={C.faint} style={s.input}
                onSubmitEditing={sendText} returnKeyType="send" autoCorrect={false} autoCapitalize="sentences" />
              <Press onPress={sendText} disabled={busy || !text.trim()} style={[s.sendBtn, (busy || !text.trim()) && { opacity: 0.4 }]}><Text style={s.sendText}>↑</Text></Press>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <View style={s.micWrap}>
                <Animated.View style={[s.ring, ring]} />
                <Animated.View style={btnA}>
                  <Press haptic={false} scale={1} onPressIn={onMicIn} onPressOut={onMicOut} disabled={busy}
                    style={[s.mic, rec && { backgroundColor: C.red }, busy && { opacity: 0.5 }, shadow(10)]}>
                    <View style={s.micIcon}><View style={s.micHead} /><View style={s.micStem} /><View style={s.micBase} /></View>
                  </Press>
                </Animated.View>
              </View>
              <Text style={s.micLabel}>{rec ? (tapMode ? t('tapToSend') : t('listening')) : t('hold')}</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { height: 210, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 14, overflow: 'hidden' },
  heroTop: { position: 'absolute', left: 16, right: 16, top: 0, flexDirection: 'row', justifyContent: 'space-between' },
  glass: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  heroT: { fontFamily: F.display, fontSize: 30, color: '#FFFFFF' },
  goalChip: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, maxWidth: '100%' },
  kbd: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  kbdText: { fontFamily: F.bodyHeavy, fontSize: 15, color: C.ink },
  goal: { marginHorizontal: 16, marginTop: 2, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.ochreSoft, borderWidth: 2, borderColor: '#FFE38A', flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalLabel: { fontFamily: F.display, fontSize: 12.5, color: '#E5A500' },
  goalText: { fontFamily: F.bodyBold, fontSize: 14, color: C.ink, flex: 1 },
  ava: { width: 34, height: 40, marginBottom: 2 },
  bubble: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: 20, flexShrink: 1 },
  bot: { backgroundColor: C.card, borderBottomLeftRadius: 6, borderWidth: 2, borderColor: C.line },
  me: { backgroundColor: C.blue, borderBottomRightRadius: 6 },
  msg: { fontFamily: F.bodyBold, fontSize: 17, lineHeight: 23, color: C.ink },
  tr: { fontFamily: F.body, fontSize: 14, lineHeight: 19, color: C.soft, marginTop: 4 },
  fix: { marginTop: 6, maxWidth: '88%', backgroundColor: C.greenSoft, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 },
  fixLine: { fontFamily: F.bodyBold, fontSize: 15, color: C.ink },
  wrong: { color: C.red, textDecorationLine: 'line-through' }, right: { color: C.green },
  why: { fontFamily: F.body, fontSize: 13, color: C.soft, marginTop: 2 },
  thinking: { alignSelf: 'flex-start', marginLeft: 42, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, backgroundColor: C.card },
  thinkingText: { fontFamily: F.bodyBold, fontSize: 14, color: C.soft },
  done: { marginTop: 6, backgroundColor: C.green, borderRadius: R.m, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  doneText: { fontFamily: F.display, fontSize: 21, color: '#FFF4E0', flex: 1 },
  again: { backgroundColor: '#FFF4E0', paddingHorizontal: 14, height: 38, borderRadius: R.pill, justifyContent: 'center' },
  againText: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.indigo },
  hintWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  hint: { backgroundColor: C.blueSoft, borderRadius: 16, borderWidth: 2, borderColor: C.blueLine, paddingHorizontal: 14, paddingVertical: 9 },
  hintLabel: { fontFamily: F.display, fontSize: 12, color: C.blueShade },
  hintText: { fontFamily: F.bodyBold, fontSize: 15.5, color: C.ink, marginTop: 1 },
  note: { textAlign: 'center', fontFamily: F.bodyBold, fontSize: 14, color: C.red, paddingBottom: 6, paddingHorizontal: 20 },
  bar: { paddingTop: 10, paddingHorizontal: 16, backgroundColor: C.paper, borderTopWidth: 2, borderTopColor: C.line },
  micWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: C.red },
  mic: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 6, borderBottomColor: C.blueShade },
  micIcon: { alignItems: 'center' },
  micHead: { width: 18, height: 28, borderRadius: 9, backgroundColor: '#FFF4E0' },
  micStem: { width: 3, height: 7, backgroundColor: '#FFF4E0', marginTop: 3 },
  micBase: { width: 18, height: 3, borderRadius: 2, backgroundColor: '#FFF4E0' },
  micLabel: { fontFamily: F.bodyHeavy, fontSize: 13, color: C.soft, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, height: 50, borderRadius: 16, backgroundColor: C.paper2, paddingHorizontal: 16, fontFamily: F.bodyBold, fontSize: 16, color: C.ink, borderWidth: 2, borderColor: C.line },
  sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontFamily: F.bodyHeavy, fontSize: 22, color: '#FFF4E0', marginTop: -2 },
});
