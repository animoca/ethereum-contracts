const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');

let forwarderRegistry = undefined;

async function deployForwarderRegistry() {
  if (forwarderRegistry === undefined) {
    forwarderRegistry = await deployContract('ForwarderRegistry');
  }
  return forwarderRegistry;
}

async function getForwarderRegistryAddress() {
  return (await deployForwarderRegistry()).getAddress();
}

let tokenMetadataResolverPerToken = undefined;

async function deployTokenMetadataResolverPerToken() {
  if (tokenMetadataResolverPerToken === undefined) {
    tokenMetadataResolverPerToken = await deployContract('TokenMetadataResolverPerToken');
  }
  return tokenMetadataResolverPerToken;
}

async function getTokenMetadataResolverPerTokenAddress() {
  return (await deployTokenMetadataResolverPerToken()).getAddress();
}

let tokenMetadataResolverWithBaseURI = undefined;

async function deployTokenMetadataResolverWithBaseURI() {
  if (tokenMetadataResolverWithBaseURI === undefined) {
    tokenMetadataResolverWithBaseURI = await deployContract('TokenMetadataResolverWithBaseURI');
  }
  return tokenMetadataResolverWithBaseURI;
}

async function getTokenMetadataResolverWithBaseURIAddress() {
  return (await deployTokenMetadataResolverWithBaseURI()).getAddress();
}

module.exports = {
  deployForwarderRegistry,
  getForwarderRegistryAddress,

  deployTokenMetadataResolverPerToken,
  getTokenMetadataResolverPerTokenAddress,

  deployTokenMetadataResolverWithBaseURI,
  getTokenMetadataResolverWithBaseURIAddress,
};
