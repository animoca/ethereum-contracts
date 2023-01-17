const {mergeConfigs} = require('@animoca/ethereum-contract-helpers/src/config');

require('@animoca/ethereum-contract-helpers/hardhat-plugins');

module.exports = mergeConfigs(require('@animoca/ethereum-contract-helpers/hardhat-config'), require('./hardhat-config'));
