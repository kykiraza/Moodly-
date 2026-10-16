// Écran 3 · Merci (employé)
// alreadyAnswered = true quand l'employé rouvre l'app après avoir déjà répondu aujourd'hui
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Face } from '../components/Face';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export function ThanksScreen({ alreadyAnswered }: { alreadyAnswered: boolean }) {
  const { logout } = useAuth();
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Face score={4} size={72} />
        </View>
        <Text style={styles.title}>{alreadyAnswered ? 'À demain !' : 'Merci !'}</Text>
        {!alreadyAnswered && <Text style={styles.subtitle}>Ta réponse a été enregistrée.</Text>}
        <View style={styles.info}>
          <Text style={styles.infoBold}>Tu as déjà répondu aujourd'hui</Text>
          <Text style={styles.infoText}>Reviens demain pour ta prochaine saisie</Text>
        </View>
      </View>
      <Button label="Se déconnecter" variant="secondary" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  icon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, color: colors.gray },
  info: {
    alignSelf: 'stretch',
    backgroundColor: colors.purpleLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  infoBold: { fontSize: 14, fontWeight: '600', color: colors.purple },
  infoText: { fontSize: 14, color: colors.purple },
});
