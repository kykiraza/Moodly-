// Visage dessiné en SVG, de 1 (très mal) à 5 (très bien) — identique à la maquette
import Svg, { Circle, Path } from 'react-native-svg';

const MOUTHS: Record<number, string> = {
  1: 'M11 26 Q18 18 25 26',
  2: 'M12 25 Q18 21.5 24 25',
  3: 'M12 23.5 L24 23.5',
  4: 'M12 21 Q18 27 24 21',
  5: 'M10.5 20 Q18 31 25.5 20 Z',
};

export function Face({ score, size = 34 }: { score: number; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Circle cx={18} cy={18} r={17} fill="#FFD45C" />
      <Circle cx={12.5} cy={14} r={2.2} fill="#5A3A00" />
      <Circle cx={23.5} cy={14} r={2.2} fill="#5A3A00" />
      <Path
        d={MOUTHS[score]}
        stroke="#5A3A00"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={score === 5 ? '#5A3A00' : 'none'}
      />
    </Svg>
  );
}
