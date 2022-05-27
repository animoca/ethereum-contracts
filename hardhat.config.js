const merge = require('lodash.merge');

require('./hardhat-plugins');

const config = {
  // ...
};

module.exports = merge(require('./hardhat-config'), config);
