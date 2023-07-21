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

let tokenMetadataResolverPerToken = undefined;

async function deployTokenMetadataResolverPerToken() {
  if (tokenMetadataResolverPerToken === undefined) {
    tokenMetadataResolverPerToken = await deployContract('TokenMetadataResolverPerToken');
  }
  return tokenMetadataResolverPerToken;
}

async function getTokenMetadataResolverPerTokenAddress() {
  return (await deployTokenMetadataResolverPerToken()).address;
}

let tokenMetadataResolverWithBaseURI = undefined;

async function deployTokenMetadataResolverWithBaseURI() {
  if (tokenMetadataResolverWithBaseURI === undefined) {
    tokenMetadataResolverWithBaseURI = await deployContract('TokenMetadataResolverWithBaseURI');
  }
  return tokenMetadataResolverWithBaseURI;
}

async function getTokenMetadataResolverWithBaseURIAddress() {
  return (await deployTokenMetadataResolverWithBaseURI()).address;
}

module.exports = {
  deployForwarderRegistry,
  getForwarderRegistryAddress,

  deployOperatorFilterRegistry,
  getOperatorFilterRegistryAddress,

  deployTokenMetadataResolverPerToken,
  getTokenMetadataResolverPerTokenAddress,

  deployTokenMetadataResolverWithBaseURI,
  getTokenMetadataResolverWithBaseURIAddress,
};
