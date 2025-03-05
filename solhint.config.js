module.exports = {
  extends: 'solhint:recommended',
  rules: {
    'compiler-version': ['error', '^0.8.0'],
    'max-line-length': ['warn', 150],
    'func-visibility': ['error', {ignoreConstructors: true}],
    'constructor-syntax': 'error',
    'not-rely-on-time': 'off',
    'no-empty-blocks': 'off',
    'no-inline-assembly': 'off',
    'avoid-low-level-calls': 'off',
    'no-complex-fallback': 'off',
    'reason-string': ['error', {maxLength: 31}],
  },
};
