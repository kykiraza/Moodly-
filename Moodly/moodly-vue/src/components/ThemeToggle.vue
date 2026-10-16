<script setup>
// Bouton qui fait tourner le thème : Auto → Clair → Sombre → Auto…
import { computed } from 'vue';
import { Monitor, Moon, Sun } from 'lucide-vue-next';
import { useTheme } from '@/lib/theme';

defineProps({ compact: { type: Boolean, default: false } });

const NEXT = { system: 'light', light: 'dark', dark: 'system' };
const LABEL = { system: 'Auto (téléphone)', light: 'Clair', dark: 'Sombre' };

const { pref, set } = useTheme();
const icon = computed(() => (pref.value === 'light' ? Sun : pref.value === 'dark' ? Moon : Monitor));
</script>

<template>
  <button
    type="button"
    :aria-label="`Thème : ${LABEL[pref]} — changer`"
    :title="`Thème : ${LABEL[pref]}`"
    :class="`flex items-center gap-1.5 rounded-full bg-secondary ${compact ? 'p-2' : 'px-2.5 py-2'} text-[11px] font-bold text-foreground transition active:scale-95`"
    @click="set(NEXT[pref])"
  >
    <component :is="icon" :size="15" :stroke-width="1.75" />
    <template v-if="!compact">{{ LABEL[pref] }}</template>
  </button>
</template>
