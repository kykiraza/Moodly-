'use strict';

// Permission « api::profile.profile.me » donnée aux rôles Employee et Manager (src/bootstrap/permissions.js)
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/profile',
      handler: 'profile.me',
    },
  ],
};
