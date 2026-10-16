'use strict';

/**
 * Middleware de la route de login, exécuté AVANT le limiteur de tentatives.
 *
 * Le limiteur de Strapi compte les essais par « email + IP », avec l'email tel qu'il
 * est envoyé. Sans ce nettoyage, " sarah@moodly.test" et "sarah@moodly.test " seraient
 * comptés comme deux emails différents (chacun son quota) alors qu'ils désignent le
 * même compte → on pourrait essayer des mots de passe sans limite.
 * Ici on met l'email dans sa forme finale (sans espaces, en minuscules) : le limiteur
 * et le contrôleur voient exactement la même valeur.
 */
const MAX_EMAIL_LENGTH = 254; // longueur maximale d'une adresse email valide

module.exports = () => async (ctx, next) => {
  const body = ctx.request.body;

  if (body && typeof body.email === 'string') {
    if (body.email.length > MAX_EMAIL_LENGTH) {
      return ctx.badRequest('email invalide');
    }
    body.email = body.email.trim().toLowerCase();
  }

  await next();
};
