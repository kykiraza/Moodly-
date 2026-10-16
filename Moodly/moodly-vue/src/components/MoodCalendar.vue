<script setup>
// Calendrier mensuel coloré par humeur (perso ou équipe).
// getDay(clé "AAAA-MM-JJ") → { mood?: 1..5, hidden?: true } ou undefined
import { computed, ref } from 'vue';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-vue-next';
import { MOODS, LEVELS, ymd } from '@/lib/moods';

const props = defineProps({
  getDay: { type: Function, required: true },
  selected: { type: String, default: null },
});
const emit = defineEmits(['select']);

const WD = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const now = new Date();
const month = ref(new Date(now.getFullYear(), now.getMonth(), 1));
const today = ymd(now);

const title = computed(() => month.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));

const cells = computed(() => {
  const m = month.value;
  const first = (m.getDay() + 6) % 7; // lundi = 0
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  return [
    ...Array(first).fill(null),
    ...Array.from({ length: days }, (_, i) => {
      const n = i + 1;
      const key = ymd(new Date(m.getFullYear(), m.getMonth(), n));
      return { n, key, cell: props.getDay(key) };
    }),
  ];
});

const shift = (n) => {
  month.value = new Date(month.value.getFullYear(), month.value.getMonth() + n, 1);
};
</script>

<template>
  <div class="rounded-[2rem] bg-card p-4 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <button class="rounded-full bg-secondary p-2" aria-label="Mois précédent" @click="shift(-1)"><ChevronLeft :size="16" /></button>
      <p class="font-display text-lg font-extrabold capitalize">{{ title }}</p>
      <button class="rounded-full bg-secondary p-2" aria-label="Mois suivant" @click="shift(1)"><ChevronRight :size="16" /></button>
    </div>
    <div class="grid grid-cols-7 gap-1.5 text-center">
      <span v-for="(w, i) in WD" :key="'wd' + i" class="text-[10px] font-bold text-muted-foreground">{{ w }}</span>
      <template v-for="(d, i) in cells" :key="i">
        <span v-if="!d" />
        <button
          v-else
          :aria-label="`${d.n} ${title}${d.cell?.mood ? ` : ${MOODS[d.cell.mood].label}` : ''}`"
          :class="[
            'relative grid aspect-square place-items-center rounded-full text-xs font-bold transition',
            d.cell?.mood ? `${MOODS[d.cell.mood].bg} text-ink` : 'bg-secondary/60 text-muted-foreground',
            selected === d.key ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : '',
            d.key === today && selected !== d.key ? 'ring-2 ring-primary' : '',
          ]"
          @click="emit('select', d.key)"
        >
          <Lock v-if="d.cell?.hidden" :size="11" />
          <template v-else>{{ d.n }}</template>
        </button>
      </template>
    </div>
    <div class="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
      <span v-for="l in LEVELS" :key="l" class="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
        <span :class="`h-2.5 w-2.5 rounded-full ${MOODS[l].bg}`" /> {{ MOODS[l].label }}
      </span>
    </div>
  </div>
</template>
