<script setup>
// Paramètres : compte, agence, thème, rappel quotidien, confidentialité, déconnexion.
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Bell, Building2, LogOut, Monitor, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-vue-next';
import PhoneShell from '@/components/PhoneShell.vue';
import { api } from '@/lib/api';
import { clearHistory } from '@/lib/moods';
import { isReminderOn, setReminder } from '@/lib/notifications';
import { getSession, homeFor, logout } from '@/lib/session';
import { useTheme } from '@/lib/theme';

const router = useRouter();
const s = getSession();
const { pref, set } = useTheme();

const THEMES = [
  { id: 'system', label: 'Auto', icon: Monitor },
  { id: 'light', label: 'Clair', icon: Sun },
  { id: 'dark', label: 'Sombre', icon: Moon },
];

const reminder = ref(isReminderOn());
const wiped = ref(false);
const profile = ref(null); // chargé depuis l'API pour afficher l'équipe et le nom de l'agence

onMounted(async () => {
  try {
    profile.value = await api.profile();
  } catch {
    // pas grave : on n'affiche simplement pas la ligne « Équipe »
  }
});

const teamName = () => profile.value?.team?.name ?? profile.value?.managedTeams?.[0]?.name ?? null;

async function onReminder(e) {
  reminder.value = e.target.checked;
  await setReminder(reminder.value);
}

function wipe() {
  clearHistory(s.user.id); // efface le calendrier et les messages gardés sur ce téléphone
  wiped.value = true;
}

function signOut() {
  logout();
  router.replace('/');
}
</script>

<template>
  <PhoneShell>
    <div class="flex-1 overflow-y-auto pb-8">
      <div class="flex items-center gap-3 px-6 pt-6">
        <RouterLink :to="homeFor(s)" class="rounded-full bg-secondary p-2" aria-label="Retour"><ArrowLeft :size="18" /></RouterLink>
        <h1 class="text-2xl font-extrabold">Paramètres</h1>
      </div>

      <!-- Compte -->
      <div class="mx-6 mt-5">
        <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Compte</p>
        <div class="rounded-3xl bg-card px-4 py-2 shadow-sm">
          <div class="flex items-center justify-between border-b py-2.5 text-sm last:border-0">
            <span class="text-muted-foreground">Nom</span>
            <span class="truncate pl-4 font-semibold">{{ s.user.username }}</span>
          </div>
          <div class="flex items-center justify-between border-b py-2.5 text-sm last:border-0">
            <span class="text-muted-foreground">Email</span>
            <span class="truncate pl-4 font-semibold">{{ s.user.email }}</span>
          </div>
          <div class="flex items-center justify-between border-b py-2.5 text-sm last:border-0">
            <span class="text-muted-foreground">Rôle</span>
            <span class="truncate pl-4 font-semibold">{{ s.user.role === 'manager' ? 'Manager' : 'Salarié' }}</span>
          </div>
          <div v-if="teamName()" class="flex items-center justify-between border-b py-2.5 text-sm last:border-0">
            <span class="text-muted-foreground">Équipe</span>
            <span class="truncate pl-4 font-semibold">{{ teamName() }}</span>
          </div>
        </div>
      </div>

      <!-- Agence -->
      <div class="mx-6 mt-5">
        <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Agence</p>
        <div class="rounded-3xl bg-card px-4 py-2 shadow-sm">
          <div class="flex items-center gap-3 py-2">
            <span class="rounded-full bg-accent p-2 text-accent-foreground"><Building2 :size="16" /></span>
            <div>
              <p class="text-xs text-muted-foreground">ID agence (session)</p>
              <p class="font-mono text-sm font-bold">{{ s.agencyId }}</p>
              <p v-if="profile?.agency" class="text-xs text-muted-foreground">{{ profile.agency.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Apparence -->
      <div class="mx-6 mt-5">
        <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Apparence</p>
        <div class="rounded-3xl bg-card px-4 py-2 shadow-sm">
          <div class="grid grid-cols-3 gap-1 rounded-full bg-secondary p-1">
            <button
              v-for="t in THEMES"
              :key="t.id"
              :class="`flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold transition ${pref === t.id ? 'bg-foreground text-background' : ''}`"
              @click="set(t.id)"
            >
              <component :is="t.icon" :size="14" /> {{ t.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="mx-6 mt-5">
        <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Notifications</p>
        <div class="rounded-3xl bg-card px-4 py-2 shadow-sm">
          <label class="flex items-center justify-between py-2">
            <span>
              <span class="flex items-center gap-2 text-sm font-semibold"><Bell :size="16" class="text-muted-foreground" /> Rappel quotidien (10 h)</span>
              <span class="ml-6 block text-[10px] text-muted-foreground">Sur téléphone uniquement</span>
            </span>
            <input type="checkbox" :checked="reminder" class="h-5 w-5 accent-[var(--primary)]" @change="onReminder" />
          </label>
        </div>
      </div>

      <!-- Confidentialité -->
      <div class="mx-6 mt-5">
        <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Confidentialité</p>
        <div class="rounded-3xl bg-card px-4 py-2 shadow-sm">
          <p class="flex gap-2 py-2 text-xs text-muted-foreground">
            <ShieldCheck :size="16" class="shrink-0 text-mood-5" />
            Tes réponses sont anonymes. Ton manager ne voit que des moyennes d'équipe, dès 3 réponses. Ton calendrier et tes messages
            restent sur ce téléphone.
          </p>
          <button
            v-if="s.user.role !== 'manager'"
            class="mt-1 flex items-center gap-2 py-2 text-sm font-semibold text-destructive"
            @click="wipe"
          >
            <Trash2 :size="16" /> {{ wiped ? 'Données effacées' : 'Effacer mes données sur cet appareil' }}
          </button>
        </div>
      </div>

      <div class="mx-6 mt-6">
        <button
          class="flex w-full items-center justify-center gap-2 rounded-full border-2 border-foreground py-3.5 font-bold"
          @click="signOut"
        >
          <LogOut :size="18" /> Se déconnecter
        </button>
        <p class="mt-3 text-center text-[10px] text-muted-foreground">Moodly · MVP Epitech Digital</p>
      </div>
    </div>
  </PhoneShell>
</template>
