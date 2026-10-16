<script setup>
// Vue manager : la « météo » de l'équipe, uniquement à partir d'agrégats anonymes (GET /api/team/stats).
// Un jour avec moins de 3 réponses, un week-end sans réponse ou la journée en cours n'a pas de moyenne.
import { computed, onMounted, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { CalendarDays, Lightbulb, Lock, LogOut, Settings, TrendingDown, TrendingUp } from 'lucide-vue-next';
import Mascot from '@/components/Mascot.vue';
import PhoneShell from '@/components/PhoneShell.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { api } from '@/lib/api';
import { LEVELS, MOODS, factorById, levelOf } from '@/lib/moods';
import { logout } from '@/lib/session';

const router = useRouter();

const RANGES = [
  { label: '7 j', days: 7 },
  { label: '30 j', days: 30 },
  { label: 'Trimestre', days: 90 },
];
// shallowRef : garde l'objet tel quel, pour pouvoir le comparer avec « === » aux éléments de RANGES
const range = shallowRef(RANGES[1]);
const stats = ref(null);
const loading = ref(true);
const error = ref('');
const hover = ref(null);

let lastRequest = 0;
async function load() {
  const id = ++lastRequest; // si on change vite de période, seule la dernière réponse compte
  loading.value = true;
  error.value = '';
  try {
    const res = await api.teamStats(range.value.days);
    if (id === lastRequest) stats.value = res;
  } catch (err) {
    if (id === lastRequest) error.value = err.message;
  } finally {
    if (id === lastRequest) loading.value = false;
  }
}
onMounted(load);

function pickRange(r) {
  if (r === range.value) return;
  range.value = r;
  hover.value = null;
  load(); // on garde les anciennes données affichées pendant le chargement
}

function signOut() {
  logout();
  router.replace('/');
}

// --- Carte « Météo de l'équipe » ---
const data = computed(() => stats.value?.daily ?? []);
const avg = computed(() => stats.value?.summary.mood ?? null);
const avgLevel = computed(() => (avg.value !== null ? levelOf(avg.value) : 3));
const trend = computed(() => stats.value?.summary.trend ?? null);

// Participation moyenne par jour ouvré terminé (ex. « ≈ 8 sur 11 par jour »)
const perDay = computed(() => {
  const days = data.value.filter((d) => !d.weekend && !d.open);
  return days.length ? Math.round(days.reduce((s, d) => s + d.count, 0) / days.length) : 0;
});

// --- Graphe (même SVG que le prototype) ---
const W = 320;
const H = 150;
const P = 10;
const x = (k) => P + (data.value.length > 1 ? k / (data.value.length - 1) : 0.5) * (W - 2 * P);
const y = (v) => H - P - ((v - 1) / 4) * (H - 2 * P);

// Points visibles (jours qui ont une moyenne publiée)
const pts = computed(() =>
  data.value.map((d, k) => ({ ...d, k, cx: x(k), cy: d.mood !== null ? y(d.mood) : 0 })).filter((d) => d.mood !== null),
);
const path = computed(() => pts.value.map((p, n) => `${n ? 'L' : 'M'}${p.cx},${p.cy}`).join(' '));
// Bandes grises : jours sans moyenne (masqués, journée en cours, week-end)
const greyDays = computed(() =>
  data.value.map((d, k) => ({ d, k })).filter(({ d }) => d.mood === null && (d.count > 0 || d.open || d.weekend)),
);
const hovered = computed(() => (hover.value !== null ? data.value[hover.value] : null));

// --- Répartition des humeurs (en %) ---
const distTotal = computed(() => Object.values(stats.value?.distribution ?? {}).reduce((a, b) => a + b, 0));
const distPct = (l) => (distTotal.value ? Math.round((stats.value.distribution[l] / distTotal.value) * 100) : 0);

// --- Raisons les plus citées ---
const top = computed(() => (stats.value?.tags ?? []).filter((t) => factorById(t.slug)).slice(0, 5));

// --- Le conseil Moodly : calculé à partir des vraies données ---
const TIPS = {
  charge: "La charge de travail revient souvent : un point d'équipe sur les priorités pourrait aider.",
  management: "Le management est souvent cité : des points individuels réguliers peuvent rassurer l'équipe.",
  conditions: "Les conditions de travail reviennent : vérifie le matériel et l'environnement de l'équipe.",
  perso: "Des raisons personnelles pèsent sur le moral : rappelle les dispositifs d'écoute et de soutien.",
  equilibre: "L'équilibre vie pro/perso est souvent cité : veille au respect des horaires et au droit à la déconnexion.",
};
const advice = computed(() => {
  if (!stats.value || avg.value === null) return 'Pas encore assez de réponses pour donner un conseil.';
  const tags = stats.value.tags;
  if (avg.value >= 4 && (trend.value ?? 0) >= 0 && tags.length) {
    return `Le moral est bon : continue de valoriser ce qui marche, notamment « ${tags[0].label} ».`;
  }
  const prefix = trend.value !== null && trend.value <= -5 ? `Le moral baisse de ${-trend.value} % sur la période. ` : '';
  const sensitive = tags.find((t) => TIPS[t.slug]);
  return prefix + (sensitive ? TIPS[sensitive.slug] : "Continue d'écouter ton équipe : les tendances seront plus claires avec plus de réponses.");
});
</script>

<template>
  <PhoneShell>
    <div class="flex-1 overflow-y-auto pb-8">
      <div class="flex items-start justify-between px-6 pt-6">
        <div>
          <span class="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground">Vue manager</span>
          <h1 class="mt-2 text-3xl font-extrabold">{{ stats?.team.name ?? 'Mon équipe' }}</h1>
          <p class="text-xs text-muted-foreground">
            {{ stats ? `${stats.members} personnes · données anonymes` : 'données anonymes' }}
          </p>
        </div>
        <div class="flex items-center gap-1.5">
          <ThemeToggle compact />
          <RouterLink to="/parametres" class="rounded-full bg-secondary p-2" aria-label="Paramètres"><Settings :size="18" /></RouterLink>
          <RouterLink to="/espace-manager" class="rounded-full bg-secondary p-2" aria-label="Calendrier d'équipe"><CalendarDays :size="18" /></RouterLink>
          <button class="rounded-full bg-secondary p-2" aria-label="Se déconnecter" @click="signOut"><LogOut :size="18" /></button>
        </div>
      </div>

      <div class="mx-6 mt-4 grid grid-cols-3 gap-1 rounded-full bg-secondary p-1">
        <button
          v-for="r in RANGES"
          :key="r.label"
          :class="`rounded-full py-1.5 text-xs font-bold transition ${range === r ? 'bg-ink text-background' : ''}`"
          @click="pickRange(r)"
        >
          {{ r.label }}
        </button>
      </div>

      <!-- Premier chargement / erreur -->
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
        <p v-if="error" class="mx-6 mt-3 text-center text-xs font-semibold text-destructive" role="alert">{{ error }}</p>

        <!-- Carte « météo » -->
        <div
          :class="`relative mx-6 mt-4 overflow-hidden rounded-[2rem] p-5 transition-opacity ${MOODS[avgLevel].bg} ${loading ? 'opacity-70' : ''}`"
        >
          <p class="text-sm font-bold text-ink/70">Météo de l'équipe</p>
          <p class="font-display text-5xl font-extrabold text-ink">
            {{ avg !== null ? avg.toFixed(1) : '–' }}<span class="text-xl">/5</span>
          </p>
          <p class="font-display text-xl font-extrabold text-ink">{{ avg !== null ? MOODS[avgLevel].label : 'Pas assez de réponses' }}</p>
          <p v-if="trend !== null" class="mt-2 inline-flex items-center gap-1 rounded-full bg-card/70 px-2 py-0.5 text-xs font-bold text-ink">
            <TrendingUp v-if="trend >= 0" :size="12" />
            <TrendingDown v-else :size="12" />
            {{ trend >= 0 ? '+' : '' }}{{ trend }} % vs période précédente
          </p>
          <Mascot :mood="avgLevel" :size="130" class="absolute -right-3 -bottom-4 animate-bob" />
        </div>

        <div class="mx-6 mt-3 grid grid-cols-2 gap-3">
          <div class="rounded-3xl bg-card p-4 shadow-sm">
            <p class="text-xs font-semibold text-muted-foreground">Participation</p>
            <p class="font-display text-3xl font-extrabold">
              {{ stats.summary.responseRate !== null ? `${stats.summary.responseRate} %` : '–' }}
            </p>
            <p class="text-[11px] text-muted-foreground">≈ {{ perDay }} sur {{ stats.members }} par jour</p>
          </div>
          <div class="rounded-3xl bg-card p-4 shadow-sm">
            <p class="text-xs font-semibold text-muted-foreground">Réponses</p>
            <p class="font-display text-3xl font-extrabold">{{ stats.summary.responses }}</p>
            <p class="text-[11px] text-muted-foreground">sur {{ range.label }}</p>
          </div>
        </div>

        <!-- Graphe : le moral moyen par jour (UN SEUL graphe principal) -->
        <section class="mx-6 mt-4 rounded-3xl bg-card p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-extrabold">Moral moyen par jour</h2>
            <span v-if="hovered && hovered.mood !== null" class="text-xs font-bold">
              {{ MOODS[levelOf(hovered.mood)].label }} · {{ hovered.mood.toFixed(1) }}
            </span>
          </div>
          <svg :viewBox="`0 0 ${W} ${H}`" class="mt-2 w-full" @mouseleave="hover = null">
            <line v-for="v in [1, 3, 5]" :key="v" :x1="P" :x2="W - P" :y1="y(v)" :y2="y(v)" stroke="var(--border)" stroke-dasharray="3 4" />
            <rect v-for="g in greyDays" :key="'g' + g.k" :x="x(g.k) - 4" :y="P" :width="8" :height="H - 2 * P" rx="3" fill="var(--muted)" />
            <path :d="path" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
            <circle
              v-for="p in pts"
              :key="p.k"
              :cx="p.cx"
              :cy="p.cy"
              :r="hover === p.k ? 7 : 4.5"
              :fill="MOODS[levelOf(p.mood)].fill"
              stroke="var(--ink)"
              stroke-width="1.5"
              class="cursor-pointer transition-all"
              @mouseenter="hover = p.k"
              @click="hover = p.k"
            />
          </svg>
          <div class="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Super ↑</span><span>Pas bien ↓</span>
          </div>
          <p class="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span class="inline-block h-3 w-2 shrink-0 rounded-sm bg-muted" /> Masqué : moins de 3 réponses, week-end ou journée en cours (anonymat)
          </p>
        </section>

        <!-- Répartition -->
        <section class="mx-6 mt-4 rounded-3xl bg-card p-4 shadow-sm">
          <h2 class="text-lg font-extrabold">Comment ça va, vraiment ?</h2>
          <p v-if="!distTotal" class="mt-3 text-sm text-muted-foreground">Pas encore assez de réponses.</p>
          <template v-else>
            <div class="mt-3 flex h-4 overflow-hidden rounded-full">
              <div v-for="l in LEVELS" :key="l" :class="MOODS[l].bg" :style="{ width: `${(stats.distribution[l] / distTotal) * 100}%` }" />
            </div>
            <div class="mt-3 grid grid-cols-5 gap-1 text-center">
              <div v-for="l in LEVELS" :key="l" class="flex flex-col items-center">
                <Mascot :mood="l" :size="34" />
                <span class="text-[10px] font-semibold">{{ MOODS[l].label }}</span>
                <span class="text-xs font-extrabold">{{ distPct(l) }}%</span>
              </div>
            </div>
          </template>
        </section>

        <!-- Raisons -->
        <section class="mx-6 mt-4 rounded-3xl bg-card p-4 shadow-sm">
          <h2 class="text-lg font-extrabold">Ce qui revient le plus</h2>
          <p v-if="!top.length" class="mt-3 text-sm text-muted-foreground">Pas encore assez de réponses.</p>
          <div v-else class="mt-3 space-y-3">
            <div v-for="t in top" :key="t.slug">
              <div class="flex justify-between text-sm font-semibold">
                <span class="flex items-center gap-2">
                  <component :is="factorById(t.slug).icon" :size="15" :stroke-width="1.5" class="shrink-0 text-muted-foreground" />
                  {{ factorById(t.slug).label }}
                </span>
                <span>{{ t.pct }} %</span>
              </div>
              <div class="mt-1 h-2 rounded-full bg-secondary">
                <div class="h-2 rounded-full bg-primary" :style="{ width: `${Math.min(100, t.pct * 2.5)}%` }" />
              </div>
            </div>
          </div>
          <p class="mt-3 text-[11px] text-muted-foreground">Part des réponses citant chaque raison. Aucune réponse individuelle n'est visible.</p>
        </section>

        <!-- Conseil -->
        <section class="mx-6 mt-4 flex gap-3 rounded-3xl bg-mood-3-soft p-4">
          <Lightbulb class="mt-0.5 shrink-0" :size="20" />
          <div>
            <p class="font-bold">Le conseil Moodly</p>
            <p class="text-sm text-foreground/80">{{ advice }}</p>
          </div>
        </section>
      </template>

      <p class="mt-5 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Lock :size="12" /> Données agrégées dès 3 réponses
      </p>
    </div>
  </PhoneShell>
</template>
