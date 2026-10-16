'use strict';

/**
 * POST /api/auth/login  { email, password }  →  { token, role, name }
 *
 * C'est le format attendu par le front (src/services/types.ts → LoginResponse).
 * La route Strapi standard POST /api/auth/local fonctionne aussi, mais renvoie
 * { jwt, user } sans le rôle : le front devrait alors faire un 2e appel.
 */

// Empreinte bcrypt « bidon » : quand l'email n'existe pas, on vérifie quand même un
// mot de passe pour que la réponse prenne le même temps → on ne peut pas deviner
// quels emails existent en chronométrant le serveur.
const DUMMY_HASH = '$2a$10$gOnHI13xuIDi0fDou4SU4ujntOF4iyuEFfApn0QvTEHiQDA.gpY8y';

module.exports = ({ strapi }) => ({
  async login(ctx) {
    const { email, password } = ctx.request.body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return ctx.badRequest('email et password sont obligatoires');
    }

    const usersPermissions = strapi.plugin('users-permissions');

    const user = await strapi.documents('plugin::users-permissions.user').findFirst({
      filters: { provider: 'local', email: email.trim().toLowerCase() },
      fields: ['password', 'blocked', 'confirmed'],
    });

    const passwordOk = await usersPermissions
      .service('user')
      .validatePassword(password, user?.password || DUMMY_HASH);

    // Même message que l'email soit inconnu ou le mot de passe faux (ne rien révéler)
    if (!user || !user.password || !passwordOk) {
      return ctx.unauthorized('Email ou mot de passe incorrect');
    }

    if (user.blocked) {
      return ctx.forbidden('Ce compte est bloqué');
    }

    // Si l'admin a activé la confirmation d'email dans les réglages users-permissions
    const advanced = await strapi.store({ type: 'plugin', name: 'users-permissions' }).get({ key: 'advanced' });
    if (advanced?.email_confirmation && !user.confirmed) {
      return ctx.forbidden("Ce compte n'est pas encore confirmé");
    }

    const profile = await strapi.service('api::profile.profile').forUser(user.id);
    if (!profile.role) {
      return ctx.forbidden("Ce compte n'a pas de rôle Moodly (Employee ou Manager)");
    }

    // Même token que celui de /api/auth/local : il marche sur toutes les routes protégées
    const token = await usersPermissions.service('jwt').issue({ id: user.id });

    ctx.body = { token, role: profile.role, name: profile.name };
  },
});
