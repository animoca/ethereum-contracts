const {behavesLikeERC1155MetadataURI} = require('./behaviors/ERC1155.metadatauri.behavior');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');

const config = {
  immutable: {
    name: 'ERC1155MetadataPerTokenMock',
    ctorArguments: ['forwarderRegistry'],
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
      {
        name: 'ERC1155FacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC1155Storage',
          adminProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC1155MetadataURIPerTokenFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC1155MetadataURIStorage',
          adminProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC1155MintableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC1155MintableStorage',
          arguments: [],
          adminProtected: true,
        },
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
      // NonApproved: 'ERC1155: non-approved sender',
      // SelfApprovalForAll: 'ERC1155: self-approval for all',
      // BalanceOfAddressZero: 'ERC1155: balance of address(0)',
      // TransferToAddressZero: 'ERC1155: transfer to address(0)',
      // InsufficientBalance: 'ERC1155: insufficient balance',
      // BalanceOverflow: 'ERC1155: balance overflow',
      // MintToAddressZero: 'ERC1155: mint to address(0)',
      // TransferRejected: 'ERC1155: transfer rejected',
      // NonExistingToken: 'ERC1155: non-existing token',
      // NonOwnedToken: 'ERC1155: non-owned token',
      // ExistingToken: 'ERC1155: existing token',
      // InconsistentArrays: 'ERC1155: inconsistent arrays',
      MetadataInconsistentArrays: 'Metadata: inconsistent arrays',

      // Admin
      // NotMinter: "AccessControl: missing 'minter' role",
      NotContractOwner: 'Ownership: not the owner',
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
