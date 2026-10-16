'use strict';

/**
 * Policy : laisse passer seulement le manager de l'équipe demandée (/teams/:id/...).
 * Si l'équipe n'existe pas ou n'est pas la sienne → 403 Forbidden.
 */
module.exports = async (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;
  if (!user) return false;

  const team = await strapi.documents('api::team.team').findOne({
    documentId: policyContext.params.id,
    fields: ['name'],
    populate: { manager: { fields: ['id'] } },
  });

  return Boolean(team) && team.manager?.id === user.id;
};
