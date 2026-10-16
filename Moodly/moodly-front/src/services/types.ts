// Les formats de données échangés avec le back (= le contrat d'API)

export type Role = 'employee' | 'manager';

// POST /auth/login → réponse
export type LoginResponse = {
  token: string;
  role: Role;
  name: string;
};

// POST /moods → ce qu'on envoie (chaque note de 1 à 5)
export type MoodAnswer = {
  mood: number; // 1. Comment te sens-tu aujourd'hui ?
  workload: number; // 2. Comment vis-tu ta charge de travail ?
  atmosphere: number; // 3. Comment trouves-tu l'ambiance dans l'équipe ?
};

// Les 3 questions (= les 3 onglets du graphe manager)
export type QuestionKey = 'mood' | 'workload' | 'atmosphere';

// GET /team/stats?days=30 → réponse
export type DailyStat = {
  date: string; // "2026-10-01"
  mood: number; // moyenne de l'équipe à la question 1 ce jour-là
  workload: number; // moyenne à la question 2
  atmosphere: number; // moyenne à la question 3
  count: number; // nombre de réponses ce jour-là
};

export type TeamStats = {
  daily: DailyStat[];
  summary: {
    mood: number;
    workload: number;
    atmosphere: number;
    responseRate: number; // en %
  };
};

// Toutes les fonctions que l'app utilise pour parler au back
export type Api = {
  login(email: string, password: string): Promise<LoginResponse>;
  sendMood(answer: MoodAnswer): Promise<void>;
  hasAnsweredToday(): Promise<boolean>;
  getTeamStats(days: number): Promise<TeamStats>;
};
