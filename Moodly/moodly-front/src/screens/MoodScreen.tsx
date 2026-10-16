// Écran 2 · Saisie du mood (employé) — 3 questions
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { MoodQuestion } from '../components/MoodQuestion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { colors } from '../theme';

export function MoodScreen({ onDone }: { onDone(): void }) {
  const { user } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [workload, setWorkload] = useState<number | null>(null);
  const [atmosphere, setAtmosphere] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = mood !== null && workload !== null && atmosphere !== null;

  async function onSubmit() {
    if (!complete) return;
    setLoading(true);
    setError(null);
    try {
      await api.sendMood({ mood, workload, atmosphere });
      onDone();
    } catch {
      setError("L'envoi a échoué, réessaie.");
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.hello}>Bonjour {user?.name}</Text>
        <Text style={styles.title}>Ton point du jour</Text>
        <Text style={styles.subtitle}>3 questions · moins de 10 secondes</Text>

        <MoodQuestion number={1} question="Comment te sens-tu aujourd'hui ?" low="Très mal" high="Très bien" value={mood} onChange={setMood} />
        <MoodQuestion number={2} question="Comment vis-tu ta charge de travail ?" low="Très mal" high="Très bien" value={workload} onChange={setWorkload} />
        <MoodQuestion number={3} question="Comment trouves-tu l'ambiance dans l'équipe ?" low="Très mauvaise" high="Très bonne" value={atmosphere} onChange={setAtmosphere} />
      </ScrollView>

      <View style={styles.footer}>
        {error && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.note}>Tes réponses sont anonymes : ton manager ne voit que la moyenne de l'équipe.</Text>
        <Button label="Valider" onPress={onSubmit} disabled={!complete} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 32, paddingTop: 24 },
  hello: { fontSize: 15, fontWeight: '500', color: colors.gray },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 14, color: colors.gray, marginTop: 4 },
  footer: { paddingHorizontal: 32, paddingBottom: 24, paddingTop: 12, gap: 12 },
  note: { fontSize: 13, color: colors.gray, textAlign: 'center' },
  error: { fontSize: 13, color: colors.red, textAlign: 'center' },
});
