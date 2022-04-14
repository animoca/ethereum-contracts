const {ethers} = require('hardhat');

let forwarderRegistry = undefined;

async function deployForwarderRegistry() {
  if (forwarderRegistry !== undefined) {
    return forwarderRegistry;
  }
  const ForwarderRegistry = await ethers.getContractFactory('ForwarderRegistry');
  forwarderRegistry = await ForwarderRegistry.deploy();
  return forwarderRegistry.deployed();
}

module.exports = {
  deployForwarderRegistry,
};
