'use strict';

/**
 * Calcul des statistiques d'équipe pour le manager.
 *
 * RÈGLES D'ANONYMAT (RGPD) :
 * 1. Un jour avec moins de MOOD_MIN_RESPONSES réponses (3 par défaut) est « masqué » :
 *    sa moyenne vaut null.
 * 2. Les réponses des jours masqués sont AUSSI exclues de la moyenne globale et des tags.
 *    Sinon on pourrait les retrouver par soustraction : (total sur 30 jours aujourd'hui)
 *    − (total sur 30 jours hier) = les réponses d'un seul jour.
 * 3. Seul le NOMBRE de réponses (la participation) inclut tous les jours :
 *    il ne dit rien du moral de qui que ce soit.
 */

const { createCoreService } = require('@strapi/strapi').factories;
const { today, addDays, isWeekend, envInt, round1 } = require('../../../utils/moodly');

const average = (scores) =>
  scores.length ? round1(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;

module.exports = createCoreService('api::team.team', ({ strapi }) => ({
  /**
   * @param {string} teamDocumentId
   * @param {number} days  nombre de jours (aujourd'hui inclus)
   * @returns {Promise<null | object>}  null si l'équipe n'existe pas
   */
  async stats(teamDocumentId, days) {
    const minResponses = envInt('MOOD_MIN_RESPONSES', 3);
    const to = today();
    const from = addDays(to, -(days - 1));

    const team = await strapi.documents('api::team.team').findOne({
      documentId: teamDocumentId,
      fields: ['name'],
      populate: { members: { fields: ['id'], filters: { blocked: false } } },
    });
    if (!team) return null;

    // Uniquement les colonnes utiles : jour, note, tags (jamais dailyKey)
    const moods = await strapi.documents('api::mood.mood').findMany({
      filters: { team: { documentId: teamDocumentId }, day: { $gte: from, $lte: to } },
      fields: ['day', 'score'],
      populate: { tags: { fields: ['slug', 'label', 'emoji'] } },
    });

    // Regrouper les saisies par jour
    const byDay = new Map();
    for (const mood of moods) {
      if (!byDay.has(mood.day)) byDay.set(mood.day, []);
      byDay.get(mood.day).push(mood);
    }

    const series = [];
    const visibleScores = []; // notes des jours NON masqués
    const tagCounts = new Map(); // tags des jours NON masqués
    let weekdayResponses = 0;
    let weekdays = 0;
    let maskedDays = 0;

    for (let i = 0; i < days; i++) {
      const day = addDays(from, i);
      const dayMoods = byDay.get(day) || [];
      const weekend = isWeekend(day);
      const responses = dayMoods.length;
      const masked = responses > 0 && responses < minResponses;

      if (!weekend) {
        weekdays += 1;
        weekdayResponses += responses;
      }
      if (masked) maskedDays += 1;

      if (responses >= minResponses) {
        for (const mood of dayMoods) {
          visibleScores.push(mood.score);
          for (const tag of mood.tags || []) {
            const entry = tagCounts.get(tag.slug) || { slug: tag.slug, label: tag.label, emoji: tag.emoji ?? null, count: 0 };
            entry.count += 1;
            tagCounts.set(tag.slug, entry);
          }
        }
      }

      series.push({
        day,
        weekend,
        responses,
        average: responses >= minResponses ? average(dayMoods.map((mood) => mood.score)) : null,
        masked,
      });
    }

    const members = team.members.length;
    const expected = members * weekdays; // réponses attendues les jours ouvrés

    return {
      team: { documentId: team.documentId, name: team.name },
      period: { from, to, days },
      minResponses,
      members,
      series,
      summary: {
        responses: moods.length,
        average: average(visibleScores),
        // Taux de participation sur les jours ouvrés, en % (0 à 100)
        participationRate: expected > 0 ? Math.min(100, Math.round((weekdayResponses / expected) * 100)) : null,
        maskedDays,
      },
      tags: [...tagCounts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    };
  },
}));
