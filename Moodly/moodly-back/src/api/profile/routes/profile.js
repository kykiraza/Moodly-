'use strict';

// Permission « api::profile.profile.me » donnée aux rôles Employee et Manager (src/bootstrap/permissions.js)
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/profile',
      handler: 'profile.me',
      config: {
        policies: ['global::agency-match'], // l'en-tête X-Agency-Id doit correspondre à l'agence du compte
      },
    },
  ],
};
