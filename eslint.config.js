const globals = require('globals');

module.exports = [
  require('eslint-plugin-prettier/recommended'),
  require('eslint-plugin-mocha').configs.flat.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
      'no-multi-spaces': ['error', {exceptions: {VariableDeclarator: true}}],
      'no-else-return': ['error', {allowElseIf: true}],
      'max-params': ['error', 6],
      'no-await-in-loop': 'off',
      'max-len': ['error', {code: 150}],
      'mocha/no-identical-title': 'error',
      'mocha/no-mocha-arrows': 'off',
      'mocha/no-setup-in-describe': 'off',
      'mocha/no-return-from-async': 'off',
      'mocha/no-exports': 'off',
      'mocha/no-top-level-hooks': 'off',
      'mocha/no-hooks-for-single-case': 'off',
    },
    ignores: ['node_modules/*', 'artifacts*/**', 'cache*/**', 'imports/*', 'coverage*/**', 'flattened/*'],
  },
];
