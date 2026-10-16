<script setup>
// Barre du haut : logo Moodly à gauche, boutons (slot « right ») à droite.
import MoodMark from '@/components/MoodMark.vue';
</script>

<template>
  <div class="flex items-center justify-between px-6 pt-6">
    <div class="flex items-center gap-2 font-display text-lg font-extrabold">
      <MoodMark :size="28" class="-ml-1" />
      Moodly
    </div>
    <slot name="right" />
  </div>
</template>
