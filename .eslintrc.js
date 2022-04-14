module.exports = {
  extends: ['plugin:mocha/recommended', 'plugin:prettier/recommended', 'prettier'],
  env: {
    node: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 9,
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
    'no-unused-vars': 'off',
    'no-multi-spaces': ['error', {exceptions: {VariableDeclarator: true}}],
    'no-else-return': ['error', {allowElseIf: true}],
    'max-params': ['error', 6],
    'no-await-in-loop': 'off',
    'max-len': ['error', {code: 150}],
    'mocha/no-exports': 'off',
    'mocha/no-top-level-hooks': 'off',
    'mocha/no-setup-in-describe': 'off',
    'mocha/no-hooks-for-single-case': 'off',
  },
};
