const {ethers} = require('hardhat');
const {deployContract} = require('./contract');

let forwarderRegistry = undefined;

async function deployForwarderRegistry() {
  if (forwarderRegistry === undefined) {
    forwarderRegistry = await deployContract('ForwarderRegistry');
  }
  return forwarderRegistry;
}

module.exports = {
  deployForwarderRegistry,
};
