<script setup>
// La mascotte « blob » : couleur et visage changent selon l'humeur (1 à 5).
import { computed } from 'vue';
import { MOODS } from '@/lib/moods';

const props = defineProps({
  mood: { type: Number, default: 4 },
  size: { type: Number, default: 160 },
});

const MOUTHS = {
  1: 'M40 78 Q60 64 80 78',
  2: 'M42 74 Q60 70 78 74',
  3: 'M44 72 L76 72',
  4: 'M42 70 Q60 84 78 70',
  5: 'M38 68 Q60 96 82 68 Z',
};

const m = computed(() => MOODS[props.mood]);
const sad = computed(() => props.mood <= 2);
</script>

<template>
  <svg viewBox="0 0 120 120" :width="size" :height="size" :aria-label="`Mascotte : ${m.label}`">
    <ellipse cx="60" cy="112" rx="34" ry="5" fill="var(--ink)" opacity="0.12" />
    <path d="M60 18 C60 10 64 6 70 4" stroke="var(--mood-5)" stroke-width="4" stroke-linecap="round" fill="none" />
    <path d="M64 12 C72 6 82 10 82 10 C76 18 66 16 64 12Z" fill="var(--mood-5)" />
    <path
      d="M60 18 C36 18 26 44 18 70 C12 92 30 108 60 108 C90 108 108 92 102 70 C94 44 84 18 60 18Z"
      :fill="m.fill"
      style="transition: fill 400ms ease"
    />
    <path d="M36 44 C40 34 48 28 56 27" stroke="white" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round" fill="none" />
    <ellipse cx="32" cy="72" rx="7" ry="4.5" fill="var(--blush)" opacity="0.7" />
    <ellipse cx="88" cy="72" rx="7" ry="4.5" fill="var(--blush)" opacity="0.7" />
    <template v-if="sad">
      <path d="M38 56 Q46 52 52 58" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M68 58 Q74 52 82 56" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" fill="none" />
    </template>
    <template v-else>
      <ellipse cx="45" cy="56" rx="5" :ry="mood === 5 ? 4 : 6" fill="var(--ink)" />
      <ellipse cx="75" cy="56" rx="5" :ry="mood === 5 ? 4 : 6" fill="var(--ink)" />
      <circle cx="47" cy="54" r="1.6" fill="white" />
      <circle cx="77" cy="54" r="1.6" fill="white" />
    </template>
    <path
      :d="MOUTHS[mood]"
      stroke="var(--ink)"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
      :fill="mood === 5 ? 'var(--ink)' : 'none'"
    />
  </svg>
</template>
