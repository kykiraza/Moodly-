// Point d'entrée de l'app.
// Affiche le bon écran selon la connexion :
//   pas connecté → Login
//   employé      → Saisie / Merci
//   manager      → Dashboard
// (un employé ne peut donc jamais voir le dashboard)

import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { EmployeeHome } from './src/screens/EmployeeHome';
import { LoginScreen } from './src/screens/LoginScreen';
import { colors } from './src/theme';

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }
  if (!user) return <LoginScreen />;
  if (user.role === 'manager') return <DashboardScreen />;
  return <EmployeeHome />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView style={styles.root}>
          <StatusBar style="dark" />
          <Router />
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center' },
});
