'use strict';

/**
 * Vérification des jetons « Se connecter avec Google / Apple / Microsoft ».
 *
 * L'app obtient un « ID token » (un JWT signé par le fournisseur) et nous l'envoie.
 * On ne le croit PAS sur parole : on vérifie
 *   1. la signature, avec les clés publiques officielles du fournisseur (JWKS) ;
 *   2. l'émetteur (iss) : c'est bien Google / Apple / Microsoft ;
 *   3. le destinataire (aud) : le jeton a été créé pour NOTRE app (nos identifiants client) ;
 *   4. la date d'expiration ;
 *   5. que l'email a été vérifié par le fournisseur.
 *
 * Les identifiants client se mettent dans .env (voir .env.example et le guide de l'app).
 */

const { createRemoteJWKSet, jwtVerify } = require('jose');

// Liste "a,b,c" du .env → ['a', 'b', 'c']
const list = (name) =>
  (process.env[name] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const PROVIDERS = {
  google: {
    label: 'Google',
    jwks: 'https://www.googleapis.com/oauth2/v3/certs',
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: () => list('GOOGLE_CLIENT_IDS'), // IDs client iOS, Android et web
    email: (p) => (p.email_verified === true ? p.email : null),
  },
  apple: {
    label: 'Apple',
    jwks: 'https://appleid.apple.com/auth/keys',
    issuer: 'https://appleid.apple.com',
    audience: () => list('APPLE_CLIENT_IDS'), // le bundle ID de l'app (fr.moodly.app)
    // Apple met email_verified en booléen ou en texte "true" selon les cas
    email: (p) => (p.email_verified === true || p.email_verified === 'true' ? p.email : null),
  },
  microsoft: {
    label: 'Microsoft',
    jwks: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
    // L'émetteur dépend de l'organisation (tenant) : vérifié à la main plus bas
    issuer: null,
    audience: () => list('MICROSOFT_CLIENT_ID'),
    email: (p) => p.email || p.preferred_username || null,
  },
};

// Les clés publiques sont téléchargées une fois puis gardées en cache par jose
const keySets = {};
const keySet = (name) => (keySets[name] ??= createRemoteJWKSet(new URL(PROVIDERS[name].jwks)));

class SocialError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = () => ({
  PROVIDERS: Object.keys(PROVIDERS),

  /**
   * Vérifie un ID token et renvoie { email, name } — lance une SocialError sinon.
   * @param {'google'|'apple'|'microsoft'} provider
   * @param {string} idToken
   */
  async verify(provider, idToken) {
    const conf = PROVIDERS[provider];
    if (!conf) throw new SocialError(400, 'Fournisseur inconnu');

    const audience = conf.audience();
    if (audience.length === 0) {
      throw new SocialError(503, `La connexion ${conf.label} n'est pas encore configurée sur le serveur`);
    }

    let payload;
    try {
      ({ payload } = await jwtVerify(idToken, keySet(provider), {
        audience,
        ...(conf.issuer ? { issuer: conf.issuer } : {}),
      }));
    } catch {
      throw new SocialError(401, `Connexion ${conf.label} refusée (jeton invalide ou expiré)`);
    }

    // Microsoft : l'émetteur doit être https://login.microsoftonline.com/<tenant>/v2.0
    if (provider === 'microsoft' && payload.iss !== `https://login.microsoftonline.com/${payload.tid}/v2.0`) {
      throw new SocialError(401, 'Connexion Microsoft refusée (émetteur inconnu)');
    }

    const email = conf.email(payload);
    if (typeof email !== 'string' || !email.includes('@')) {
      throw new SocialError(401, `Ton compte ${conf.label} ne fournit pas d'email vérifié`);
    }

    return { email: email.trim().toLowerCase(), name: typeof payload.name === 'string' ? payload.name : null };
  },

  SocialError,
});
