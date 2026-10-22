import { AudioModule, createAudioPlayer, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mediaUrl, sayCached, sttCheck } from '../../src/api';
import { allLessons, COURSE, Ex, fold, norm, shuffle, similar, tokens, ui, W } from '../../src/course';
import { Lang } from '../../src/i18n';
import { sfx } from '../../src/sfx';
import { useStore } from '../../src/store';
import { C, F, ICON, IMG, R } from '../../src/theme';
import { Btn3D, Press } from '../../src/ui';

const UIIMG = { close: require('../../assets/ui/close.png'), speaker: require('../../assets/ui/speaker.png'), check: require('../../assets/ui/check.png') };
const GREEN = '#58CC02', GREEN_D = '#58A700', GREEN_BG = '#D7FFB8', RED = '#FF4B4B', RED_D = '#EA2B2B', RED_BG = '#FFDFE0', BLUE = '#1CB0F6', BLUE_D = '#1899D6', BLUE_BG = '#DDF4FF', BLUE_L = '#84D8FF';
type Pending = { ok: boolean; correct: string; note?: string } | null;

// ---------- озвучка ----------
const voice = createAudioPlayer(null);
let speakDevice = 'anon';
async function speak(text: string, slow = false) {
  try {
    const u = mediaUrl(await sayCached(speakDevice, text, slow)); if (!u) return;
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    voice.replace({ uri: u }); voice.play();
  } catch {}
}
function SpeakBtn({ text, size = 64, slow }: { text: string; size?: number; slow?: boolean }) {
  return (
    <Btn3D onPress={() => speak(text, slow)} face={BLUE} shade={BLUE_D} radius={size * 0.26} depth={slow ? 3 : 5} faceStyle={{ width: size, height: size }}>
      <Image source={UIIMG.speaker} tintColor="#FFFFFF" style={{ width: size * 0.48, height: size * 0.48 }} />
      {slow && <Text style={st.slowT}>×½</Text>}
    </Btn3D>
  );
}

// ---------- варианты ответа ----------
function Option({ label, sel, onPress, sub, big }: { label: string; sel: boolean; onPress: () => void; sub?: string; big?: boolean }) {
  return (
    <Btn3D onPress={onPress} face={sel ? BLUE_BG : C.card} border={sel ? BLUE_L : C.line} shade={sel ? BLUE_L : C.line} radius={16} faceStyle={[st.opt, big && { minHeight: 74 }]}>
      <Text style={[st.optT, sel && { color: BLUE_D }]}>{label}</Text>
      {!!sub && <Text style={st.optSub}>{sub}</Text>}
    </Btn3D>
  );
}
function Character({ img = IMG.pricko, children }: { img?: any; children: React.ReactNode }) {
  return (
    <View style={st.prompt}>
      <Image source={img} style={{ width: 96, height: 112 }} contentFit="contain" />
      <View style={st.bubble}><View style={st.bubbleTail} />{children}</View>
    </View>
  );
}

function MC({ ex, lang, set }: { ex: Extract<Ex, { t: 'mc_sr' | 'mc_ui' | 'listen_choose' }>; lang: Lang; set: (p: Pending) => void }) {
  const opts = useMemo(() => shuffle([ex.item, ...ex.wrong]), [ex]);
  const [sel, setSel] = useState<W | null>(null);
  const showSr = ex.t !== 'mc_sr';
  useEffect(() => { if (ex.t !== 'mc_ui') setTimeout(() => speak(ex.item.sr), 250); }, [ex]);
  const correct = showSr ? ex.item.sr : ui(ex.item, lang);
  return (
    <View style={{ gap: 18 }}>
      {ex.t === 'mc_sr' && <Character><Press onPress={() => speak(ex.item.sr)} style={st.wordRow}><Image source={ICON.speaker} style={{ width: 28, height: 24 }} contentFit="contain" /><Text style={st.bubbleBig}>{ex.item.sr}</Text></Press></Character>}
      {ex.t === 'mc_ui' && <Character img={IMG.think}><Text style={st.bubbleBig}>{ui(ex.item, lang)}</Text></Character>}
      {ex.t === 'listen_choose' && <View style={st.listenRow}><SpeakBtn text={ex.item.sr} size={96} /><SpeakBtn text={ex.item.sr} size={64} slow /></View>}
      <View style={st.grid}>
        {opts.map((o, i) => (
          <View key={i} style={{ width: '50%', padding: 5 }}>
            <Option big label={showSr ? o.sr : ui(o, lang)} sel={sel === o} onPress={() => { sfx('tap'); setSel(o); if (showSr) speak(o.sr); set({ ok: o === ex.item, correct }); }} />
          </View>
        ))}
      </View>
    </View>
  );
}

