// Motif géométrique (quarts de cercle colorés) du prototype.
// fade = estompé depuis le coin haut-droit (comme le mask-image radial du prototype).
import { useId } from 'react';
import Svg, { Circle, Defs, G, Mask, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/lib/theme';

const S = 20;

export function Pattern({ cols = 7, rows = 7, fade = false, style }) {
  const { c } = useTheme();
  const FILLS = [c.mood1, c.mood3, c.mood4, c.primary, c.mood2, c.blush];
  const id = 'pat' + useId().replace(/[^a-zA-Z0-9]/g, '');

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const n = (r * 7 + col * 3 + r * col) % 11;
      if (n === 0) continue;
      const fill = FILLS[(r * 5 + col * 2) % FILLS.length];
      const rot = ((r + col * 3) % 4) * 90;
      cells.push(
        <G key={`${r}-${col}`} transform={`translate(${col * S} ${r * S}) rotate(${rot} ${S / 2} ${S / 2})`}>
          {n % 3 === 0 ? (
            <Circle cx={S / 2} cy={S / 2} r={S / 2} fill={fill} />
          ) : (
            <Path d={`M0 0 L${S} 0 A${S} ${S} 0 0 1 0 ${S} Z`} fill={fill} />
          )}
        </G>,
      );
    }
  }

  return (
    <Svg viewBox={`0 0 ${cols * S} ${rows * S}`} preserveAspectRatio="xMidYMid slice" style={style}>
      {fade && (
        <Defs>
          <RadialGradient id={`${id}g`} cx="1" cy="0" r="1.414" fx="1" fy="0" gradientUnits="objectBoundingBox">
            <Stop offset="0.55" stopColor="white" stopOpacity="1" />
            <Stop offset="0.8" stopColor="white" stopOpacity="0" />
          </RadialGradient>
          <Mask id={`${id}m`}>
            <Rect width="100%" height="100%" fill={`url(#${id}g)`} />
          </Mask>
        </Defs>
      )}
      <G mask={fade ? `url(#${id}m)` : undefined}>
        <Rect width="100%" height="100%" fill={c.background} />
        {cells}
      </G>
    </Svg>
  );
}
