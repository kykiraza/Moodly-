const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

module.exports = () => ({
  'users-permissions': {
    config: {
      // Moodly : un token JWT simple, gardé par l'app mobile dans SecureStore.
      // Le mode 'refresh' (token court + cookie) est pensé pour le web, pas pour Expo.
      jwtManagement: 'legacy-support',
      jwt: {
        expiresIn: '7d', // au bout de 7 jours, l'API répond 401 → l'app renvoie vers le login
      },
    },
  },
  upload: {
    config: {
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes,
      },
    },
  },
});
