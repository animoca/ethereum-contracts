const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress, getOperatorFilterRegistryAddress} = require('../../../helpers/registries');
const {behavesLikeERC1155} = require('./behaviors/ERC1155.behavior');

const config = {
  immutable: {
    name: 'ERC1155WithOperatorFiltererMock',
    ctorArguments: ['operatorFilterRegistry', 'forwarderRegistry'],
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
        name: 'OperatorFiltererFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'init',
          arguments: ['operatorFilterRegistry'],
          adminProtected: true,
          phaseProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC1155WithOperatorFiltererFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC1155Storage', adminProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC1155MintableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC1155MintableStorage', adminProtected: true},
        testMsgData: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    operatorFilterRegistry: getOperatorFilterRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
  },
};

runBehaviorTests('ERC1155WithOperatorFilterer', config, function (deployFn) {
  const implementation = {
    revertMessages: {
      NonApproved: 'ERC1155: non-approved sender',
      SelfApprovalForAll: 'ERC1155: self-approval for all',
      BalanceOfAddressZero: 'ERC1155: balance of address(0)',
      TransferToAddressZero: 'ERC1155: transfer to address(0)',
      InsufficientBalance: 'ERC1155: insufficient balance',
      BalanceOverflow: 'ERC1155: balance overflow',
      MintToAddressZero: 'ERC1155: mint to address(0)',
      TransferRejected: 'ERC1155: transfer rejected',
      NonExistingToken: 'ERC1155: non-existing token',
      NonOwnedToken: 'ERC1155: non-owned token',
      ExistingToken: 'ERC1155: existing token',
      InconsistentArrays: 'ERC1155: inconsistent arrays',
    },
    features: {
      WithOperatorFilterer: true,
    },
    interfaces: {
      ERC1155: true,
    },
    methods: {
      // 'safeMint(address,uint256,uint256,bytes)': async function (contract, to, id, value, data, signer) {
      //   return contract.connect(signer).safeMint(to, id, value, data);
      // },
      // 'safeBatchMint(address,uint256[],uint256[],bytes)': async function (contract, to, ids, values, data, signer) {
      //   return contract.connect(signer).safeBatchMint(to, ids, values, data);
      // },
      // 'burnFrom(address,uint256,uint256)': async function (contract, from, id, value, signer) {
      //   return contract.connect(signer).burnFrom(from, id, value);
      // },
      // 'batchBurnFrom(address,uint256[],uint256[])': async function (contract, from, ids, values, signer) {
      //   return contract.connect(signer).batchBurnFrom(from, ids, values);
      // },
    },
    deploy: async function (deployer) {
      const contract = await deployFn();
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      return contract;
    },
    mint: async function (contract, to, id, value) {
      return contract.safeMint(to, id, value, '0x');
    },
  };

  behavesLikeERC1155(implementation);
});
