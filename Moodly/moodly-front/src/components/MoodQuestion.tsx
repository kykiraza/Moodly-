// Une question avec ses 5 visages cliquables
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Face } from './Face';

type Props = {
  number: number;
  question: string;
  low: string; // texte sous le visage 1
  high: string; // texte sous le visage 5
  value: number | null;
  onChange(score: number): void;
};

export function MoodQuestion({ number, question, low, high, value, onChange }: Props) {
  return (
    <View style={styles.block}>
      <Text style={styles.question}>
        {number}. {question}
      </Text>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((score) => {
          const selected = value === score;
          return (
            <Pressable
              key={score}
              onPress={() => onChange(score)}
              accessibilityRole="button"
              accessibilityLabel={`Note ${score} sur 5`}
              accessibilityState={{ selected }}
              style={[styles.option, selected && styles.selected]}
            >
              <Face score={score} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.scale}>
        <Text style={styles.scaleText}>{low}</Text>
        <Text style={styles.scaleText}>{high}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8, marginTop: 24 },
  question: { fontSize: 16, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  option: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { borderWidth: 2, borderColor: colors.purple, backgroundColor: colors.purpleLight },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleText: { fontSize: 12, color: colors.gray },
});
