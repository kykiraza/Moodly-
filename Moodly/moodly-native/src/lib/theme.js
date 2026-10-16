// 🎨 Le design du prototype en React Native : couleurs (converties depuis oklch), polices, tailles.
// Thème Auto / Clair / Sombre, préférence gardée sur le téléphone (« moodly-theme »).
import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOODS_LIGHT = {
  mood1: '#f0503d', mood2: '#f68c36', mood3: '#f3c443', mood4: '#a2d94a', mood5: '#3fac4a',
  mood1Soft: '#ffdcd4', mood2Soft: '#ffe4ca', mood3Soft: '#feeec1', mood4Soft: '#e1f8c6', mood5Soft: '#d3f7d3',
};

export const LIGHT = {
  background: '#fbf6ec', foreground: '#221811', ink: '#1d140d', card: '#fffdf9',
  primary: '#1d8ef5', primaryForeground: '#fcfcfc', secondary: '#f1eadc', muted: '#f1ebde',
  mutedForeground: '#72665e', accent: '#c8e8ff', accentForeground: '#003880', destructive: '#e62c2c',
  border: '#e4ddcf', blush: '#f58a8b', white: '#ffffff',
  ...MOODS_LIGHT,
};

export const DARK = {
  ...LIGHT,
  background: '#130e0a', foreground: '#f5f1ea', card: '#221b16', secondary: '#2c2520', muted: '#2c2520',
  mutedForeground: '#ada397', accent: '#0e345a', accentForeground: '#b2dcff', border: '#39312b',
  mood1Soft: '#51231d', mood2Soft: '#522e0b', mood3Soft: '#4b3b05', mood4Soft: '#2e420d', mood5Soft: '#1b3f1d',
};

// Polices du prototype : Bricolage Grotesque (titres) et DM Sans (texte)
export const FONTS = {
  display600: 'BricolageGrotesque_600SemiBold',
  display700: 'BricolageGrotesque_700Bold',
  display800: 'BricolageGrotesque_800ExtraBold',
  sans400: 'DMSans_400Regular',
  sans500: 'DMSans_500Medium',
  sans600: 'DMSans_600SemiBold',
  sans700: 'DMSans_700Bold',
};

// Rayons d'arrondi (radius = 1.25rem = 20 px dans le prototype)
export const RADIUS = { lg: 20, xl: 24, '2xl': 28, '3xl': 32, card: 32, full: 999 };

/** Couleur + transparence : alpha('#1d140d', 0.7) */
export function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Ombres (équivalents de shadow-sm et shadow-pop du prototype)
export const shadowSm = { boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)' };
export const shadowPop = { boxShadow: `0px 4px 0px ${alpha('#1d140d', 0.9)}` };

const KEY = 'moodly-theme';
const ThemeContext = createContext(null);

/** Fournit le thème à toute l'app. pref = 'system' | 'light' | 'dark' */
export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [pref, setPref] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((p) => p && setPref(p))
      .catch(() => {});
  }, []);

  const value = useMemo(() => {
    const dark = pref === 'dark' || (pref === 'system' && system === 'dark');
    return {
      pref,
      dark,
      c: dark ? DARK : LIGHT, // les couleurs à utiliser partout : const { c } = useTheme()
      set: (p) => {
        setPref(p);
        AsyncStorage.setItem(KEY, p).catch(() => {});
      },
    };
  }, [pref, system]);

  return createElement(ThemeContext.Provider, { value }, children);
}

export const useTheme = () => useContext(ThemeContext);
