const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');
const {behavesLikeERC1155} = require('./behaviors/ERC1155.behavior');

const config = {
  immutable: {
    name: 'ERC1155WithoutOperatorFiltererMock',
    ctorArguments: ['forwarderRegistry'],
    testMsgData: true,
  },
  proxied: {
    name: 'ERC1155WithoutOperatorFiltererProxiedMock',
    ctorArguments: ['forwarderRegistry'],
    init: {method: 'init'},
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
        name: 'ERC1155MintableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC1155MintableStorage',
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

runBehaviorTests('ERC1155WithoutOperatorFilterer', config, function (deployFn) {
  const implementation = {
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

      // Misc
      InconsistentArrayLengths: {custom: true, error: 'InconsistentArrayLengths'},
    },
    interfaces: {
      ERC1155: true,
    },
    deploy: async function (deployer, args = {}) {
      const contract = await deployFn(args);
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      return contract;
    },
    mint: async function (contract, to, id, value) {
      return contract.safeMint(to, id, value, '0x');
    },
  };

  behavesLikeERC1155(implementation);
});
