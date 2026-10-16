'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { today, dailyKey } = require('../../../utils/moodly');

const MAX_TAGS = 3;
const ALREADY_ANSWERED = "Tu as déjà donné ton moral aujourd'hui, reviens demain !";

/** true si l'erreur vient de la règle « dailyKey unique » (2 saisies en même temps). */
const isUniqueError = (err) =>
  err?.code === 'SQLITE_CONSTRAINT_UNIQUE' || // SQLite
  err?.code === '23505' || // PostgreSQL
  err?.code === 'ER_DUP_ENTRY' || // MySQL
  /unique/i.test(err?.message || '');

module.exports = createCoreController('api::mood.mood', ({ strapi }) => ({
  /**
   * POST /api/moods
   * Body accepté : { score: 1..5, tags?: [...] }  ou le format Strapi { data: { score, tags } }.
   * - « mood » est accepté comme synonyme de « score » (c'est le nom utilisé par le front).
   * - tags : 0 à 3 slugs (ex. "fatigue") ou documentId de tags existants.
   * - Tout le reste du body est IGNORÉ : le jour et l'équipe sont décidés par le serveur.
   */
  async create(ctx) {
    const body = ctx.request.body?.data ?? ctx.request.body ?? {};

    // 1) Valider la note
    const score = body.score ?? body.mood;
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return ctx.badRequest('score doit être un nombre entier entre 1 et 5');
    }

    // 2) Valider les tags
    const wanted = body.tags ?? [];
    if (!Array.isArray(wanted) || wanted.some((tag) => typeof tag !== 'string' || !tag)) {
      return ctx.badRequest('tags doit être une liste de slugs (ex. ["fatigue"])');
    }
    if (wanted.length > MAX_TAGS) {
      return ctx.badRequest(`${MAX_TAGS} tags maximum`);
    }
    if (new Set(wanted).size !== wanted.length) {
      return ctx.badRequest('Le même tag est présent deux fois');
    }

    const tags = wanted.length
      ? await strapi.documents('api::tag.tag').findMany({
          filters: { $or: [{ slug: { $in: wanted } }, { documentId: { $in: wanted } }] },
          fields: ['slug'],
        })
      : [];
    if (tags.length !== wanted.length) {
      return ctx.badRequest('Tag inconnu (voir GET /api/tags)');
    }

    // 3) L'équipe vient de la BASE (jamais du body : on ne peut pas tricher)
    const profile = await strapi.service('api::profile.profile').forUser(ctx.state.user.id);
    if (!profile?.team) {
      return ctx.forbidden("Tu n'es rattaché(e) à aucune équipe, demande à ton manager");
    }

    // 4) Une seule saisie par jour : on calcule l'empreinte anonyme du jour
    const day = today();
    const key = dailyKey(ctx.state.user.id, day);

    const existing = await strapi.documents('api::mood.mood').findFirst({
      filters: { dailyKey: key },
      fields: ['id'],
    });
    if (existing) return ctx.conflict(ALREADY_ANSWERED);

    // 5) Enregistrer (sans AUCUN lien vers l'utilisateur)
    try {
      await strapi.documents('api::mood.mood').create({
        data: {
          day,
          score,
          tags: tags.map((tag) => tag.documentId),
          team: profile.team.documentId,
          dailyKey: key,
        },
      });
    } catch (err) {
      // Deux requêtes envoyées au même instant (double clic) : la base garde la 1re
      if (isUniqueError(err)) return ctx.conflict(ALREADY_ANSWERED);
      throw err;
    }

    // On ne renvoie ni id ni documentId : la saisie ne doit pas pouvoir être retrouvée
    ctx.status = 201;
    ctx.body = { data: { day, score, tags: tags.map((tag) => tag.slug) } };
  },

  /**
   * GET /api/moods/today → { hasAnswered: boolean, day: "AAAA-MM-JJ" }
   * Permet au front d'afficher « Merci, à demain » au lieu du formulaire.
   */
  async today(ctx) {
    const day = today();
    const existing = await strapi.documents('api::mood.mood').findFirst({
      filters: { dailyKey: dailyKey(ctx.state.user.id, day) },
      fields: ['id'],
    });

    ctx.body = { hasAnswered: Boolean(existing), day };
  },
}));
