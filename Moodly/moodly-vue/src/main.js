// Point d'entrée de l'app : on crée l'app Vue, on branche le routeur et le CSS.
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './style.css';

createApp(App).use(router).mount('#app');
