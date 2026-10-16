// 🧪 Faux back : permet de coder et tester le front sans attendre le vrai back.
// Comptes de test :
//   employe@moodly.fr / moodly  → employé
//   manager@moodly.fr / moodly  → manager

import { Api, DailyStat, MoodAnswer } from './types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let answeredToday = false;
let lastAnswer: MoodAnswer | null = null;

function fakeDaily(days: number): DailyStat[] {
  const result: DailyStat[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // 2 jours avec trop peu de réponses pour montrer la règle d'anonymat
    const count = i === 21 || i === 20 ? 2 : 4 + Math.floor(Math.random() * 3);
    const round = (v: number) => Math.round(Math.min(5, Math.max(1, v)) * 10) / 10;
    result.push({
      date: d.toISOString().slice(0, 10),
      mood: round(3.3 + Math.sin(i / 4) * 0.5 + Math.random() * 0.5),
      workload: round(2.6 + (days - i) * 0.03 + Math.random() * 0.5), // la charge s'améliore
      atmosphere: round(3.7 + Math.cos(i / 5) * 0.3 + Math.random() * 0.4),
      count,
    });
  }
  return result;
}

export const mockApi: Api = {
  async login(email, password) {
    await wait(500);
    const e = email.trim().toLowerCase();
    if (password !== 'moodly') throw new Error('Email ou mot de passe incorrect');
    if (e === 'employe@moodly.fr') return { token: 'fake-employee', role: 'employee', name: 'Léa' };
    if (e === 'manager@moodly.fr') return { token: 'fake-manager', role: 'manager', name: 'Karim' };
    throw new Error('Email ou mot de passe incorrect');
  },

  async sendMood(answer) {
    await wait(400);
    lastAnswer = answer;
    answeredToday = true;
  },

  async hasAnsweredToday() {
    await wait(200);
    return answeredToday;
  },

  async getTeamStats(days) {
    await wait(500);
    return {
      daily: fakeDaily(days),
      summary: {
        mood: lastAnswer ? 3.8 : 3.7,
        workload: 3.2,
        atmosphere: 3.9,
        responseRate: 78,
      },
    };
  },
};
