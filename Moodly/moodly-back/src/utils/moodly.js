'use strict';

/**
 * Petites fonctions utilitaires partagées par toute l'API Moodly.
 * Les jours sont toujours manipulés comme du texte « AAAA-MM-JJ » (ex. "2026-10-16") :
 * pas d'heure, donc pas de surprise avec les fuseaux horaires.
 */

const crypto = require('crypto');

const timezone = () => process.env.APP_TIMEZONE || 'Europe/Paris';

/** La date du jour dans le fuseau de l'appli (Europe/Paris par défaut), ex. "2026-10-16". */
function today() {
  // Le format 'en-CA' donne directement AAAA-MM-JJ
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Ajoute (ou retire si n < 0) des jours à une date "AAAA-MM-JJ". */
function addDays(day, n) {
  const date = new Date(`${day}T00:00:00Z`); // minuit UTC : aucun changement d'heure ne peut décaler le jour
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/** true si la date "AAAA-MM-JJ" tombe un samedi ou un dimanche. */
function isWeekend(day) {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = dimanche, 6 = samedi
  return weekday === 0 || weekday === 6;
}

/**
 * Empreinte « cette personne a répondu ce jour-là », SANS stocker qui c'est.
 * HMAC = hachage avec une clé secrète (MOOD_SALT) : sans la clé, impossible de
 * retrouver l'utilisateur à partir de l'empreinte. Deux saisies du même
 * utilisateur le même jour donnent la même empreinte → la base refuse la 2e.
 */
function dailyKey(userId, day) {
  const salt = process.env.MOOD_SALT;
  if (!salt) throw new Error('MOOD_SALT manquant dans .env (lance `npm run setup`)');
  return crypto.createHmac('sha256', salt).update(`${userId}:${day}`).digest('hex');
}

/** Lit un entier dans les variables d'environnement, avec une valeur par défaut. */
function envInt(name, fallback) {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isNaN(value) ? fallback : value;
}

/** Arrondit à 1 chiffre après la virgule (3.4666 → 3.5). */
const round1 = (x) => Math.round(x * 10) / 10;

module.exports = { today, addDays, isWeekend, dailyKey, envInt, round1 };
