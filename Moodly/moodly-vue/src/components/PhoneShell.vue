<script setup>
// Cadre « téléphone » : plein écran sur mobile, maquette de téléphone sur ordinateur.
defineProps({ class: { type: String, default: '' } });
</script>

<template>
  <div class="min-h-screen w-full bg-secondary sm:flex sm:items-center sm:justify-center sm:py-8">
    <div
      :class="`relative mx-auto flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden bg-background sm:min-h-[820px] sm:rounded-[2.75rem] sm:border-[10px] sm:border-ink sm:shadow-2xl ${$props.class}`"
    >
      <slot />
    </div>
  </div>
</template>