function Tiles({ ex, lang, set }: { ex: Extract<Ex, { t: 'tiles_sr' | 'tiles_ui' }>; lang: Lang; set: (p: Pending) => void }) {
  const toSr = ex.t === 'tiles_sr';
  const target = toSr ? ex.item.sr : ui(ex.item, lang);
  const bank = useMemo(() => {
    let extra: string[] = toSr ? (ex as any).extra : [];
    if (!toSr) {
      const pool = COURSE.flatMap(u => u.lessons.flatMap(l => l.ex)).filter((e: any) => e.item && e.item.sr !== ex.item.sr && e.item.ru).flatMap((e: any) => tokens(ui(e.item, lang)));
      const have = tokens(target).map(x => x.toLowerCase());
      extra = shuffle([...new Set(pool.filter(w => !have.includes(w.toLowerCase())))]).slice(0, 3);
    }
    return shuffle([...tokens(target), ...extra].map((w, i) => ({ w, i })));
  }, [ex, lang]);
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => { if (!toSr) setTimeout(() => speak(ex.item.sr), 250); }, [ex]);
  useEffect(() => {
    const text = picked.map(i => bank.find(b => b.i === i)!.w).join(' ');
    set(picked.length ? { ok: norm(text) === norm(target), correct: target } : null);
  }, [picked]);
  return (
    <View style={{ gap: 16 }}>
      <Character img={toSr ? IMG.wave : IMG.pricko}>
        {!toSr ? <Press onPress={() => speak(ex.item.sr)} style={st.wordRow}><Image source={ICON.speaker} style={{ width: 26, height: 22 }} contentFit="contain" /><Text style={[st.bubbleT, { flexShrink: 1 }]}>{ex.item.sr}</Text></Press>
          : <Text style={st.bubbleT}>{ui(ex.item, lang)}</Text>}
      </Character>
      <View style={st.answerLine}>
        {picked.map(i => { const b = bank.find(x => x.i === i)!; return (
          <Animated.View key={i} entering={ZoomIn.springify().damping(14)}>
            <Btn3D onPress={() => { sfx('pop'); setPicked(p => p.filter(x => x !== i)); }} border={C.line} shade={C.line} radius={14} depth={3} faceStyle={st.tile}><Text style={st.tileT}>{b.w}</Text></Btn3D>
          </Animated.View>); })}
      </View>
      <View style={st.bank}>
        {bank.map(b => { const used = picked.includes(b.i); return (
          <View key={b.i} style={[st.tileSlot]}>
            {used ? <View style={[st.tile, { opacity: 0, marginBottom: 3 }]}><Text style={st.tileT}>{b.w}</Text></View> :
              <Btn3D onPress={() => { sfx('pop'); if (toSr) speak(b.w); setPicked(p => [...p, b.i]); }} border={C.line} shade={C.line} radius={14} depth={3} faceStyle={st.tile}><Text style={st.tileT}>{b.w}</Text></Btn3D>}
          </View>); })}
      </View>
    </View>
  );
}

function Fill({ ex, lang, set }: { ex: Extract<Ex, { t: 'fill' }>; lang: Lang; set: (p: Pending) => void }) {
  const opts = useMemo(() => shuffle(ex.item.opts), [ex]);
  const [sel, setSel] = useState<string | null>(null);
  const [a, b] = ex.item.sr.split('___');
  const full = a + ex.item.ok + b;
  return (
    <View style={{ gap: 20 }}>
      <Text style={st.sub}>{ui(ex.item, lang)}</Text>
      <View style={st.fillLine}>
        <Text style={st.fillT}>{a}</Text>
        <View style={[st.blank, sel && { borderBottomColor: C.indigo }]}><Text style={[st.fillT, { color: C.indigo }]}>{sel ?? '      '}</Text></View>
        <Text style={st.fillT}>{b}</Text>
      </View>
      <View style={{ gap: 10 }}>
        {opts.map(o => <Option key={o} label={o} sel={sel === o} onPress={() => { sfx('tap'); setSel(o); set({ ok: o === ex.item.ok, correct: full }); }} />)}
      </View>
    </View>
  );
}

