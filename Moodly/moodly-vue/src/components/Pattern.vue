<script setup>
// Motif géométrique (quarts de cercle colorés) du prototype.
import { computed } from 'vue';

const props = defineProps({
  cols: { type: Number, default: 7 },
  rows: { type: Number, default: 7 },
  dark: { type: Boolean, default: false }, // gardé pour garder la même API que le prototype
});

const FILLS = ['var(--mood-1)', 'var(--mood-3)', 'var(--mood-4)', 'var(--primary)', 'var(--mood-2)', 'var(--blush)'];
const S = 20;

const cells = computed(() => {
  const out = [];
  for (let r = 0; r < props.rows; r++) {
    for (let c = 0; c < props.cols; c++) {
      const n = (r * 7 + c * 3 + r * c) % 11;
      if (n === 0) continue;
      out.push({
        key: `${r}-${c}`,
        fill: FILLS[(r * 5 + c * 2) % FILLS.length],
        transform: `translate(${c * S} ${r * S}) rotate(${((r + c * 3) % 4) * 90} ${S / 2} ${S / 2})`,
        circle: n % 3 === 0,
      });
    }
  }
  return out;
});
</script>

<template>
  <svg :viewBox="`0 0 ${cols * S} ${rows * S}`" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="100%" height="100%" fill="var(--background)" />
    <g v-for="cell in cells" :key="cell.key" :transform="cell.transform">
      <circle v-if="cell.circle" :cx="S / 2" :cy="S / 2" :r="S / 2" :fill="cell.fill" />
      <path v-else :d="`M0 0 L${S} 0 A${S} ${S} 0 0 1 0 ${S} Z`" :fill="cell.fill" />
    </g>
  </svg>
</template>
