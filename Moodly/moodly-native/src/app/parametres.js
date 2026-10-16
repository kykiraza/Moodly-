// Paramètres : compte, agence, thème, rappel quotidien, confidentialité, déconnexion.
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Building2, LogOut, Monitor, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react-native';
import { api } from '@/lib/api';
import { clearHistory } from '@/lib/moods';
import { isReminderOn, setReminder } from '@/lib/notifications';
import { useAuth } from '@/lib/session';
import { shadowSm, useTheme } from '@/lib/theme';
import { Screen } from '@/components/Screen';
import { IconButton } from '@/components/ThemeToggle';
import { Press, T } from '@/components/ui';
import { RoleGate } from '@/components/RoleGate';

const THEMES = [
  { id: 'system', label: 'Auto', icon: Monitor },
  { id: 'light', label: 'Clair', icon: Sun },
  { id: 'dark', label: 'Sombre', icon: Moon },
];

function Section({ title, children }) {
  const { c } = useTheme();
  return (
    <View style={{ marginHorizontal: 24, marginTop: 20 }}>
      <T font="sans700" size={11} color={c.mutedForeground} upper style={{ marginBottom: 8, letterSpacing: 0.8 }}>
        {title}
      </T>
      <View style={[{ borderRadius: 32, backgroundColor: c.card, paddingHorizontal: 16, paddingVertical: 8 }, shadowSm]}>{children}</View>
    </View>
  );
}

function Row({ label, value, last }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderColor: c.border }}>
      <T size={14} color={c.mutedForeground}>
        {label}
      </T>
      <T font="sans600" size={14} numberOfLines={1} style={{ flexShrink: 1, paddingLeft: 16 }}>
        {value}
      </T>
    </View>
  );
}

function ParametresScreen() {
  const { c, pref, set } = useTheme();
  const { session: s, signOut } = useAuth();
  const [reminder, setReminderState] = useState(true);
  const [reminderMsg, setReminderMsg] = useState('');
  const [wiped, setWiped] = useState(false);
  const [profile, setProfile] = useState(null); // pour afficher l'équipe et le nom de l'agence

  useEffect(() => {
    isReminderOn().then(setReminderState);
    api.profile().then(setProfile).catch(() => {}); // pas grave si ça échoue
  }, []);

  // La session peut disparaître pendant la déconnexion (redirection en cours)
  if (!s) return null;

  const teamName = profile?.team?.name ?? profile?.managedTeams?.[0]?.name ?? null;
  const home = s.user.role === 'manager' ? '/manager' : '/salarie';

  async function toggleReminder(on) {
    setReminderState(on);
    setReminderMsg('');
    const ok = await setReminder(on);
    if (!ok) {
      setReminderState(false);
      setReminderMsg('Notifications refusées : autorise-les dans les réglages du téléphone.');
    }
  }

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 24 }}>
        <IconButton icon={ArrowLeft} label="Retour" onPress={() => (router.canGoBack() ? router.back() : router.replace(home))} />
        <T font="display800" size={24}>
          Paramètres
        </T>
      </View>

      <Section title="Compte">
        <Row label="Nom" value={s.user.username} />
        <Row label="Email" value={s.user.email} />
        <Row label="Rôle" value={s.user.role === 'manager' ? 'Manager' : 'Salarié'} last={!teamName} />
        {teamName && <Row label="Équipe" value={teamName} last />}
      </Section>

      <Section title="Agence">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
          <View style={{ borderRadius: 999, backgroundColor: c.accent, padding: 8 }}>
            <Building2 size={16} color={c.accentForeground} />
          </View>
          <View>
            <T size={12} color={c.mutedForeground}>
              ID agence (session)
            </T>
            <T font="sans700" size={14} style={{ fontVariant: ['tabular-nums'] }}>
              {s.agencyId}
            </T>
            {profile?.agency && (
              <T size={12} color={c.mutedForeground}>
                {profile.agency.name}
              </T>
            )}
          </View>
        </View>
      </Section>

      <Section title="Apparence">
        <View style={{ flexDirection: 'row', gap: 4, borderRadius: 999, backgroundColor: c.secondary, padding: 4, marginVertical: 4 }}>
          {THEMES.map((t) => {
            const Icon = t.icon;
            const on = pref === t.id;
            return (
              <Press key={t.id} onPress={() => set(t.id)} style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 999, paddingVertical: 8, backgroundColor: on ? c.foreground : 'transparent' }}>
                  <Icon size={14} color={on ? c.background : c.foreground} />
                  <T font="sans700" size={12} color={on ? c.background : c.foreground}>
                    {t.label}
                  </T>
                </View>
              </Press>
            );
          })}
        </View>
      </Section>

      <Section title="Notifications">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Bell size={16} color={c.mutedForeground} />
            <T font="sans600" size={14}>
              Rappel quotidien (10 h)
            </T>
          </View>
          <Switch value={reminder} onValueChange={toggleReminder} trackColor={{ true: c.primary }} accessibilityLabel="Rappel quotidien" />
        </View>
        {!!reminderMsg && (
          <T size={11} color={c.destructive} style={{ paddingBottom: 8 }}>
            {reminderMsg}
          </T>
        )}
      </Section>

      <Section title="Confidentialité">
        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 8 }}>
          <ShieldCheck size={16} color={c.mood5} />
          <T size={12} color={c.mutedForeground} style={{ flex: 1 }}>
            {"Tes réponses sont anonymes. Ton manager ne voit que des moyennes d'équipe, dès 3 réponses. Ton calendrier et tes messages restent sur ce téléphone."}
          </T>
        </View>
        {s.user.role !== 'manager' && (
          <Press
            onPress={async () => {
              await clearHistory(s.user.id); // efface le calendrier et les messages de ce téléphone
              setWiped(true);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <Trash2 size={16} color={c.destructive} />
              <T font="sans600" size={14} color={c.destructive}>
                {wiped ? 'Données effacées' : 'Effacer mes données sur cet appareil'}
              </T>
            </View>
          </Press>
        )}
      </Section>

      <View style={{ marginHorizontal: 24, marginTop: 24 }}>
        <Press onPress={signOut}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, borderWidth: 2, borderColor: c.foreground, paddingVertical: 12 }}>
            <LogOut size={18} color={c.foreground} />
            <T font="sans700" size={16}>
              Se déconnecter
            </T>
          </View>
        </Press>
        <T size={10} color={c.mutedForeground} center style={{ marginTop: 12 }}>
          Moodly · MVP Epitech Digital
        </T>
      </View>
    </Screen>
  );
}

// Réservé : tout utilisateur connecté
export default function Parametres() {
  return (
    <RoleGate role="any">
      <ParametresScreen />
    </RoleGate>
  );
}
