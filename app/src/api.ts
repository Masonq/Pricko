import Constants from 'expo-constants';
export const API: string = (Constants.expoConfig?.extra as any)?.api ?? 'http://89.208.113.147:8077';
export class ApiError extends Error { constructor(public code: 'busy' | 'limit' | 'offline' | 'empty', msg: string = code) { super(msg); } }
export const mediaUrl = (u: string | null | undefined) => (u ? (u.startsWith('http') ? u : API + u) : null);

async function req(path: string, init: RequestInit, device: string, timeout = 60000) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(API + path, { ...init, signal: ctl.signal, headers: { ...(init.headers || {}), 'X-Device': device } });
    if (r.status === 429) throw new ApiError('limit');
    if (!r.ok) throw new ApiError('busy', String(r.status));
    return await r.json();
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('offline', String(e));
  } finally { clearTimeout(tm); }
}
export type Scenario = { id: string; title: Record<string, string>; goal: Record<string, string>; open: string };
export type TalkReply = { heard: string; empty?: boolean; reply: string; translation: string; correction: { wrong: string; right: string; why: string } | null; hint: string; done: boolean; audio: string | null };
export const getScenarios = (device: string) => req('/api/scenarios', { method: 'GET' }, device, 15000) as Promise<Scenario[]>;
export function talk(device: string, a: { scenario: string; history: { role: string; text: string }[]; ui: string; audioUri?: string; text?: string }) {
  const fd = new FormData();
  fd.append('scenario', a.scenario); fd.append('history', JSON.stringify(a.history)); fd.append('ui', a.ui);
  if (a.text) fd.append('text', a.text);
  if (a.audioUri) fd.append('audio', { uri: a.audioUri, name: 'rec.m4a', type: 'audio/m4a' } as any);
  return req('/api/talk', { method: 'POST', body: fd }, device) as Promise<TalkReply>;
}
export const say = (device: string, text: string) => req('/api/say', { method: 'POST', body: JSON.stringify({ text }), headers: { 'Content-Type': 'application/json' } }, device, 20000) as Promise<{ audio: string | null }>;
export const makeStory = (device: string, body: object) => req('/api/story', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }, device, 90000);
