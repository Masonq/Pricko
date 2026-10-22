import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R } from './theme';

const AP = Animated.createAnimatedComponent(Pressable);
export function Press({ style, children, scale = 0.96, haptic = true, onPress, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; scale?: number; haptic?: boolean; children?: React.ReactNode }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AP {...rest} style={[style, a]}
      onPressIn={e => { s.value = withTiming(scale, { duration: 90 }); rest.onPressIn?.(e); }}
      onPressOut={e => { s.value = withTiming(1, { duration: 140 }); rest.onPressOut?.(e); }}
      onPress={e => { if (haptic) Haptics.selectionAsync().catch(() => {}); onPress?.(e); }}>
      {children}
    </AP>
  );
}

export function Header({ title, right, back = true }: { title?: string; right?: React.ReactNode; back?: boolean }) {
  const ins = useSafeAreaInsets();
  return (
    <View style={[st.header, { paddingTop: ins.top + 6 }]}>
      {back ? (
        <Press accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={st.round}>
          <Image source={require('../assets/ui/back.png')} tintColor={C.faint} style={{ width: 20, height: 20 }} contentFit="contain" />
        </Press>
      ) : <View style={st.roundGhost} />}
      <Text numberOfLines={1} style={st.htitle}>{title ?? ''}</Text>
      <View style={st.roundGhost}>{right}</View>
    </View>
  );
}

export function H1({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) { return <Text style={[st.h1, style]}>{children}</Text>; }
export function H2({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) { return <Text style={[st.h2, style]}>{children}</Text>; }
export function P({ children, style, numberOfLines }: { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) { return <Text numberOfLines={numberOfLines} style={[st.p, style]}>{children}</Text>; }

export function Button({ title, onPress, disabled, kind = 'primary', style }: { title: string; onPress: () => void; disabled?: boolean; kind?: 'primary' | 'ghost'; style?: StyleProp<ViewStyle> }) {
  const g = kind === 'ghost';
  return (
    <Btn3D disabled={disabled} onPress={onPress} style={style} radius={16}
      face={disabled ? C.gray : g ? C.card : C.green} shade={disabled ? C.gray : g ? C.line : C.greenShade} border={g ? C.line : undefined} faceStyle={{ height: 54, paddingHorizontal: 22 }}>
      <Text style={[st.btnText, g && { color: C.blue }, disabled && { color: C.faint }]}>{title.toUpperCase()}</Text>
    </Btn3D>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  return (
    <Btn3D onPress={onPress} radius={14} depth={3} face={on ? C.blueSoft : C.card} border={on ? C.blueLine : C.line} shade={on ? C.blueLine : C.line} faceStyle={{ paddingHorizontal: 14, height: 40 }}>
      <Text style={[st.chipText, on && { color: C.blueShade }]}>{label}</Text>
    </Btn3D>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8, backgroundColor: C.paper, zIndex: 5 },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.line },
  roundGhost: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 32, lineHeight: 34, color: C.faint, marginTop: -3, marginLeft: -2, fontFamily: F.bodyHeavy },
  htitle: { flex: 1, textAlign: 'center', fontFamily: F.display, fontSize: 21, color: C.ink, marginHorizontal: 8 },
  h1: { fontFamily: F.display, fontSize: 38, lineHeight: 42, color: C.ink, letterSpacing: -0.3 },
  h2: { fontFamily: F.display, fontSize: 26, lineHeight: 30, color: C.ink },
  p: { fontFamily: F.body, fontSize: 16, lineHeight: 23, color: C.soft },
  btn: { height: 56, borderRadius: R.pill, backgroundColor: C.indigo, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.line },
  btnText: { fontFamily: F.display, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.6 },
  chip: { paddingHorizontal: 14, height: 38, borderRadius: R.pill, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: C.indigo, borderColor: C.indigo },
  chipText: { fontFamily: F.bodyHeavy, fontSize: 15, color: C.ink },
});

/** Объёмная кнопка: нижняя «тень» и проваливание при нажатии. */
export function Btn3D({ children, onPress, disabled, face = C.card, shade = C.gray, border, depth = 4, radius = 16, style, faceStyle, haptic = true }: {
  children?: React.ReactNode; onPress?: () => void; disabled?: boolean; face?: string; shade?: string; border?: string; depth?: number; radius?: number;
  style?: StyleProp<ViewStyle>; faceStyle?: StyleProp<ViewStyle>; haptic?: boolean }) {
  const y = useSharedValue(0);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Pressable disabled={disabled} onPress={() => { if (haptic) Haptics.selectionAsync().catch(() => {}); onPress?.(); }}
      onPressIn={() => { y.value = withTiming(depth, { duration: 60 }); }} onPressOut={() => { y.value = withTiming(0, { duration: 90 }); }}
      style={[{ paddingBottom: depth }, style]}>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: depth, borderRadius: radius, backgroundColor: shade }} />
      <Animated.View style={[{ backgroundColor: face, borderRadius: radius, borderWidth: border ? 2 : 0, borderColor: border, alignItems: 'center', justifyContent: 'center' }, faceStyle, a]}>{children}</Animated.View>
    </Pressable>
  );
}
