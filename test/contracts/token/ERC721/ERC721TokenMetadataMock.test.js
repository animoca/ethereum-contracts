const {behavesLikeERC721TokenMetadata} = require('./behaviors/ERC721.tokenmetadata.behavior');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');

const name = 'ERC721TokenMetadataMock';
const symbol = 'ERC721TokenMetadataMock';

const config = {
  immutable: {
    name: 'ERC721TokenMetadataMock',
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
        name: 'ERC721TokenMetadataFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721MetadataStorage',
          arguments: ['name', 'symbol'],
          adminProtected: true,
          versionProtected: true,
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
      NonExistingNFT: 'ERC721: non-existing NFT',
      NonOwnedNFT: 'ERC721: non-owned NFT',
      InconsistentArrays: 'ERC721: inconsistent arrays',
      // Admin
      NotContractOwner: 'Ownership: not the owner',
    },
    features: {},
    interfaces: {
      ERC721: true,
      ERC721Mintable: true,
      ERC721Metadata: true,
    },
    methods: {},
    deploy: async function (deployer) {
      const contract = await deployFn({name, symbol});
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      return contract;
    },
    mint: async function (contract, to, id, _value, signer) {
      return contract.connect(signer).safeMint(to, id, '0x');
    },
  };

  behavesLikeERC721TokenMetadata(implementation);
});