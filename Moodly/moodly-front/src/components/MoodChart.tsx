// 📈 Le graphe du manager : moyenne de l'équipe jour par jour pour UNE question
// (celle de l'onglet sélectionné).
// Les jours avec moins de MIN_ANSWERS réponses ne sont PAS affichés (anonymat) :
// la courbe s'interrompt et une bande grise apparaît à la place.

import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { MIN_ANSWERS } from '../config';
import { DailyStat, QuestionKey } from '../services/types';
import { colors } from '../theme';

const HEIGHT = 160;
const PAD = 6;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function MoodChart({ data, question }: { data: DailyStat[]; question: QuestionKey }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const n = data.length;
  const x = (i: number) => PAD + (i * (width - PAD * 2)) / Math.max(n - 1, 1);
  const y = (v: number) => PAD + ((5 - v) / 4) * (HEIGHT - PAD * 2);
  const visible = (d: DailyStat) => d.count >= MIN_ANSWERS;

  // Construction de la courbe, interrompue sur les jours masqués
  let path = '';
  let penDown = false;
  data.forEach((d, i) => {
    if (!visible(d)) {
      penDown = false;
      return;
    }
    path += `${penDown ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d[question]).toFixed(1)} `;
    penDown = true;
  });

  const step = n > 1 ? (width - PAD * 2) / (n - 1) : 0;
  const lastVisible = [...data].map((d, i) => ({ d, i })).reverse().find(({ d }) => visible(d));

  return (
    <View>
      <View style={styles.area}>
        <View style={styles.yAxis}>
          {['5', '4', '3', '2', '1'].map((v) => (
            <Text key={v} style={styles.axisText}>
              {v}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1 }} onLayout={onLayout}>
          {width > 0 && (
            <Svg width={width} height={HEIGHT}>
              {[5, 4, 3, 2, 1].map((v) => (
                <Line key={v} x1={0} x2={width} y1={y(v)} y2={y(v)} stroke="#ECE8F2" strokeWidth={1} />
              ))}
              {data.map((d, i) =>
                visible(d) ? null : (
                  <Rect key={d.date} x={x(i) - step / 2} y={0} width={step} height={HEIGHT} fill={colors.noData} opacity={0.7} />
                )
              )}
              <Path d={path} stroke={colors.purple} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {lastVisible && (
                <Circle cx={x(lastVisible.i)} cy={y(lastVisible.d[question])} r={4.5} fill={colors.purple} stroke={colors.white} strokeWidth={2} />
              )}
            </Svg>
          )}
        </View>
      </View>
      {n > 0 && (
        <View style={styles.xAxis}>
          <Text style={styles.axisText}>{formatDate(data[0].date)}</Text>
          <Text style={styles.axisText}>{formatDate(data[n - 1].date)}</Text>
        </View>
      )}
      <View style={styles.legend}>
        <View style={styles.legendSwatch} />
        <Text style={styles.legendText}>Données insuffisantes (moins de {MIN_ANSWERS} réponses)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { flexDirection: 'row', gap: 8 },
  yAxis: { height: HEIGHT, justifyContent: 'space-between', paddingVertical: PAD - 6 },
  axisText: { fontSize: 11, color: colors.gray },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginLeft: 16 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3, backgroundColor: colors.noData },
  legendText: { fontSize: 12, color: colors.gray },
});
