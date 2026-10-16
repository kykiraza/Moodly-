module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    // L'app (navigateur, Android, iOS) envoie l'en-tête X-Agency-Id : il faut l'autoriser
    name: 'strapi::cors',
    config: {
      origin: ['*'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Agency-Id'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
