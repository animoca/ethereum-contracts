module.exports = {
  mocha: {
    'allow-uncaught': true,
    diff: true,
    extension: ['js'],
    recursive: true,
    reporter: 'spec',
    require: ['hardhat/register'],
    slow: 0,
    spec: 'test/**/*.test.js',
    timeout: 60000,
    ui: 'bdd',
    watch: false,
    'watch-files': ['contracts/**/*.sol', 'test/**/*.js'],
    'watch-ignore': ['node_modules', '.git'],
  },
};
