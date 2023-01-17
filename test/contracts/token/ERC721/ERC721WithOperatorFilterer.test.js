const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress, getOperatorFilterRegistryAddress} = require('../../../helpers/registries');
const {behavesLikeERC721} = require('./behaviors/ERC721.behavior');

const config = {
  immutable: {
    name: 'ERC721WithOperatorFiltererMock',
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
        name: 'ERC721WithOperatorFiltererFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721Storage',
          adminProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC721BatchTransferWithOperatorFiltererFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721BatchTransferStorage',
          adminProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC721MintableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721MintableStorage',
          adminProtected: true,
        },
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

runBehaviorTests('ERC721WithOperatorFilterer', config, function (deployFn) {
  const implementation = {
    revertMessages: {
      NonApproved: 'ERC721: non-approved sender',
      SelfApproval: 'ERC721: self-approval',
      SelfApprovalForAll: 'ERC721: self-approval for all',
      BalanceOfAddressZero: 'ERC721: balance of address(0)',
      TransferToAddressZero: 'ERC721: transfer to address(0)',
      MintToAddressZero: 'ERC721: mint to address(0)',
      SafeTransferRejected: 'ERC721: safe transfer rejected',
      NonExistingToken: 'ERC721: non-existing token',
      NonOwnedToken: 'ERC721: non-owned token',
      ExistingToken: 'ERC721: existing token',
      InconsistentArrays: 'ERC721: inconsistent arrays',
    },
    features: {
      WithOperatorFilterer: true,
    },
    interfaces: {
      ERC721: true,
      ERC721BatchTransfer: true,
    },
    methods: {
      'batchTransferFrom(address,address,uint256[])': async function (contract, from, to, ids, signer) {
        return contract.connect(signer).batchTransferFrom(from, to, ids);
      },
    },
    deploy: async function (deployer) {
      const contract = await deployFn();
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      return contract;
    },
    mint: async function (contract, to, id, _value) {
      return contract.mint(to, id);
    },
  };

  behavesLikeERC721(implementation);
});
