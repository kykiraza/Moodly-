// 🌐 Vrai back : les appels HTTP vers le serveur (contrat d'API validé avec le groupe)

import axios from 'axios';
import { API_URL } from '../config';
import { Api } from './types';

export const http = axios.create({ baseURL: API_URL, timeout: 10000 });

// Le token est ajouté automatiquement à chaque requête (sauf login)
let currentToken: string | null = null;
export function setToken(token: string | null) {
  currentToken = token;
}
http.interceptors.request.use((config) => {
  if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`;
  return config;
});

export const realApi: Api = {
  async login(email, password) {
    try {
      const res = await http.post('/auth/login', { email, password });
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 401) throw new Error('Email ou mot de passe incorrect');
      throw new Error('Connexion au serveur impossible');
    }
  },

  async sendMood(answer) {
    await http.post('/moods', answer);
  },

  async hasAnsweredToday() {
    const res = await http.get('/moods/today');
    return res.data.hasAnswered;
  },

  async getTeamStats(days) {
    const res = await http.get('/team/stats', { params: { days } });
    return res.data;
  },
};
