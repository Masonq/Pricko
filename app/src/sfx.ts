import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
const SRC = {
  correct: require('../assets/sfx/correct.wav'), combo: require('../assets/sfx/combo.wav'), wrong: require('../assets/sfx/wrong.wav'),
  complete: require('../assets/sfx/complete.wav'), tap: require('../assets/sfx/tap.wav'), pop: require('../assets/sfx/pop.wav'),
};
export type Sfx = keyof typeof SRC;
const players: Partial<Record<Sfx, ReturnType<typeof createAudioPlayer>>> = {};
export function sfx(name: Sfx) {
  try {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    let p = players[name];
    if (!p) { p = createAudioPlayer(SRC[name]); p.volume = name === 'tap' || name === 'pop' ? 0.5 : 0.8; players[name] = p; }
    p.seekTo(0); p.play();
  } catch {}
}
export function preloadSfx() { (Object.keys(SRC) as Sfx[]).forEach(n => { if (!players[n]) try { const p = createAudioPlayer(SRC[n]); players[n] = p; } catch {} }); }
