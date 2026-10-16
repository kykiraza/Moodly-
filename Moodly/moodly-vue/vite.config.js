import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// Configuration de Vite (l'outil qui lance et construit l'app)
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    // « @/… » = dossier src/ (ex. import Mascot from '@/components/Mascot.vue')
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
});
