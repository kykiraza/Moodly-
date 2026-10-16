// Briques de base : texte (avec les polices du prototype) et bouton qui « s'enfonce » au toucher.
import { Pressable, Text } from 'react-native';
import { FONTS, useTheme } from '@/lib/theme';

/**
 * Texte. font = 'display800' (titres), 'sans700' (gras)… ; size en px.
 * Ex. <T font="display800" size={30}>Paramètres</T>
 */
export function T({ font = 'sans400', size = 14, color, upper, center, style, children, ...props }) {
  const { c } = useTheme();
  return (
    <Text
      style={[
        { fontFamily: FONTS[font], fontSize: size, color: color ?? c.foreground },
        font.startsWith('display') && { letterSpacing: -size * 0.02 }, // comme les titres du prototype
        upper && { textTransform: 'uppercase' },
        center && { textAlign: 'center' },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Bouton qui rétrécit légèrement tant qu'on appuie (équivalent de active:scale-95).
 * `style` s'applique à l'élément cliquable lui-même (flex, width… fonctionnent).
 */
export function Press({ onPress, style, children, disabled, scale = 0.96, ...props }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [style, pressed && { transform: [{ scale }] }, disabled && { opacity: 0.6 }]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
