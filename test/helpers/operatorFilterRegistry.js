const {deployContract} = require('./contract');

let operatorFilterRegistry = undefined;

async function deployOperatorFilterRegistry() {
  if (operatorFilterRegistry === undefined) {
    operatorFilterRegistry = await deployContract('OperatorFilterRegistryMock', true);
  }
  return operatorFilterRegistry;
}

module.exports = {
  deployOperatorFilterRegistry,
};
