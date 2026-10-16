// Écran 4 · Dashboard (manager) — un seul graphe + chiffres clés
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { MoodChart } from '../components/MoodChart';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { QuestionKey, TeamStats } from '../services/types';
import { colors, radius } from '../theme';

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

// Les 3 onglets = les 3 questions posées aux employés
const TABS: { key: QuestionKey; label: string; question: string }[] = [
  { key: 'mood', label: 'Humeur', question: 'Comment se sent l’équipe ?' },
  { key: 'workload', label: 'Charge', question: 'Comment l’équipe vit sa charge de travail ?' },
  { key: 'atmosphere', label: 'Ambiance', question: 'Comment l’équipe trouve l’ambiance ?' },
];

export function DashboardScreen() {
  const { logout } = useAuth();
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<QuestionKey>('mood');

  const load = useCallback(async () => {
    setError(false);
    try {
      setStats(await api.getTeamStats(30));
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const s = stats?.summary;
  const current = TABS.find((t) => t.key === tab)!;

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.team}>Mon équipe</Text>
          <Text style={styles.title}>Moral de l'équipe</Text>
        </View>
        <Pressable onPress={logout} hitSlop={10}>
          <Text style={styles.logout}>Déconnexion</Text>
        </Pressable>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText}>30 derniers jours</Text>
      </View>

      {error && (
        <View style={styles.card}>
          <Text style={styles.errorText}>Impossible de charger les données.</Text>
          <Button label="Réessayer" variant="secondary" onPress={load} />
        </View>
      )}

      {!stats && !error && <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />}

      {stats && s && (
        <>
          {/* Onglets : un seul graphe, la question affichée change */}
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{current.question}</Text>
            <Text style={styles.cardSubtitle}>Moyenne de l'équipe par jour (sur 5)</Text>
            <MoodChart data={stats.daily} question={tab} />
          </View>

          <View style={styles.kpis}>
            <View style={[styles.card, styles.kpi]}>
              <Text style={styles.kpiValue}>{fmt(s[tab])} / 5</Text>
              <Text style={styles.kpiLabel}>Moyenne du mois</Text>
            </View>
            <View style={[styles.card, styles.kpi]}>
              <Text style={styles.kpiValue}>{Math.round(s.responseRate)} %</Text>
              <Text style={styles.kpiLabel}>Taux de réponse</Text>
            </View>
          </View>

          <View style={styles.anon}>
            <Text style={styles.anonText}>Données anonymisées : aucune réponse individuelle n'est visible.</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 32, paddingTop: 24, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  team: { fontSize: 13, fontWeight: '500', color: colors.gray },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  logout: { fontSize: 14, fontWeight: '600', color: colors.purple },
  pill: { alignSelf: 'flex-start', backgroundColor: colors.purpleLight, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.purple },
  card: { backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  kpis: { flexDirection: 'row', gap: 12 },
  kpi: { flex: 1, gap: 4 },
  kpiValue: { fontSize: 26, fontWeight: '700', color: colors.purple },
  kpiLabel: { fontSize: 13, color: colors.gray },
  cardSubtitle: { fontSize: 12, color: colors.gray, marginTop: -6 },
  tabs: { flexDirection: 'row', backgroundColor: colors.purpleLight, borderRadius: 14, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: colors.purple },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.purple },
  tabTextActive: { color: colors.white },
  anon: { backgroundColor: colors.purpleLight, borderRadius: 14, padding: 14 },
  anonText: { fontSize: 13, fontWeight: '500', color: colors.purple },
  errorText: { fontSize: 14, color: colors.red },
});
