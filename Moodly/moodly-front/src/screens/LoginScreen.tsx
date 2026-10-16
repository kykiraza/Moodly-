// Écran 1 · Login
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Face } from '../components/Face';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // Pas besoin de naviguer : App.tsx affiche le bon écran selon le rôle
    } catch (e: any) {
      setError(e?.message ?? 'Une erreur est survenue');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Face score={4} size={44} />
        </View>
        <Text style={styles.title}>Moodly</Text>
        <Text style={styles.subtitle}>Le moral de l'équipe, en un clic</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="prenom.nom@entreprise.fr"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onSubmitEditing={onSubmit}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={{ height: 8 }} />
          <Button label="Se connecter" onPress={onSubmit} loading={loading} disabled={!email || !password} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 34, fontWeight: '700', color: colors.purple, marginTop: 8 },
  subtitle: { fontSize: 15, color: colors.gray },
  form: { alignSelf: 'stretch', gap: 16, marginTop: 24 },
  error: { color: colors.red, fontSize: 13, fontWeight: '500' },
});
