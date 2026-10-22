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
import { C, F, IMG, R, shadow } from '../../src/theme';
import { Press } from '../../src/ui';

const UIIMG = { heart: require('../../assets/ui/heart.png'), close: require('../../assets/ui/close.png'), speaker: require('../../assets/ui/speaker.png'), mic: require('../../assets/ui/mic.png') };
const GREEN = '#58A700', GREEN_BG = '#D7FFB8', RED = '#C9372C', RED_BG = '#FFDFE0';
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
    <Press onPress={() => speak(text, slow)} style={[st.spk, { width: size, height: size, borderRadius: size * 0.28 }, slow && { backgroundColor: C.paper2 }]} scale={0.9}>
      <Image source={UIIMG.speaker} tintColor={slow ? C.indigo : '#FFF4E0'} style={{ width: size * 0.5, height: size * 0.5 }} />
      {slow && <Text style={st.slowT}>×½</Text>}
    </Press>
  );
}

// ---------- варианты ответа ----------
function Option({ label, sel, onPress, sub }: { label: string; sel: boolean; onPress: () => void; sub?: string }) {
  return (
    <Press onPress={onPress} scale={0.96} style={[st.opt, sel && st.optSel]}>
      <Text style={[st.optT, sel && { color: C.indigo }]}>{label}</Text>
      {!!sub && <Text style={st.optSub}>{sub}</Text>}
    </Press>
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
      {ex.t === 'mc_sr' && <View style={st.wordRow}><SpeakBtn text={ex.item.sr} size={54} /><Text style={st.big}>{ex.item.sr}</Text></View>}
      {ex.t === 'mc_ui' && <Text style={st.big}>{ui(ex.item, lang)}</Text>}
      {ex.t === 'listen_choose' && <View style={st.listenRow}><SpeakBtn text={ex.item.sr} size={96} /><SpeakBtn text={ex.item.sr} size={64} slow /></View>}
      <View style={st.grid}>
        {opts.map((o, i) => (
          <View key={i} style={{ width: '50%', padding: 5 }}>
            <Option label={showSr ? o.sr : ui(o, lang)} sel={sel === o} onPress={() => { sfx('tap'); setSel(o); if (showSr) speak(o.sr); set({ ok: o === ex.item, correct }); }} />
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
      <View style={st.prompt}>
        <Image source={IMG.pricko} style={{ width: 70, height: 82 }} contentFit="contain" />
        <View style={st.bubble}>
          {!toSr && <Press onPress={() => speak(ex.item.sr)} style={{ marginBottom: 4 }}><Image source={UIIMG.speaker} tintColor={C.indigo} style={{ width: 22, height: 22 }} /></Press>}
          <Text style={st.bubbleT}>{toSr ? ui(ex.item, lang) : ex.item.sr}</Text>
        </View>
      </View>
      <View style={st.answerLine}>
        {picked.map(i => { const b = bank.find(x => x.i === i)!; return (
          <Animated.View key={i} entering={ZoomIn.springify().damping(14)}>
            <Press onPress={() => { sfx('pop'); setPicked(p => p.filter(x => x !== i)); }} style={st.tile} scale={0.92}><Text style={st.tileT}>{b.w}</Text></Press>
          </Animated.View>); })}
      </View>
      <View style={st.bank}>
        {bank.map(b => { const used = picked.includes(b.i); return (
          <View key={b.i} style={[st.tileSlot]}>
            {used ? <View style={[st.tile, { opacity: 0 }]}><Text style={st.tileT}>{b.w}</Text></View> :
              <Press onPress={() => { sfx('pop'); if (toSr) speak(b.w); setPicked(p => [...p, b.i]); }} style={st.tile} scale={0.92}><Text style={st.tileT}>{b.w}</Text></Press>}
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
      <View style={st.prompt}>
        <Image source={IMG.pricko} style={{ width: 70, height: 82 }} contentFit="contain" />
        <View style={st.bubble}>
          <Press onPress={() => speak(ex.item.sr)} style={{ marginBottom: 4 }}><Image source={UIIMG.speaker} tintColor={C.indigo} style={{ width: 22, height: 22 }} /></Press>
          <Text style={st.bubbleT}>{ex.item.sr}</Text>
          <Text style={st.bubbleSub}>{ui(ex.item, lang)}</Text>
        </View>
      </View>
      <Animated.View style={[{ alignSelf: 'stretch' }, pa]}>
        <Press onPress={toggle} style={[st.micBig, state === 'rec' && { backgroundColor: RED, borderColor: '#9E2A21' }]} scale={0.97}>
          <Image source={UIIMG.mic} tintColor="#FFF4E0" style={{ width: 30, height: 30 }} />
          <Text style={st.micBigT}>{state === 'rec' ? t('tapToSend') : state === 'wait' ? '…' : t('tapSpeak')}</Text>
        </Press>
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
      <Press key={side + w.sr} disabled={isOk} onPress={() => { sfx('tap'); if (side === 'l') { setA(w); speak(w.sr); } else setB(w); }} scale={0.95}
        style={[st.pair, isSel && st.optSel, isOk && { opacity: 0.35 }, isBad && { borderColor: RED, backgroundColor: RED_BG }]}>
        <Text style={[st.pairT, isSel && { color: C.indigo }]} numberOfLines={2}>{side === 'l' ? w.sr : ui(w, lang)}</Text>
      </Press>
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
  const { t, lang, device, progress, finishLesson } = useStore();
  speakDevice = device;
  const ins = useSafeAreaInsets();
  const lesson = allLessons.find(l => l.id === id) ?? allLessons[0];
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
      setQueue(q => [...q, ex]);
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
  };

  if (phase !== 'play') {
    const acc = Math.round((100 * stats.right) / Math.max(1, stats.right + stats.wrong));
    const secs = Math.round((Date.now() - t0.current) / 1000);
    const ok = phase === 'done';
    return (
      <View style={[st.endWrap, { paddingTop: ins.top + 30, paddingBottom: ins.bottom + 20 }]}>
        <Animated.View entering={ZoomIn.springify().damping(10)}><Image source={IMG.pricko} style={{ width: 190, height: 220 }} contentFit="contain" /></Animated.View>
        <Animated.Text entering={FadeInDown.delay(200)} style={[st.endT, !ok && { color: RED }]}>{ok ? t('done') : t('outOfHearts')}</Animated.Text>
        {ok && (
          <Animated.View entering={FadeInDown.delay(350)} style={st.cards}>
            <View style={[st.card, { borderColor: C.ochre }]}><Text style={[st.cardH, { backgroundColor: C.ochre }]}>{t('xp')}</Text><Text style={[st.cardV, { color: C.ochre }]}>+{10 + (stats.wrong === 0 ? 5 : 0)}</Text></View>
            <View style={[st.card, { borderColor: GREEN }]}><Text style={[st.cardH, { backgroundColor: GREEN }]}>{t('accuracy')}</Text><Text style={[st.cardV, { color: GREEN }]}>{acc}%</Text></View>
            <View style={[st.card, { borderColor: '#E8762C' }]}><Text style={[st.cardH, { backgroundColor: '#E8762C' }]}>{t('streakDays')}</Text><Text style={[st.cardV, { color: '#E8762C' }]}>{progress.streak}</Text></View>
          </Animated.View>
        )}
        <View style={{ flex: 1 }} />
        <Press onPress={() => { sfx('tap'); if (ok) router.back(); else { setQueue(lesson.ex); setPos(0); setHearts(5); setStats({ right: 0, wrong: 0 }); setResult(null); setPending(null); setPhase('play'); } }}
          style={[st.cta, { backgroundColor: ok ? GREEN : C.indigo, alignSelf: 'stretch', marginHorizontal: 20 }]}>
          <Text style={st.ctaT}>{ok ? t('next') : t('again')}</Text>
        </Press>
        <Text style={st.time}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={[st.head, { paddingTop: ins.top + 8 }]}>
        <Press onPress={() => router.back()} style={{ padding: 6 }}><Image source={UIIMG.close} tintColor={C.faint} style={{ width: 24, height: 24 }} /></Press>
        <View style={st.track}><Animated.View style={[st.fill, barA]}><View style={st.shine} /></Animated.View></View>
        <Animated.View style={[st.hearts, heartA]}><Image source={UIIMG.heart} tintColor={RED} style={{ width: 24, height: 24 }} /><Text style={st.heartsT}>{hearts}</Text></Animated.View>
      </View>
      {combo >= 3 && !result && <Animated.Text entering={FadeIn} style={st.combo}>{combo} ✦</Animated.Text>}
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
            <Press disabled={!pending} onPress={check} style={[st.cta, !pending && st.ctaOff]}><Text style={[st.ctaT, !pending && { color: C.faint }]}>{t('check')}</Text></Press>
          </View>
        )}
      </KeyboardAvoidingView>
      {result && (
        <Animated.View entering={SlideInDown.springify().damping(18)} style={[st.sheet, { backgroundColor: result.ok ? GREEN_BG : RED_BG, paddingBottom: ins.bottom + 14 }]}>
          <Text style={[st.sheetT, { color: result.ok ? GREEN : RED }]}>{result.ok ? t('correct') : t('wrongT')}</Text>
          {!!result.note && <Text style={[st.sheetS, { color: GREEN }]}>{result.note}: {result.correct}</Text>}
          {!result.ok && <Text style={[st.sheetS, { color: RED }]}>{t('rightAnswer')}: {result.correct}</Text>}
          <Press onPress={next} style={[st.cta, { backgroundColor: result.ok ? GREEN : RED, marginTop: 12 }]}><Text style={st.ctaT}>{t('next')}</Text></Press>
        </Animated.View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 8 },
  track: { flex: 1, height: 16, borderRadius: 8, backgroundColor: '#E8DCC8', overflow: 'hidden' },
  fill: { height: 16, borderRadius: 8, backgroundColor: GREEN, minWidth: 16 },
  shine: { position: 'absolute', left: 8, right: 8, top: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  hearts: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heartsT: { fontFamily: F.bodyHeavy, fontSize: 17, color: RED },
  combo: { alignSelf: 'center', fontFamily: F.bodyHeavy, fontSize: 14, color: '#E8762C' },
  q: { fontFamily: F.display, fontSize: 26, color: C.ink, marginBottom: 18 },
  big: { fontFamily: F.display, fontSize: 32, color: C.ink, flexShrink: 1 },
  sub: { fontFamily: F.bodyBold, fontSize: 16, color: C.soft },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  listenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginVertical: 6 },
  spk: { backgroundColor: C.indigo, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: '#1F2A58' },
  slowT: { position: 'absolute', bottom: 4, right: 6, fontFamily: F.bodyHeavy, fontSize: 11, color: C.indigo },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  opt: { minHeight: 64, borderRadius: R.m, borderWidth: 2, borderColor: C.line, borderBottomWidth: 4, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  optSel: { borderColor: C.indigo, backgroundColor: C.indigoSoft },
  optT: { fontFamily: F.bodyHeavy, fontSize: 17, color: C.ink, textAlign: 'center' },
  optSub: { fontFamily: F.body, fontSize: 13, color: C.soft, marginTop: 2 },
  prompt: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { flex: 1, backgroundColor: C.card, borderRadius: 18, borderWidth: 2, borderColor: C.line, padding: 14, marginBottom: 10 },
  bubbleT: { fontFamily: F.bodyHeavy, fontSize: 18, color: C.ink },
  bubbleSub: { fontFamily: F.body, fontSize: 14, color: C.soft, marginTop: 2 },
  answerLine: { minHeight: 112, borderTopWidth: 2, borderBottomWidth: 2, borderColor: C.line, flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 10, alignContent: 'flex-start' },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 6 },
  tileSlot: { borderRadius: 14, backgroundColor: '#E8DCC8' },
  tile: { paddingHorizontal: 14, height: 46, borderRadius: 14, backgroundColor: C.card, borderWidth: 2, borderColor: C.line, borderBottomWidth: 4, justifyContent: 'center' },
  tileT: { fontFamily: F.bodyBold, fontSize: 17, color: C.ink },
  fillLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  fillT: { fontFamily: F.display, fontSize: 26, color: C.ink },
  blank: { borderBottomWidth: 3, borderBottomColor: C.faint, marginHorizontal: 6, minWidth: 70, alignItems: 'center' },
  area: { minHeight: 130, borderRadius: R.m, borderWidth: 2, borderColor: C.line, backgroundColor: C.card, padding: 14, fontFamily: F.bodyBold, fontSize: 18, color: C.ink, textAlignVertical: 'top' },
  micBig: { height: 70, borderRadius: R.m, backgroundColor: C.indigo, borderBottomWidth: 5, borderBottomColor: '#1F2A58', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  micBigT: { fontFamily: F.bodyHeavy, fontSize: 17, color: '#FFF4E0' },
  heard: { fontFamily: F.bodyBold, fontSize: 15, color: C.soft, textAlign: 'center' },
  skipT: { fontFamily: F.bodyHeavy, fontSize: 14, color: C.faint },
  pair: { minHeight: 58, borderRadius: R.m, borderWidth: 2, borderBottomWidth: 4, borderColor: C.line, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', padding: 8 },
  pairT: { fontFamily: F.bodyHeavy, fontSize: 16, color: C.ink, textAlign: 'center' },
  foot: { paddingHorizontal: 18, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  cta: { height: 56, borderRadius: R.m, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.18)' },
  ctaOff: { backgroundColor: '#E8DCC8', borderBottomColor: '#D8CAB2' },
  ctaT: { fontFamily: F.bodyHeavy, fontSize: 17, color: '#FFFFFF', letterSpacing: 0.3 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 18 },
  sheetT: { fontFamily: F.display, fontSize: 26 },
  sheetS: { fontFamily: F.bodyBold, fontSize: 16, marginTop: 4 },
  endWrap: { flex: 1, backgroundColor: C.paper, alignItems: 'center' },
  endT: { fontFamily: F.display, fontSize: 32, color: C.ink, textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
  cards: { flexDirection: 'row', gap: 10, marginTop: 24, paddingHorizontal: 16 },
  card: { flex: 1, borderRadius: R.m, borderWidth: 2, overflow: 'hidden', backgroundColor: C.card, alignItems: 'center' },
  cardH: { alignSelf: 'stretch', textAlign: 'center', color: '#FFF', fontFamily: F.bodyHeavy, fontSize: 12, paddingVertical: 5 },
  cardV: { fontFamily: F.display, fontSize: 26, paddingVertical: 10 },
  time: { fontFamily: F.bodyBold, color: C.faint, marginTop: 10 },
});
