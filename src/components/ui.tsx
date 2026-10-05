import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }, style]}>{children}</View>;
}

type BtnProps = {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, kind = 'primary', disabled, small, style }: BtnProps) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.accent : kind === 'danger' ? t.danger : kind === 'secondary' ? t.chip : 'transparent';
  const fg = kind === 'primary' || kind === 'danger' ? t.accentText : kind === 'ghost' ? t.accent : t.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <Text style={[styles.btnText, small && styles.btnTextSmall, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? t.accent : t.chip }]}
      hitSlop={4}
    >
      <Text style={{ color: active ? t.accentText : t.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.sub}
      {...props}
      style={[styles.input, { backgroundColor: t.input, color: t.text, borderColor: t.border }, props.style]}
    />
  );
}

export function H({ children, size = 20 }: { children: ReactNode; size?: number }) {
  const t = useTheme();
  return <Text style={{ color: t.text, fontSize: size, fontWeight: '700' }}>{children}</Text>;
}

export function Sub({ children, style }: { children: ReactNode; style?: StyleProp<any> }) {
  const t = useTheme();
  return <Text style={[{ color: t.sub, fontSize: 14 }, style]}>{children}</Text>;
}

export const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  btn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  btnText: { fontSize: 16, fontWeight: '700' },
  btnTextSmall: { fontSize: 14 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
