import raw from './course.json';
import { Lang } from './i18n';
export type W = { sr: string; ru: string; en: string; img?: string };
export type Fill = { sr: string; opts: string[]; ok: string; ru: string; en: string };
export type Ex =
  | { t: 'mc_sr' | 'mc_ui' | 'listen_choose' | 'img'; item: W; wrong: W[] }
  | { t: 'pairs'; items: W[] }
  | { t: 'tiles_sr'; item: W; extra: string[] }
  | { t: 'tiles_ui'; item: W }
  | { t: 'fill'; item: Fill }
  | { t: 'listen_type'; item: W }
  | { t: 'speak'; item: W };
export type Lesson = { id: string; ex: Ex[] };
export type Unit = { id: string; title: W; color: string; lessons: Lesson[] };
export const COURSE = raw as unknown as Unit[];
export const ui = (w: { ru: string; en: string }, lang: Lang) => (lang === 'en' ? w.en : w.ru);
export const allLessons = COURSE.flatMap(u => u.lessons.map(l => ({ ...l, unit: u })));
export const norm = (s: string) => s.toLowerCase().replace(/[.,!?¿¡;:"“”„'’()—-]/g, ' ').replace(/\s+/g, ' ').trim();
export const fold = (s: string) => norm(s).replace(/č|ć/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'dj').replace(/ё/g, 'е');
export const tokens = (s: string) => s.split(/\s+/).map(w => w.replace(/[.,!?]/g, '')).filter(Boolean);
export function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
export function similar(a: string, b: string) {
  const x = fold(a), y = fold(b); if (!x || !y) return 0;
  const d: number[][] = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
  return 1 - d[x.length][y.length] / Math.max(x.length, y.length);
}