function ListenType({ ex, t, set }: { ex: Extract<Ex, { t: 'listen_type' }>; t: (k: any) => string; set: (p: Pending) => void }) {
  const [v, setV] = useState('');
  useEffect(() => { setTimeout(() => speak(ex.item.sr), 250); }, [ex]);
  useEffect(() => {
    if (!v.trim()) { set(null); return; }
    const exact = norm(v) === norm(ex.item.sr), loose = fold(v) === fold(ex.item.sr);
    set({ ok: exact || loose, correct: ex.item.sr, note: !exact && loose ? t('almost') : undefined });
  }, [v]);
  return (
    <View style={{ gap: 18 }}>
      <View style={st.listenRow}><SpeakBtn text={ex.item.sr} size={96} /><SpeakBtn text={ex.item.sr} size={64} slow /></View>
      <TextInput value={v} onChangeText={setV} placeholder={t('typeSr')} placeholderTextColor={C.faint} style={st.area} multiline autoCorrect={false} autoCapitalize="sentences" />
    </View>
  );
}

function Speak({ ex, lang, t, device, set, skip }: { ex: Extract<Ex, { t: 'speak' }>; lang: Lang; t: (k: any) => string; device: string; set: (p: Pending) => void; skip: () => void }) {
  const rec = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<'idle' | 'rec' | 'wait'>('idle');
  const [heard, setHeard] = useState('');
  const pulse = useSharedValue(1);
  const pa = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  useEffect(() => { setTimeout(() => speak(ex.item.sr), 250); return () => { rec.stop().catch(() => {}); }; }, [ex]);
  const toggle = async () => {
    if (state === 'wait') return;
    if (state === 'idle') {
      let p = await AudioModule.getRecordingPermissionsAsync(); if (!p.granted) p = await AudioModule.requestRecordingPermissionsAsync();
      if (!p.granted) { skip(); return; }
      try { voice.pause(); } catch {}
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await rec.prepareToRecordAsync(); rec.record(); setState('rec'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      pulse.value = withSequence(withSpring(1.15), withSpring(1.05));
      return;
    }
    setState('wait'); pulse.value = withSpring(1);
    try {
      await rec.stop(); await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const txt = rec.uri ? await sttCheck(device, rec.uri, ex.item.sr) : '';
      setHeard(txt);
      const sc = similar(txt, ex.item.sr);
      set({ ok: sc >= 0.7, correct: ex.item.sr });
    } catch { set({ ok: false, correct: ex.item.sr }); }
    setState('idle');
  };
  return (
    <View style={{ gap: 18 }}>
      <Character img={IMG.wave}>
        <Press onPress={() => speak(ex.item.sr)} style={st.wordRow}><Image source={ICON.speaker} style={{ width: 26, height: 22 }} contentFit="contain" /><Text style={[st.bubbleT, { flexShrink: 1 }]}>{ex.item.sr}</Text></Press>
        <Text style={st.bubbleSub}>{ui(ex.item, lang)}</Text>
      </Character>
      <Animated.View style={[{ alignSelf: 'stretch' }, pa]}>
        <Btn3D onPress={toggle} face={state === 'rec' ? RED : C.card} border={state === 'rec' ? RED : C.line} shade={state === 'rec' ? RED_D : C.line} radius={16} faceStyle={st.micBig}>
          <Image source={ICON.mic} style={{ width: 30, height: 40 }} contentFit="contain" />
          <Text style={[st.micBigT, state === 'rec' && { color: '#FFFFFF' }]}>{state === 'rec' ? t('tapToSend') : state === 'wait' ? '…' : t('tapSpeak')}</Text>
        </Btn3D>
      </Animated.View>
      {!!heard && <Animated.Text entering={FadeIn} style={st.heard}>{t('heard')}: «{heard}»</Animated.Text>}
      <Press onPress={skip} style={{ alignSelf: 'center', padding: 8 }}><Text style={st.skipT}>{t('cantSpeak')}</Text></Press>
    </View>
  );
}

function Pairs({ ex, lang, done }: { ex: Extract<Ex, { t: 'pairs' }>; lang: Lang; done: () => void }) {
  const left = useMemo(() => shuffle(ex.items), [ex]), right = useMemo(() => shuffle(ex.items), [ex]);
  const [a, setA] = useState<W | null>(null), [b, setB] = useState<W | null>(null);
  const [ok, setOk] = useState<W[]>([]), [bad, setBad] = useState<W[]>([]);
  useEffect(() => {
    if (!a || !b) return;
    if (a === b) { sfx('correct'); setOk(o => { const n = [...o, a]; if (n.length === ex.items.length) setTimeout(done, 450); return n; }); }
    else { sfx('wrong'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); setBad([a, b]); setTimeout(() => setBad([]), 500); }
    setA(null); setB(null);
  }, [a, b]);
  const cell = (w: W, side: 'l' | 'r') => {
    const isOk = ok.includes(w), isSel = side === 'l' ? a === w : b === w, isBad = bad.includes(w) && (side === 'l' ? bad[0] === w : bad[1] === w);
    return (
      <Btn3D key={side + w.sr} disabled={isOk} onPress={() => { sfx('tap'); if (side === 'l') { setA(w); speak(w.sr); } else setB(w); }}
        face={isBad ? RED_BG : isSel ? BLUE_BG : C.card} border={isBad ? RED : isSel ? BLUE_L : C.line} shade={isBad ? RED : isSel ? BLUE_L : C.line} radius={14}
        style={isOk ? { opacity: 0.3 } : undefined} faceStyle={st.pair}>
        <Text style={[st.pairT, isSel && { color: BLUE_D }, isBad && { color: RED_D }]} numberOfLines={2}>{side === 'l' ? w.sr : ui(w, lang)}</Text>
      </Btn3D>
    );
  };
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ flex: 1, gap: 10 }}>{left.map(w => cell(w, 'l'))}</View>
      <View style={{ flex: 1, gap: 10 }}>{right.map(w => cell(w, 'r'))}</View>
    </View>
  );
}

