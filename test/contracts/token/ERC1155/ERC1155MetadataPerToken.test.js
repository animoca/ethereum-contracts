const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');
const {behavesLikeERC1155MetadataURI} = require('./behaviors/ERC1155.metadatauri.behavior');

const config = {
  immutable: {
    name: 'ERC1155MetadataURIPerTokenMock',
    ctorArguments: ['forwarderRegistry'],
    testMsgData: true,
  },
  proxied: {
    name: 'ERC1155MetadataURIPerTokenProxiedMock',
    ctorArguments: ['forwarderRegistry'],
    init: {method: 'init'},
    testMsgData: true,
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
      {name: 'ERC1155FacetMock', ctorArguments: ['forwarderRegistry'], init: {method: 'initERC1155Storage'}},
      {name: 'ERC1155MintableFacetMock', ctorArguments: ['forwarderRegistry'], init: {method: 'initERC1155MintableStorage'}},
      {
        name: 'ERC1155MetadataURIPerTokenFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC1155MetadataURIStorage', adminProtected: true},
        testMsgData: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
  },
};

runBehaviorTests('ERC1155MetadataPerToken', config, function (deployFn) {
  const implementation = {
    revertMessages: {
      MetadataInconsistentArrays: 'Metadata: inconsistent arrays',

      // Admin
      NotMinter: "AccessControl: missing 'minter' role",
    },
    features: {
      MetadataPerToken: true,
    },
    interfaces: {
      ERC1155MetadataURI: true,
    },
    methods: {},
    deploy: async function (deployer) {
      const contract = await deployFn();
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      return contract;
    },
    mint: async function (contract, to, id, value) {
      return contract.safeMint(to, id, value, '0x');
    },
    tokenMetadata: async function (contract, id) {
      return contract.uri(id);
    },
  };

  behavesLikeERC1155MetadataURI(implementation);
});
