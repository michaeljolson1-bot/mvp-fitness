import { useColorScheme } from 'react-native';

const light = {
  bg: '#F4F5F7',
  card: '#FFFFFF',
  text: '#111418',
  sub: '#5B6470',
  border: '#E1E4E8',
  accent: '#FF5A1F',
  accentText: '#FFFFFF',
  chip: '#ECEEF1',
  good: '#1F9D55',
  warn: '#C77700',
  danger: '#D93025',
  input: '#F7F8FA',
};

const dark: typeof light = {
  bg: '#0E1013',
  card: '#181B20',
  text: '#F2F4F7',
  sub: '#9AA3AE',
  border: '#2A2F36',
  accent: '#FF6A33',
  accentText: '#FFFFFF',
  chip: '#232830',
  good: '#3DD68C',
  warn: '#F5B041',
  danger: '#FF6B5E',
  input: '#111418',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
