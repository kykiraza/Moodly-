// Choisit le faux ou le vrai back selon src/config.ts
import { USE_MOCK } from '../config';
import { mockApi } from './mockApi';
import { realApi } from './realApi';

export const api = USE_MOCK ? mockApi : realApi;
