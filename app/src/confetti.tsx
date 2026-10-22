import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
const COLORS = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF', '#FF9600'];
function Piece({ i }: { i: number }) {
  const { width, height } = Dimensions.get('window');
  const cfg = useMemo(() => ({ x: Math.random() * width, drift: (Math.random() - 0.5) * 160, d: 1600 + Math.random() * 1400, delay: Math.random() * 400, r: 360 + Math.random() * 720, w: 7 + Math.random() * 6, c: COLORS[i % COLORS.length] }), []);
  const p = useSharedValue(0);
  useEffect(() => { p.value = withDelay(cfg.delay, withTiming(1, { duration: cfg.d, easing: Easing.out(Easing.quad) })); }, []);
  const a = useAnimatedStyle(() => ({ opacity: 1 - Math.max(0, p.value - 0.8) * 5, transform: [{ translateX: cfg.x + cfg.drift * p.value }, { translateY: -30 + p.value * height * 0.9 }, { rotate: `${cfg.r * p.value}deg` }] }));
  return <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: cfg.w, height: cfg.w * 1.6, borderRadius: 2, backgroundColor: cfg.c }, a]} />;
}
export function Confetti({ n = 60 }: { n?: number }) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{Array.from({ length: n }, (_, i) => <Piece key={i} i={i} />)}</View>;
}
