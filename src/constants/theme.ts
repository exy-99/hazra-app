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
    primary: '#0D9488',
    onPrimary: '#FFFFFF',
    secondary: '#14B8A6',
    accent: '#EA580C',
    onAccent: '#FFFFFF',
    surface: '#FFFFFF',
    foreground: '#134E4A',
    muted: '#E8F1F4',
    mutedForeground: '#5F7472',
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

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

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
