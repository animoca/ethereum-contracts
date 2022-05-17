const {ethers} = require('hardhat');

let forwarderRegistry = undefined;

async function deployForwarderRegistry() {
  if (forwarderRegistry === undefined) {
    const ForwarderRegistry = await ethers.getContractFactory('ForwarderRegistry');
    forwarderRegistry = await ForwarderRegistry.deploy();
    await forwarderRegistry.deployed();
  }
  return forwarderRegistry;
}

module.exports = {
  deployForwarderRegistry,
};