// ---------- урок ----------
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, device, progress, finishLesson, addMistake, clearMistakes } = useStore();
  speakDevice = device;
  const ins = useSafeAreaInsets();
  const practice = id === 'practice';
  const lesson = useMemo(() => {
    if (!practice) return allLessons.find(l => l.id === id) ?? allLessons[0];
    const ex: Ex[] = []; const keys: string[] = [];
    for (const k of shuffle(progress.mistakes || [])) {
      const [lid, i] = k.split('#'); const l = allLessons.find(x => x.id === lid); const e = l?.ex[+i];
      if (e && e.t !== 'pairs' && e.t !== 'speak') { ex.push(e); keys.push(k); } if (ex.length >= 10) break;
    }
    return { id: 'practice', ex: ex.length ? ex : allLessons[0].ex.slice(0, 6), keys, unit: allLessons[0].unit };
  }, []);
  const keyOf = (e: Ex) => practice ? (lesson as any).keys?.[lesson.ex.indexOf(e)] : `${lesson.id}#${lesson.ex.indexOf(e)}`;
  const firstWrong = useRef(new Set<Ex>());
  const newDay = useRef(progress.last !== new Date().toISOString().slice(0, 10));
  const [queue, setQueue] = useState<Ex[]>(lesson.ex);
  const [pos, setPos] = useState(0);
  const [pending, setPending] = useState<Pending>(null);
  const [result, setResult] = useState<Pending>(null);
  const [hearts, setHearts] = useState(5);
  const [combo, setCombo] = useState(0);
  const [stats, setStats] = useState({ right: 0, wrong: 0 });
  const [phase, setPhase] = useState<'play' | 'done' | 'fail'>('play');
  const t0 = useRef(Date.now());
  const total = lesson.ex.length;
  const doneCount = Math.min(total, stats.right);
  const bar = useSharedValue(0);
  useEffect(() => { bar.value = withSpring(doneCount / total, { damping: 16 }); }, [doneCount]);
  const barA = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));
  const heartS = useSharedValue(1);
  const heartA = useAnimatedStyle(() => ({ transform: [{ scale: heartS.value }] }));
  const ex = queue[pos];
  const typeTitle: Record<string, string> = { mc_sr: t('qMcSr'), mc_ui: t('qMcUi'), listen_choose: t('qListen'), listen_type: t('qType'), tiles_sr: t('qTilesSr'), tiles_ui: t('qTilesUi'), pairs: t('qPairs'), fill: t('qFill'), speak: t('qSpeak') };

  const check = () => {
    if (!pending) return;
    setResult(pending);
    if (pending.ok) {
      const c = combo + 1; setCombo(c); sfx(c >= 3 && c % 3 === 0 ? 'combo' : 'correct');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStats(s => ({ ...s, right: s.right + 1 }));
    } else {
      setCombo(0); sfx('wrong'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setStats(s => ({ ...s, wrong: s.wrong + 1 }));
      heartS.value = withSequence(withTiming(1.4, { duration: 120 }), withSpring(1));
      setHearts(h => h - 1);
      setQueue(q => [...q, ex]); firstWrong.current.add(ex); const k = keyOf(ex); if (k && !practice) addMistake(k);
      if (ex.t !== 'mc_ui' && ex.t !== 'tiles_sr') speak(pending.correct);
    }
  };
  const next = () => {
    sfx('tap');
    if (hearts <= 0) { setPhase('fail'); return; }
    setResult(null); setPending(null);
    if (pos + 1 >= queue.length) finish(); else setPos(p => p + 1);
  };
  const autoOk = () => { setStats(s => ({ ...s, right: s.right + 1 })); setCombo(c => c + 1); if (pos + 1 >= queue.length) finish(); else setPos(p => p + 1); };
  const finish = () => {
    sfx('complete'); setPhase('done');
    const acc = Math.round((100 * stats.right) / Math.max(1, stats.right + stats.wrong));
    finishLesson(lesson.id, 10 + (stats.wrong === 0 ? 5 : 0), acc);
    if (practice) clearMistakes(lesson.ex.filter(e => !firstWrong.current.has(e)).map(keyOf).filter(Boolean));
  };

  if (phase !== 'play') {
    const acc = Math.round((100 * stats.right) / Math.max(1, stats.right + stats.wrong));
    const secs = Math.round((Date.now() - t0.current) / 1000);
    const ok = phase === 'done';
    return (
      <View style={[st.endWrap, { paddingTop: ins.top + 30, paddingBottom: ins.bottom + 20 }]}>
        <Animated.View entering={ZoomIn.springify().damping(10)}><Image source={ok ? IMG.happy : IMG.sad} style={{ width: 220, height: 230 }} contentFit="contain" /></Animated.View>
        <Animated.Text entering={FadeInDown.delay(200)} style={[st.endT, !ok && { color: RED }]}>{ok ? t('done') : t('outOfHearts')}</Animated.Text>
        {ok && newDay.current && (
          <Animated.View entering={ZoomIn.delay(500).springify().damping(9)} style={st.streakUp}>
            <Image source={ICON.flame} style={{ width: 30, height: 38 }} contentFit="contain" />
            <Text style={st.streakUpT}>{t('streakUp')} {progress.streak}</Text>
          </Animated.View>
        )}
        {ok && (
          <Animated.View entering={FadeInDown.delay(350)} style={st.cards}>
            <View style={[st.card, { borderColor: '#FFC800', backgroundColor: '#FFC800' }]}><Text style={st.cardH}>{t('xp').toUpperCase()}</Text><View style={st.cardIn}><Image source={ICON.star} style={st.cardIc} contentFit="contain" /><Text style={[st.cardV, { color: '#E5A500' }]}>+{10 + (stats.wrong === 0 ? 5 : 0)}</Text></View></View>
            <View style={[st.card, { borderColor: GREEN, backgroundColor: GREEN }]}><Text style={st.cardH}>{t('accuracy').toUpperCase()}</Text><View style={st.cardIn}><Image source={ICON.check} style={st.cardIc} contentFit="contain" /><Text style={[st.cardV, { color: GREEN_D }]}>{acc}%</Text></View></View>
            <View style={[st.card, { borderColor: '#FF9600', backgroundColor: '#FF9600' }]}><Text style={st.cardH}>{t('streakDays').toUpperCase()}</Text><View style={st.cardIn}><Image source={ICON.flame} style={st.cardIc} contentFit="contain" /><Text style={[st.cardV, { color: '#FF9600' }]}>{progress.streak}</Text></View></View>
          </Animated.View>
        )}
        <View style={{ flex: 1 }} />
        <Btn3D onPress={() => { sfx('tap'); if (ok) router.back(); else { setQueue(lesson.ex); setPos(0); setHearts(5); setStats({ right: 0, wrong: 0 }); setResult(null); setPending(null); setPhase('play'); } }}
          face={ok ? GREEN : BLUE} shade={ok ? GREEN_D : BLUE_D} radius={16} style={{ alignSelf: 'stretch', marginHorizontal: 20 }} faceStyle={st.cta}>
          <Text style={st.ctaT}>{(ok ? t('next') : t('again')).toUpperCase()}</Text>
        </Btn3D>
        <Text style={st.time}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={[st.head, { paddingTop: ins.top + 8 }]}>
        <Press onPress={() => router.back()} style={{ padding: 6 }}><Image source={UIIMG.close} tintColor={C.faint} style={{ width: 22, height: 22 }} /></Press>
        <View style={st.track}><Animated.View style={[st.fill, barA]}><View style={st.shine} /></Animated.View></View>
        <Animated.View style={[st.hearts, heartA]}><Image source={ICON.heart} style={{ width: 28, height: 24 }} contentFit="contain" /><Text style={st.heartsT}>{hearts}</Text></Animated.View>
      </View>
      {combo >= 3 && !result && <Animated.View entering={ZoomIn.springify()} style={st.comboRow}><Image source={ICON.flame} style={{ width: 18, height: 22 }} contentFit="contain" /><Text style={st.combo}>{combo} {t('inRow')}</Text></Animated.View>}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View key={pos} entering={FadeInDown.springify().damping(17)}>
            <Text style={st.q}>{typeTitle[ex.t]}</Text>
            {(ex.t === 'mc_sr' || ex.t === 'mc_ui' || ex.t === 'listen_choose') && <MC ex={ex} lang={lang} set={setPending} />}
            {(ex.t === 'tiles_sr' || ex.t === 'tiles_ui') && <Tiles ex={ex} lang={lang} set={setPending} />}
            {ex.t === 'fill' && <Fill ex={ex} lang={lang} set={setPending} />}
            {ex.t === 'listen_type' && <ListenType ex={ex} t={t} set={setPending} />}
            {ex.t === 'speak' && <Speak ex={ex} lang={lang} t={t} device={device} set={setPending} skip={autoOk} />}
            {ex.t === 'pairs' && <Pairs ex={ex} lang={lang} done={autoOk} />}
          </Animated.View>
        </ScrollView>
        {ex.t !== 'pairs' && !result && (
          <View style={[st.foot, { paddingBottom: ins.bottom + 14 }]}>
            <Btn3D disabled={!pending} onPress={check} face={pending ? GREEN : C.gray} shade={pending ? GREEN_D : C.gray} radius={16} faceStyle={st.cta}><Text style={[st.ctaT, !pending && { color: C.faint }]}>{t('check').toUpperCase()}</Text></Btn3D>
          </View>
        )}
      </KeyboardAvoidingView>
      {result && (
        <Animated.View entering={SlideInDown.springify().damping(18)} style={[st.sheet, { backgroundColor: result.ok ? GREEN_BG : RED_BG, paddingBottom: ins.bottom + 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[st.badge, { backgroundColor: result.ok ? GREEN : RED }]}><Image source={result.ok ? UIIMG.check : UIIMG.close} tintColor="#FFFFFF" style={{ width: 24, height: 24 }} /></View>
            <Text style={[st.sheetT, { color: result.ok ? GREEN_D : RED_D }]}>{result.ok ? t('correct') : t('wrongT')}</Text>
          </View>
          {!!result.note && <Text style={[st.sheetS, { color: GREEN_D }]}>{result.note}: {result.correct}</Text>}
          {!result.ok && <><Text style={[st.sheetL, { color: RED_D }]}>{t('rightAnswer')}:</Text><Text style={[st.sheetS, { color: RED_D }]}>{result.correct}</Text></>}
          <Btn3D onPress={next} face={result.ok ? GREEN : RED} shade={result.ok ? GREEN_D : RED_D} radius={16} style={{ marginTop: 14 }} faceStyle={st.cta}><Text style={st.ctaT}>{t('next').toUpperCase()}</Text></Btn3D>
        </Animated.View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 8 },
  track: { flex: 1, height: 16, borderRadius: 8, backgroundColor: C.gray, overflow: 'hidden' },
  fill: { height: 16, borderRadius: 8, backgroundColor: GREEN, minWidth: 16 },
  shine: { position: 'absolute', left: 8, right: 8, top: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  hearts: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heartsT: { fontFamily: F.bodyHeavy, fontSize: 18, color: RED },
  comboRow: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 5, marginTop: 2 },
  combo: { fontFamily: F.display, fontSize: 15, color: '#FF9600' },
  q: { fontFamily: F.display, fontSize: 25, lineHeight: 30, color: C.ink, marginBottom: 18 },
  sub: { fontFamily: F.bodyHeavy, fontSize: 17, color: C.soft },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listenRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 18, marginVertical: 10 },
  slowT: { position: 'absolute', bottom: 3, right: 6, fontFamily: F.bodyHeavy, fontSize: 11, color: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  opt: { minHeight: 60, paddingHorizontal: 12, paddingVertical: 12 },
  optT: { fontFamily: F.bodyHeavy, fontSize: 18, color: C.ink, textAlign: 'center' },
  optSub: { fontFamily: F.body, fontSize: 13, color: C.soft, marginTop: 2 },
  prompt: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 6 },
  bubble: { flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 2, borderColor: C.line, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 34 },
  bubbleTail: { position: 'absolute', left: -9, bottom: 18, width: 16, height: 16, backgroundColor: C.card, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: C.line, transform: [{ rotate: '45deg' }] },
  bubbleT: { fontFamily: F.bodyHeavy, fontSize: 18, lineHeight: 24, color: C.ink },
  bubbleBig: { fontFamily: F.display, fontSize: 24, color: C.ink, flexShrink: 1 },
  bubbleSub: { fontFamily: F.bodyBold, fontSize: 14.5, color: C.soft, marginTop: 4 },
  answerLine: { minHeight: 122, borderTopWidth: 2, borderBottomWidth: 2, borderColor: C.line, flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12, alignContent: 'flex-start' },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 10 },
  tileSlot: { borderRadius: 14, backgroundColor: C.gray },
  tile: { paddingHorizontal: 14, height: 46 },
  tileT: { fontFamily: F.bodyBold, fontSize: 18, color: C.ink },
  fillLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  fillT: { fontFamily: F.display, fontSize: 26, color: C.ink },
  blank: { borderBottomWidth: 3, borderBottomColor: C.faint, marginHorizontal: 6, minWidth: 70, alignItems: 'center' },
  area: { minHeight: 140, borderRadius: 16, borderWidth: 2, borderColor: C.line, backgroundColor: C.paper2, padding: 14, fontFamily: F.bodyBold, fontSize: 18, color: C.ink, textAlignVertical: 'top' },
  micBig: { height: 72, flexDirection: 'row', gap: 12 },
  micBigT: { fontFamily: F.display, fontSize: 17, color: BLUE },
  heard: { fontFamily: F.bodyBold, fontSize: 15, color: C.soft, textAlign: 'center' },
  skipT: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.faint, letterSpacing: 0.4 },
  pair: { minHeight: 60, padding: 8 },
  pairT: { fontFamily: F.bodyHeavy, fontSize: 17, color: C.ink, textAlign: 'center' },
  foot: { paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 2, borderTopColor: C.line },
  cta: { height: 54 },
  ctaT: { fontFamily: F.display, fontSize: 17, color: '#FFFFFF', letterSpacing: 0.6 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 18 },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sheetT: { fontFamily: F.display, fontSize: 25 },
  sheetL: { fontFamily: F.display, fontSize: 17, marginTop: 10 },
  sheetS: { fontFamily: F.bodyBold, fontSize: 17, marginTop: 2 },
  endWrap: { flex: 1, backgroundColor: C.paper, alignItems: 'center' },
  endT: { fontFamily: F.display, fontSize: 30, color: '#FFC800', textAlign: 'center', marginTop: 6, paddingHorizontal: 20 },
  cards: { flexDirection: 'row', gap: 10, marginTop: 26, paddingHorizontal: 16 },
  card: { flex: 1, borderRadius: 16, borderWidth: 2, overflow: 'hidden' },
  cardH: { textAlign: 'center', color: '#FFFFFF', fontFamily: F.display, fontSize: 11.5, paddingVertical: 5, letterSpacing: 0.4 },
  cardIn: { backgroundColor: '#FFFFFF', borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  cardIc: { width: 22, height: 22 },
  cardV: { fontFamily: F.display, fontSize: 21 },
  time: { fontFamily: F.bodyBold, color: C.faint, marginTop: 10 },
  streakUp: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: '#FFF0D9', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  streakUpT: { fontFamily: F.display, fontSize: 18, color: '#FF9600' },
});
