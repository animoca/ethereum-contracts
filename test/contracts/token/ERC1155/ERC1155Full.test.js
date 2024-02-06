const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress, getTokenMetadataResolverWithBaseURIAddress} = require('../../../helpers/registries');
const {behavesLikeERC1155} = require('./behaviors/ERC1155.behavior');

const name = 'ERC1155Full';
const symbol = 'ERC1155Full';

const config = {
  immutable: {
    name: 'ERC1155FullMock',
    ctorArguments: ['name', 'symbol', 'metadataResolver', 'forwarderRegistry'],
    testMsgData: true,
  },
  proxied: {
    name: 'ERC1155FullProxiedMock',
    ctorArguments: ['forwarderRegistry'],
    init: {method: 'init', arguments: ['name', 'symbol', 'metadataResolver']},
    testMsgData: true,
  },
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {name: 'InterfaceDetectionFacet'},
      {name: 'ForwarderRegistryContextFacet', ctorArguments: ['forwarderRegistry']},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {name: 'TokenRecoveryFacet', ctorArguments: ['forwarderRegistry']},
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
        name: 'ERC1155MetadataFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC1155MetadataStorage',
          arguments: ['name', 'symbol', 'metadataResolver'],
          adminProtected: true,
          phaseProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC1155MintableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC1155MintableStorage',
          adminProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC1155DeliverableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC1155DeliverableStorage',
          adminProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC2981FacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC2981', adminProtected: true},
        testMsgData: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    metadataResolver: getTokenMetadataResolverWithBaseURIAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
    name,
    symbol,
  },
};

runBehaviorTests('ERC1155Full', config, function (deployFn) {
  const implementation = {
    name,
    symbol,
    errors: {
      // ERC1155
      SelfApprovalForAll: {custom: true, error: 'ERC1155SelfApprovalForAll', args: ['account']},
      TransferToAddressZero: {custom: true, error: 'ERC1155TransferToAddressZero'},
      NonApproved: {custom: true, error: 'ERC1155NonApproved', args: ['sender', 'owner']},
      InsufficientBalance: {custom: true, error: 'ERC1155InsufficientBalance', args: ['owner', 'id', 'balance', 'value']},
      BalanceOverflow: {custom: true, error: 'ERC1155BalanceOverflow', args: ['recipient', 'id', 'balance', 'value']},
      SafeTransferRejected: {custom: true, error: 'ERC1155SafeTransferRejected', args: ['recipient', 'id', 'value']},
      SafeBatchTransferRejected: {custom: true, error: 'ERC1155SafeBatchTransferRejected', args: ['recipient', 'ids', 'values']},
      BalanceOfAddressZero: {custom: true, error: 'ERC1155BalanceOfAddressZero'},

      // ERC1155Mintable
      MintToAddressZero: {custom: true, error: 'ERC1155MintToAddressZero'},

      // ERC2981
      IncorrectRoyaltyReceiver: {custom: true, error: 'ERC2981IncorrectRoyaltyReceiver'},
      IncorrectRoyaltyPercentage: {custom: true, error: 'ERC2981IncorrectRoyaltyPercentage', args: ['percentage']},

      // Misc
      InconsistentArrayLengths: {custom: true, error: 'InconsistentArrayLengths'},
      NotMinter: {custom: true, error: 'NotRoleHolder', args: ['role', 'account']},
      NotContractOwner: {custom: true, error: 'NotContractOwner', args: ['account']},
    },
    features: {
      NameSymbolMetadata: true,
      MetadataResolver: true,
    },
    interfaces: {
      ERC1155: true,
      ERC1155Mintable: true,
      ERC1155Deliverable: true,
      ERC1155MetadataURI: true,
      ERC2981: true,
    },
    methods: {
      'safeMint(address,uint256,uint256,bytes)': async function (contract, to, id, value, data, signer) {
        return contract.connect(signer).safeMint(to, id, value, data);
      },
      'safeBatchMint(address,uint256[],uint256[],bytes)': async function (contract, to, ids, values, data, signer) {
        return contract.connect(signer).safeBatchMint(to, ids, values, data);
      },
    },
    deploy: async function (deployer, args = {}) {
      const contract = await deployFn({name, symbol, ...args});
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      return contract;
    },
    mint: async function (contract, to, id, value) {
      return contract.safeMint(to, id, value, '0x');
    },
    tokenMetadata: async function (contract, id) {
      return contract.tokenURI(id);
    },
  };

  behavesLikeERC1155(implementation);
});
