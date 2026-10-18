/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#134E4A',
    background: '#F0FDFA',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    primary: '#0B7A6F',
    onPrimary: '#FFFFFF',
    secondary: '#14B8A6',
    accent: '#C24100',
    onAccent: '#FFFFFF',
    surface: '#FFFFFF',
    foreground: '#134E4A',
    muted: '#E8F1F4',
    mutedForeground: '#556968',
    border: '#CCE9E3',
    ring: '#0D9488',
    destructive: '#DC2626',
    onDestructive: '#FFFFFF',
  },
  dark: {
    text: '#E6FFFA',
    background: '#0B1F1D',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#2DD4BF',
    onPrimary: '#042F2E',
    secondary: '#14B8A6',
    accent: '#FB923C',
    onAccent: '#431407',
    surface: '#123330',
    foreground: '#E6FFFA',
    muted: '#1B4A46',
    mutedForeground: '#9DC4BF',
    border: '#205550',
    ring: '#2DD4BF',
    destructive: '#F87171',
    onDestructive: '#450A0A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Type = {
  display: { fontFamily: Fonts.bold, fontSize: 48, lineHeight: 52, fontWeight: '700' },
  h1: { fontFamily: Fonts.bold, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  h2: { fontFamily: Fonts.semibold, fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 18, fontWeight: '500' },
} as const;

export const Radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
