// Calendrier mensuel coloré par humeur (perso ou équipe).
// getDay("AAAA-MM-JJ") → { mood?: 1..5, hidden?: true } ou undefined
import { useState } from 'react';
import { View } from 'react-native';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import { LEVELS, mood as moodInfo, ymd } from '@/lib/moods';
import { shadowSm, useTheme } from '@/lib/theme';
import { Press, T } from '@/components/ui';

const WD = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function MoodCalendar({ getDay, selected, onSelect }) {
  const { c } = useTheme();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const today = ymd(new Date());
  const first = (month.getDay() + 6) % 7; // lundi = 0
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const title = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const shift = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  const navBtn = (Icon, label, n) => (
    <Press onPress={() => shift(n)} accessibilityLabel={label}>
      <View style={{ borderRadius: 999, backgroundColor: c.secondary, padding: 8 }}>
        <Icon size={16} color={c.foreground} />
      </View>
    </Press>
  );

  return (
    <View style={[{ borderRadius: 32, backgroundColor: c.card, padding: 16 }, shadowSm]}>
      <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {navBtn(ChevronLeft, 'Mois précédent', -1)}
        <T font="display800" size={18} style={{ textTransform: 'capitalize' }}>
          {title}
        </T>
        {navBtn(ChevronRight, 'Mois suivant', 1)}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
        {WD.map((w, i) => (
          <View key={'wd' + i} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
            <T font="sans700" size={10} color={c.mutedForeground}>
              {w}
            </T>
          </View>
        ))}
        {cells.map((n, i) => {
          if (!n) return <View key={i} style={{ width: `${100 / 7}%` }} />;
          const key = ymd(new Date(month.getFullYear(), month.getMonth(), n));
          const cell = getDay(key);
          const sel = selected === key;
          const isToday = key === today && !sel;
          const info = cell?.mood ? moodInfo(c, cell.mood) : null;
          return (
            <View key={i} style={{ width: `${100 / 7}%`, paddingHorizontal: 3 }}>
              <Press
                onPress={() => onSelect(key)}
                accessibilityLabel={`${n} ${title}${info ? ` : ${info.label}` : ''}`}
                style={{
                  aspectRatio: 1,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: info ? info.fill : c.secondary,
                  // anneau : jour sélectionné (foncé) ou aujourd'hui (bleu)
                  ...(sel || isToday
                    ? { boxShadow: `0px 0px 0px 2px ${c.card}, 0px 0px 0px 4px ${sel ? c.foreground : c.primary}` }
                    : {}),
                }}
              >
                {cell?.hidden ? (
                  <Lock size={11} color={c.mutedForeground} />
                ) : (
                  <T font="sans700" size={12} color={info ? c.ink : c.mutedForeground}>
                    {n}
                  </T>
                )}
              </Press>
            </View>
          );
        })}
      </View>

      <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 12, rowGap: 4 }}>
        {LEVELS.map((l) => (
          <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: c[`mood${l}`] }} />
            <T font="sans600" size={10} color={c.foreground}>
              {moodInfo(c, l).label}
            </T>
          </View>
        ))}
      </View>
    </View>
  );
}
