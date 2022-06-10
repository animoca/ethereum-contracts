const {behavesLikeERC721Metadata} = require('./behaviors/ERC721.metadata.behavior');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');

const name = 'ERC721MetadataPerTokenMock';
const symbol = 'ERC721MetadataPerTokenMock';

const config = {
  immutable: {
    name: 'ERC721MetadataPerTokenMock',
    ctorArguments: ['name', 'symbol', 'forwarderRegistry'],
    metaTxSupport: true,
  },
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {name: 'InterfaceDetectionFacet'},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {name: 'AccessControlFacet', ctorArguments: ['forwarderRegistry']},
      {name: 'ERC721Facet', ctorArguments: ['forwarderRegistry'], init: {method: 'initERC721Storage'}},
      {name: 'ERC721MintableFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initERC721MintableStorage'}},
      {
        name: 'ERC721MetadataPerTokenFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721MetadataStorage',
          arguments: ['name', 'symbol'],
          adminProtected: true,
          phaseProtected: true,
        },
        metaTxSupport: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
    name,
    symbol,
  },
};

runBehaviorTests('TokenMetadata ERC721', config, function (deployFn) {
  const implementation = {
    contractName: name,
    nfMaskLength: 32,
    name,
    symbol,
    revertMessages: {
      NonExistingNFT: 'ERC721: non-existing token',
      NonOwnedNFT: 'ERC721: non-owned token',
      InconsistentArrays: 'ERC721: inconsistent arrays',
      MetadataInconsistentArrays: 'Metadata: inconsistent arrays',
      // Admin
      NotContractOwner: 'Ownership: not the owner',
    },
    features: {},
    interfaces: {
      ERC721Metadata: true,
    },
    methods: {},
    deploy: async function (deployer) {
      const contract = await deployFn({name, symbol});
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      return contract;
    },
    mint: async function (contract, to, id, _value) {
      return contract.mint(to, id);
    },
  };

  behavesLikeERC721Metadata(implementation);
});
