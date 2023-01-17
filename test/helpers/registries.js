const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');

let forwarderRegistry = undefined;

async function deployForwarderRegistry() {
  if (forwarderRegistry === undefined) {
    forwarderRegistry = await deployContract('ForwarderRegistry');
  }
  return forwarderRegistry;
}

async function getForwarderRegistryAddress() {
  return (await deployForwarderRegistry()).address;
}

let operatorFilterRegistry = undefined;

async function deployOperatorFilterRegistry() {
  if (operatorFilterRegistry === undefined) {
    operatorFilterRegistry = await deployContract('OperatorFilterRegistryMock', true);
  }
  return operatorFilterRegistry;
}

async function getOperatorFilterRegistryAddress() {
  return (await deployOperatorFilterRegistry()).address;
}

module.exports = {
  deployForwarderRegistry,
  getForwarderRegistryAddress,
  deployOperatorFilterRegistry,
  getOperatorFilterRegistryAddress,
};
