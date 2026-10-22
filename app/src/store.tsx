import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLang, Key, Lang, t as tr } from './i18n';

export type Story = { id: string; title: string; paragraphs: string[]; words: { sr: string; tr: string }[]; audio: string | null; name: string; world: string; created: number };
export type Progress = { done: Record<string, number>; xp: number; streak: number; last: string };
type State = { progress: Progress; finishLesson: (id: string, xp: number, acc: number) => void; ready: boolean; lang: Lang; setLang: (l: Lang) => void; showTr: boolean; setShowTr: (v: boolean) => void;
  device: string; stories: Story[]; addStory: (s: Story) => void; removeStory: (id: string) => void; t: (k: Key) => string };
const Ctx = createContext<State | null>(null);
const rid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lang, setLangS] = useState<Lang>(defaultLang());
  const [showTr, setShowTrS] = useState(true);
  const [device, setDevice] = useState('anon');
  const [stories, setStories] = useState<Story[]>([]);
  const [progress, setProgress] = useState<Progress>({ done: {}, xp: 0, streak: 0, last: '' });
  useEffect(() => { (async () => {
    try {
      const [l, s, d, st, pr] = await Promise.all(['lang', 'showTr', 'device', 'stories', 'progress'].map(k => AsyncStorage.getItem('pricko.' + k)));
      if (pr) setProgress(p => ({ ...p, ...JSON.parse(pr) }));
      if (l === 'sr' || l === 'ru' || l === 'en') setLangS(l);
      if (s !== null) setShowTrS(s === '1');
      if (d) setDevice(d); else { const n = rid(); setDevice(n); AsyncStorage.setItem('pricko.device', n); }
      if (st) setStories(JSON.parse(st));
    } catch {}
    setReady(true);
  })(); }, []);
  const setLang = useCallback((l: Lang) => { setLangS(l); AsyncStorage.setItem('pricko.lang', l); }, []);
  const setShowTr = useCallback((v: boolean) => { setShowTrS(v); AsyncStorage.setItem('pricko.showTr', v ? '1' : '0'); }, []);
  const save = (list: Story[]) => { AsyncStorage.setItem('pricko.stories', JSON.stringify(list.slice(0, 60))); return list; };
  const addStory = useCallback((s: Story) => setStories(p => save([s, ...p.filter(x => x.id !== s.id)])), []);
  const removeStory = useCallback((id: string) => setStories(p => save(p.filter(x => x.id !== id))), []);
  const finishLesson = useCallback((id: string, xp: number, acc: number) => setProgress(p => {
    const today = new Date().toISOString().slice(0, 10);
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const streak = p.last === today ? p.streak : p.last === y ? p.streak + 1 : 1;
    const n = { done: { ...p.done, [id]: Math.max(p.done[id] ?? 0, acc) }, xp: p.xp + xp, streak, last: today };
    AsyncStorage.setItem('pricko.progress', JSON.stringify(n)); return n;
  }), []);
  const value = useMemo(() => ({ progress, finishLesson, ready, lang, setLang, showTr, setShowTr, device, stories, addStory, removeStory, t: (k: Key) => tr(lang, k) }),
    [progress, finishLesson, ready, lang, showTr, device, stories, setLang, setShowTr, addStory, removeStory]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStore() { const v = useContext(Ctx); if (!v) throw new Error('store'); return v; }
