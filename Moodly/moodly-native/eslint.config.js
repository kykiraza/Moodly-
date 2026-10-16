// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // « @/… » = dossier src/ (alias déclaré dans jsconfig.json, résolu par Metro)
    rules: { 'import/no-unresolved': ['error', { ignore: ['^@/'] }] },
  },
]);
