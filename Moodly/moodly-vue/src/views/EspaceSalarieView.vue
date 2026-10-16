<script setup>
// Mon espace : calendrier d'humeurs personnel.
// Les données viennent UNIQUEMENT du téléphone (journal local) : le serveur ne sait pas qui a répondu quoi.
import { computed, ref } from 'vue';
import { ArrowLeft, Lock } from 'lucide-vue-next';
import Mascot from '@/components/Mascot.vue';
import MoodCalendar from '@/components/MoodCalendar.vue';
import PhoneShell from '@/components/PhoneShell.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { LEVELS, MOODS, factorById, getHistory } from '@/lib/moods';
import { getSession } from '@/lib/session';

const session = getSession();
const hist = ref(getHistory(session.user.id));
const sel = ref(null);

// Les saisies des 30 derniers jours
const last30 = computed(() => {
  const lim = new Date();
  lim.setDate(lim.getDate() - 30);
  return Object.entries(hist.value)
    .filter(([k]) => new Date(k) >= lim)
    .map(([, v]) => v);
});

const avg = computed(() =>
  last30.value.length ? last30.value.reduce((s, e) => s + e.mood, 0) / last30.value.length : 0,
);

// L'humeur la plus fréquente sur 30 jours
const frequent = computed(() => {
  if (!last30.value.length) return '–';
  const counts = LEVELS.map((l) => last30.value.filter((e) => e.mood === l).length);
  return MOODS[counts.indexOf(Math.max(...counts)) + 1].label;
});

const entry = computed(() => (sel.value ? hist.value[sel.value] : undefined));
const getDay = (k) => (hist.value[k] ? { mood: hist.value[k].mood } : undefined);
const longDate = (k) => new Date(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
</script>

<template>
  <PhoneShell>
    <div class="flex-1 overflow-y-auto pb-8">
      <div class="flex items-center justify-between px-6 pt-6">
        <RouterLink to="/salarie" class="rounded-full bg-secondary p-2" aria-label="Retour"><ArrowLeft :size="18" /></RouterLink>
        <ThemeToggle />
      </div>
      <div class="px-6 pt-4">
        <span class="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground">Mon espace</span>
        <h1 class="mt-2 text-3xl font-extrabold">Mon calendrier d'humeurs</h1>
        <p class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Lock :size="11" /> Visible par toi seul·e</p>
        <p class="mt-0.5 text-[11px] text-muted-foreground">Stocké uniquement sur ce téléphone</p>
      </div>

      <div class="mx-6 mt-5 grid grid-cols-3 gap-2">
        <div class="rounded-2xl bg-card p-3 text-center shadow-sm">
          <p class="font-display text-lg font-extrabold leading-tight">{{ avg ? avg.toFixed(1) : '–' }}</p>
          <p class="mt-0.5 text-[10px] font-semibold text-muted-foreground">Moyenne 30 j</p>
        </div>
        <div class="rounded-2xl bg-card p-3 text-center shadow-sm">
          <p class="font-display text-lg font-extrabold leading-tight">{{ last30.length }}</p>
          <p class="mt-0.5 text-[10px] font-semibold text-muted-foreground">Check-ins</p>
        </div>
        <div class="rounded-2xl bg-card p-3 text-center shadow-sm">
          <p class="font-display text-lg font-extrabold leading-tight">{{ frequent }}</p>
          <p class="mt-0.5 text-[10px] font-semibold text-muted-foreground">Humeur la + fréquente</p>
        </div>
      </div>

      <div class="mx-6 mt-4">
        <MoodCalendar :get-day="getDay" :selected="sel" @select="sel = $event" />
      </div>

      <div class="mx-6 mt-4 rounded-[2rem] bg-card p-4 shadow-sm">
        <p v-if="!sel" class="text-center text-sm text-muted-foreground">Touche un jour pour voir ton humeur.</p>
        <div v-else-if="entry" class="flex items-center gap-3">
          <div :class="`rounded-full p-1 ${MOODS[entry.mood].bgSoft}`"><Mascot :mood="entry.mood" :size="52" /></div>
          <div class="min-w-0">
            <p class="text-xs capitalize text-muted-foreground">{{ longDate(sel) }}</p>
            <p class="font-display text-xl font-extrabold">{{ MOODS[entry.mood].label }}</p>
            <div class="mt-1 flex flex-wrap gap-1">
              <template v-for="id in entry.factors" :key="id">
                <span
                  v-if="factorById(id)"
                  class="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold"
                >
                  <component :is="factorById(id).icon" :size="11" :stroke-width="1.5" class="text-muted-foreground" />
                  {{ factorById(id).label }}
                </span>
              </template>
            </div>
            <!-- Le message libre n'existe que sur ce téléphone -->
            <p v-if="entry.note" class="mt-2 break-words text-sm italic text-foreground/80">« {{ entry.note }} »</p>
            <p v-if="entry.demo" class="mt-1 text-[10px] text-muted-foreground">Exemple de démo</p>
          </div>
        </div>
        <p v-else class="text-center text-sm text-muted-foreground">Pas de check-in ce jour-là.</p>
      </div>
    </div>
  </PhoneShell>
</template>
