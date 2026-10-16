'use strict';

/**
 * Policy globale « global::agency-match ».
 *
 * L'app envoie l'ID de son agence dans l'en-tête X-Agency-Id à chaque appel.
 * On vérifie qu'il correspond bien à l'agence de l'utilisateur connecté (lue EN BASE).
 * Sinon → 403 : un token d'une agence ne peut pas servir dans une autre.
 */
module.exports = async (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;
  if (!user) return false;

  const header = policyContext.request.header['x-agency-id'];
  if (typeof header !== 'string' || !header.trim()) return false;

  const profile = await strapi.service('api::profile.profile').forUser(user.id);
  return Boolean(profile?.agency) && profile.agency.code === header.trim().toUpperCase();
};
