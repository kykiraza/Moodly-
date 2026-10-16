<script setup>
// Petit logo : la mascotte remplie avec les 5 couleurs d'humeur.
import { useId } from 'vue';

defineProps({ size: { type: Number, default: 26 } });
const id = 'moodly-mark' + useId().replace(/[^a-zA-Z0-9]/g, '');
</script>

<template>
  <svg viewBox="0 0 120 120" :width="size" :height="size" aria-hidden="true">
    <defs>
      <linearGradient :id="id" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--mood-1)" />
        <stop offset="26%" stop-color="var(--mood-2)" />
        <stop offset="52%" stop-color="var(--mood-3)" />
        <stop offset="78%" stop-color="var(--mood-4)" />
        <stop offset="100%" stop-color="var(--mood-5)" />
      </linearGradient>
    </defs>
    <path d="M60 18 C60 10 64 6 70 4" stroke="var(--mood-5)" stroke-width="5" stroke-linecap="round" fill="none" />
    <path d="M64 12 C72 6 82 10 82 10 C76 18 66 16 64 12Z" fill="var(--mood-5)" />
    <path
      d="M60 18 C36 18 26 44 18 70 C12 92 30 108 60 108 C90 108 108 92 102 70 C94 44 84 18 60 18Z"
      :fill="`url(#${id})`"
    />
    <path d="M36 44 C40 34 48 28 56 27" stroke="white" stroke-opacity="0.5" stroke-width="5" stroke-linecap="round" fill="none" />
    <ellipse cx="32" cy="72" rx="7" ry="4.5" fill="var(--blush)" opacity="0.7" />
    <ellipse cx="88" cy="72" rx="7" ry="4.5" fill="var(--blush)" opacity="0.7" />
    <ellipse cx="45" cy="56" rx="5" ry="6" fill="var(--ink)" />
    <ellipse cx="75" cy="56" rx="5" ry="6" fill="var(--ink)" />
    <circle cx="47" cy="54" r="1.6" fill="white" />
    <circle cx="77" cy="54" r="1.6" fill="white" />
    <path d="M44 72 Q60 85 76 72" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" fill="none" />
  </svg>
</template>
