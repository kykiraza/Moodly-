// Petit logo : la mascotte remplie avec les 5 couleurs d'humeur.
import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '@/lib/theme';

export function MoodMark({ size = 26 }) {
  const { c } = useTheme();
  const id = 'moodlyMark' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg viewBox="0 0 120 120" width={size} height={size}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0%" stopColor={c.mood1} />
          <Stop offset="26%" stopColor={c.mood2} />
          <Stop offset="52%" stopColor={c.mood3} />
          <Stop offset="78%" stopColor={c.mood4} />
          <Stop offset="100%" stopColor={c.mood5} />
        </LinearGradient>
      </Defs>
      <Path d="M60 18 C60 10 64 6 70 4" stroke={c.mood5} strokeWidth="5" strokeLinecap="round" fill="none" />
      <Path d="M64 12 C72 6 82 10 82 10 C76 18 66 16 64 12Z" fill={c.mood5} />
      <Path d="M60 18 C36 18 26 44 18 70 C12 92 30 108 60 108 C90 108 108 92 102 70 C94 44 84 18 60 18Z" fill={`url(#${id})`} />
      <Path d="M36 44 C40 34 48 28 56 27" stroke="white" strokeOpacity={0.5} strokeWidth="5" strokeLinecap="round" fill="none" />
      <Ellipse cx="32" cy="72" rx="7" ry="4.5" fill={c.blush} opacity={0.7} />
      <Ellipse cx="88" cy="72" rx="7" ry="4.5" fill={c.blush} opacity={0.7} />
      <Ellipse cx="45" cy="56" rx="5" ry="6" fill={c.ink} />
      <Ellipse cx="75" cy="56" rx="5" ry="6" fill={c.ink} />
      <Circle cx="47" cy="54" r="1.6" fill="white" />
      <Circle cx="77" cy="54" r="1.6" fill="white" />
      <Path d="M44 72 Q60 85 76 72" stroke={c.ink} strokeWidth="5" strokeLinecap="round" fill="none" />
    </Svg>
  );
}
