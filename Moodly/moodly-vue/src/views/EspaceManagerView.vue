<script setup>
// Calendrier d'équipe : moral moyen par jour sur les 90 derniers jours (agrégats anonymes).
// Cadenas = moins de 3 réponses ce jour-là. Aujourd'hui = journée en cours (moyenne visible demain).
import { computed, onMounted, ref } from 'vue';
import { ArrowLeft, Lock } from 'lucide-vue-next';
import Mascot from '@/components/Mascot.vue';
import MoodCalendar from '@/components/MoodCalendar.vue';
import PhoneShell from '@/components/PhoneShell.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { api } from '@/lib/api';
import { MOODS, levelOf } from '@/lib/moods';

const stats = ref(null);
const error = ref('');
const sel = ref(null);

async function load() {
  error.value = '';
  try {
    stats.value = await api.teamStats(90);
  } catch (err) {
    error.value = err.message;
  }
}
onMounted(load);

// "AAAA-MM-JJ" → la journée renvoyée par l'API
const byDate = computed(() => Object.fromEntries((stats.value?.daily ?? []).map((d) => [d.date, d])));

function getDay(key) {
  const d = byDate.value[key];
  if (!d || d.open || (d.count === 0 && d.mood === null)) return undefined;
  if (d.masked) return { hidden: true };
  return d.mood !== null ? { mood: levelOf(d.mood) } : undefined;
}

const t = computed(() => (sel.value ? byDate.value[sel.value] : undefined));
const longDate = (k) => new Date(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
</script>

<template>
  <PhoneShell>
    <div class="flex-1 overflow-y-auto pb-8">
      <div class="flex items-center justify-between px-6 pt-6">
        <RouterLink to="/manager" class="rounded-full bg-secondary p-2" aria-label="Retour"><ArrowLeft :size="18" /></RouterLink>
        <ThemeToggle />
      </div>
      <div class="px-6 pt-4">
        <span class="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground">Espace manager</span>
        <h1 class="mt-2 text-3xl font-extrabold">Calendrier d'équipe</h1>
        <p class="text-xs text-muted-foreground">{{ stats ? `${stats.team.name} · moral moyen par jour` : 'Moral moyen par jour' }}</p>
      </div>

      <div v-if="!stats" class="mx-6 mt-10 flex flex-col items-center gap-3 text-center">
        <template v-if="error">
          <Mascot :mood="2" :size="100" />
          <p class="text-sm font-semibold text-destructive" role="alert">{{ error }}</p>
          <button class="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground" @click="load">Réessayer</button>
        </template>
        <template v-else>
          <Mascot :mood="3" :size="100" class="animate-bob" />
          <p class="text-sm font-semibold text-muted-foreground">Chargement…</p>
        </template>
      </div>

      <template v-else>
        <div class="mx-6 mt-5">
          <MoodCalendar :get-day="getDay" :selected="sel" @select="sel = $event" />
        </div>

        <div class="mx-6 mt-4 rounded-[2rem] bg-card p-4 shadow-sm">
          <p v-if="!sel" class="text-center text-sm text-muted-foreground">Touche un jour pour voir le moral de l'équipe.</p>
          <p v-else-if="!t || (t.count === 0 && !t.open)" class="text-center text-sm text-muted-foreground">Pas de données ce jour-là.</p>
          <p v-else-if="t.open" class="text-center text-sm text-muted-foreground">
            Journée en cours : la moyenne sera visible demain ({{ t.count }} réponse{{ t.count > 1 ? 's' : '' }} pour l'instant).
          </p>
          <p v-else-if="t.masked" class="flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
            <Lock :size="13" /> Moins de 3 réponses : masqué pour protéger l'anonymat.
          </p>
          <div v-else class="flex items-center gap-3">
            <div :class="`rounded-full p-1 ${MOODS[levelOf(t.mood)].bgSoft}`"><Mascot :mood="levelOf(t.mood)" :size="52" /></div>
            <div>
              <p class="text-xs capitalize text-muted-foreground">{{ longDate(sel) }}</p>
              <p class="font-display text-xl font-extrabold">{{ t.mood.toFixed(1) }} / 5 · {{ MOODS[levelOf(t.mood)].label }}</p>
              <p class="text-xs text-muted-foreground">{{ t.count }} réponses sur {{ stats.members }}</p>
            </div>
          </div>
        </div>
        <p class="mx-6 mt-3 text-center text-[10px] text-muted-foreground">Les 90 derniers jours · moyenne visible dès 3 réponses</p>
      </template>
    </div>
  </PhoneShell>
</template>
