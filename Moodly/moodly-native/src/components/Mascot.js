// La mascotte « blob » : couleur et visage selon l'humeur (1 à 5). Même dessin que le prototype.
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { mood as moodInfo } from '@/lib/moods';
import { useTheme } from '@/lib/theme';

const MOUTHS = {
  1: 'M40 78 Q60 64 80 78',
  2: 'M42 74 Q60 70 78 74',
  3: 'M44 72 L76 72',
  4: 'M42 70 Q60 84 78 70',
  5: 'M38 68 Q60 96 82 68 Z',
};

export function Mascot({ mood = 4, size = 160 }) {
  const { c } = useTheme();
  const m = moodInfo(c, mood);
  const sad = mood <= 2;
  return (
    <Svg viewBox="0 0 120 120" width={size} height={size} accessibilityLabel={`Mascotte : ${m.label}`}>
      <Ellipse cx="60" cy="112" rx="34" ry="5" fill={c.ink} opacity={0.12} />
      <Path d="M60 18 C60 10 64 6 70 4" stroke={c.mood5} strokeWidth="4" strokeLinecap="round" fill="none" />
      <Path d="M64 12 C72 6 82 10 82 10 C76 18 66 16 64 12Z" fill={c.mood5} />
      <Path d="M60 18 C36 18 26 44 18 70 C12 92 30 108 60 108 C90 108 108 92 102 70 C94 44 84 18 60 18Z" fill={m.fill} />
      <Path d="M36 44 C40 34 48 28 56 27" stroke="white" strokeOpacity={0.45} strokeWidth="5" strokeLinecap="round" fill="none" />
      <Ellipse cx="32" cy="72" rx="7" ry="4.5" fill={c.blush} opacity={0.7} />
      <Ellipse cx="88" cy="72" rx="7" ry="4.5" fill={c.blush} opacity={0.7} />
      {sad ? (
        <>
          <Path d="M38 56 Q46 52 52 58" stroke={c.ink} strokeWidth="4" strokeLinecap="round" fill="none" />
          <Path d="M68 58 Q74 52 82 56" stroke={c.ink} strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <Ellipse cx="45" cy="56" rx="5" ry={mood === 5 ? 4 : 6} fill={c.ink} />
          <Ellipse cx="75" cy="56" rx="5" ry={mood === 5 ? 4 : 6} fill={c.ink} />
          <Circle cx="47" cy="54" r="1.6" fill="white" />
          <Circle cx="77" cy="54" r="1.6" fill="white" />
        </>
      )}
      <Path
        d={MOUTHS[mood]}
        stroke={c.ink}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={mood === 5 ? c.ink : 'none'}
      />
    </Svg>
  );
}
