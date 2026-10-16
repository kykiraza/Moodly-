'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { envInt } = require('../../../utils/moodly');

/** Lit ?days= (30 par défaut). Renvoie null si la valeur est invalide. */
function parseDays(raw) {
  if (raw === undefined || raw === '') return 30;
  const days = Number(raw);
  const max = envInt('MOOD_RETENTION_DAYS', 90); // inutile de demander plus que ce qu'on garde
  return Number.isInteger(days) && days >= 1 && days <= max ? days : null;
}

const badDays = (ctx) =>
  ctx.badRequest(`days doit être un entier entre 1 et ${envInt('MOOD_RETENTION_DAYS', 90)}`);

module.exports = createCoreController('api::team.team', ({ strapi }) => ({
  /**
   * GET /api/teams/:id/stats?days=30   (réservé au manager de l'équipe, via la policy)
   * → { data: { team, period, minResponses, members, series, summary, tags } }
   */
  async stats(ctx) {
    const days = parseDays(ctx.query.days);
    if (days === null) return badDays(ctx);

    const stats = await strapi.service('api::team.team').stats(ctx.params.id, days);
    if (!stats) return ctx.notFound('Équipe introuvable');

    ctx.body = { data: stats };
  },

  /**
   * GET /api/team/stats?days=30[&team=<documentId>]
   * Même calcul, pour l'équipe du manager connecté, au format attendu par le front :
   * → { team, daily: [{ date, mood, count, weekend, masked, open }], summary: { mood, responseRate, responses }, tags }
   * « mood » vaut null quand il n'y a aucune réponse, quand la journée est masquée
   * (moins de 3 réponses) ou quand c'est aujourd'hui (open: true, journée pas finie).
   */
  async myStats(ctx) {
    const days = parseDays(ctx.query.days);
    if (days === null) return badDays(ctx);

    const profile = await strapi.service('api::profile.profile').forUser(ctx.state.user.id);
    const managed = profile?.managedTeams || [];
    if (managed.length === 0) return ctx.forbidden("Tu ne gères aucune équipe");

    // Un manager peut gérer plusieurs équipes : ?team=<documentId>, sinon la première
    const team = ctx.query.team ? managed.find((t) => t.documentId === ctx.query.team) : managed[0];
    if (!team) return ctx.forbidden("Cette équipe n'est pas la tienne");

    const stats = await strapi.service('api::team.team').stats(team.documentId, days);

    ctx.body = {
      team: stats.team,
      managedTeams: managed,
      minResponses: stats.minResponses,
      daily: stats.series.map((d) => ({
        date: d.day,
        mood: d.average,
        count: d.responses,
        weekend: d.weekend,
        masked: d.masked,
        open: d.open,
      })),
      summary: {
        mood: stats.summary.average,
        responseRate: stats.summary.participationRate,
        responses: stats.summary.responses,
      },
      tags: stats.tags,
    };
  },
}));
