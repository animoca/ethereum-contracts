const {extendEnvironment} = require('hardhat/config');
const {lazyFunction} = require('hardhat/plugins');

require('@nomiclabs/hardhat-waffle');

extendEnvironment(function (env) {
  env.assert = lazyFunction(() => require('chai').assert);
  env.expect = lazyFunction(() => require('chai').expect);
});
