'use strict';

/**
 * Connexion et inscription au format attendu par l'app (session = { jwt, agencyId, user }).
 *
 * POST /api/auth/login     { agencyId, email, password }        → 200 + session
 * POST /api/auth/register  { agencyId, name, email, password }  → 201 + session
 *
 * La route Strapi standard POST /api/auth/local existe toujours, mais elle ne
 * vérifie pas l'agence et ne renvoie pas le rôle Moodly.
 */

// Empreinte bcrypt « bidon » : quand l'email n'existe pas, on vérifie quand même un
// mot de passe pour que la réponse prenne le même temps → on ne peut pas deviner
// quels emails existent en chronométrant le serveur.
const DUMMY_HASH = '$2a$10$gOnHI13xuIDi0fDou4SU4ujntOF4iyuEFfApn0QvTEHiQDA.gpY8y';

const BAD_CREDENTIALS = 'Email, mot de passe ou ID agence incorrect';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** La « session » renvoyée à l'app après login ou inscription. */
async function buildSession(strapi, userId) {
  const profile = await strapi.service('api::profile.profile').forUser(userId);
  const token = await strapi.plugin('users-permissions').service('jwt').issue({ id: userId });

  return {
    jwt: token,
    token, // même valeur, nom utilisé par l'ancien front Expo
    agencyId: profile.agency.code,
    role: profile.role,
    name: profile.name,
    user: {
      id: profile.documentId,
      email: profile.email,
      username: profile.name,
      role: profile.role,
    },
  };
}

module.exports = ({ strapi }) => ({
  async login(ctx) {
    // email déjà nettoyé (trim + minuscules) par le middleware normalize-email
    const { email, password, agencyId } = ctx.request.body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return ctx.badRequest('email et password sont obligatoires');
    }
    if (typeof agencyId !== 'string' || !agencyId.trim()) {
      return ctx.badRequest('agencyId est obligatoire (ex. AG-0001)');
    }

    const user = await strapi.documents('plugin::users-permissions.user').findFirst({
      filters: { provider: 'local', email },
      fields: ['password', 'blocked', 'confirmed'],
      populate: { agency: { fields: ['code'] } },
    });

    const passwordOk = await strapi
      .plugin('users-permissions')
      .service('user')
      .validatePassword(password, user?.password || DUMMY_HASH);

    // Même message si l'email est inconnu, le mot de passe faux ou l'agence différente
    const sameAgency = user?.agency?.code === agencyId.trim().toUpperCase();
    if (!user || !user.password || !passwordOk || !sameAgency) {
      return ctx.unauthorized(BAD_CREDENTIALS);
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

    ctx.body = await buildSession(strapi, user.id);
  },

  /**
   * Inscription d'un salarié avec le code de son agence.
   * Le compte est créé avec le rôle Employee, dans l'équipe de l'agence.
   * (On ne peut pas s'inscrire comme manager : ça se fait dans l'admin.)
   */
  async register(ctx) {
    const { agencyId, name, email, password } = ctx.request.body || {};

    // 1) Valider les champs
    const cleanName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
    if (cleanName.length < 2 || cleanName.length > 50) {
      return ctx.badRequest('Le nom doit faire entre 2 et 50 caractères');
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return ctx.badRequest('Email invalide');
    }
    // bcrypt ne prend en compte que les 72 premiers octets d'un mot de passe
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) {
      return ctx.badRequest('Le mot de passe doit faire au moins 8 caractères');
    }

    // 2) L'agence doit exister, et avoir une équipe
    const agency = await strapi.service('api::agency.agency').findByCode(agencyId);
    if (!agency) {
      return ctx.badRequest('ID agence inconnu');
    }
    const team = await strapi.documents('api::team.team').findFirst({
      filters: { agency: { documentId: agency.documentId } },
      fields: ['name'],
      sort: 'id:asc',
    });
    if (!team) {
      return ctx.badRequest("Cette agence n'a pas encore d'équipe");
    }

    // 3) Email unique
    const users = strapi.documents('plugin::users-permissions.user');
    if (await users.findFirst({ filters: { email }, fields: ['id'] })) {
      return ctx.conflict('Un compte existe déjà avec cet email');
    }

    // 4) Le nom d'utilisateur doit être unique dans Strapi : "Camille Durand", "Camille Durand 2"...
    let username = cleanName;
    for (let n = 2; await users.findFirst({ filters: { username }, fields: ['id'] }); n++) {
      username = `${cleanName} ${n}`;
    }

    const employeeRole = await strapi.documents('plugin::users-permissions.role').findFirst({
      filters: { type: 'employee' },
    });

    // 5) Créer le compte (le Document Service chiffre le mot de passe tout seul)
    const user = await users.create({
      data: {
        username,
        email,
        password,
        provider: 'local',
        confirmed: true,
        blocked: false,
        role: employeeRole.documentId,
        agency: agency.documentId,
        team: team.documentId,
      },
    });

    ctx.status = 201;
    ctx.body = await buildSession(strapi, user.id);
  },
});
