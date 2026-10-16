<script setup>
// Composant racine : affiche la page de la route courante.
// Il écoute aussi l'événement « session expirée » envoyé par src/lib/api.js
// (réponse 401 du serveur) pour renvoyer vers l'écran de connexion.
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { SESSION_EXPIRED_EVENT } from '@/lib/api';

const router = useRouter();
const onExpired = () => router.replace('/');

onMounted(() => window.addEventListener(SESSION_EXPIRED_EVENT, onExpired));
onUnmounted(() => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired));
</script>

<template>
  <RouterView />
</template>
