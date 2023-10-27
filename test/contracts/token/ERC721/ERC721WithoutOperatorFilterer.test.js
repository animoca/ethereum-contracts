const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');
const {behavesLikeERC721} = require('./behaviors/ERC721.behavior');

const config = {
  immutable: {
    name: 'ERC721WithoutOperatorFiltererMock',
    ctorArguments: ['forwarderRegistry'],
    testMsgData: true,
  },
  proxied: {
    name: 'ERC721WithoutOperatorFiltererProxiedMock',
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
        name: 'ERC721FacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721Storage',
          adminProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC721BatchTransferFacetMock',
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
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
  },
};

runBehaviorTests('ERC721WithoutOperatorFilterer', config, function (deployFn) {
  const implementation = {
    errors: {
      // ERC721
      SelfApproval: {custom: true, error: 'ERC721SelfApproval', args: ['account']},
      SelfApprovalForAll: {custom: true, error: 'ERC721SelfApprovalForAll', args: ['account']},
      NonApprovedForApproval: {custom: true, error: 'ERC721NonApprovedForApproval', args: ['sender', 'owner', 'tokenId']},
      TransferToAddressZero: {custom: true, error: 'ERC721TransferToAddressZero'},
      NonExistingToken: {custom: true, error: 'ERC721NonExistingToken', args: ['tokenId']},
      NonApprovedForTransfer: {custom: true, error: 'ERC721NonApprovedForTransfer', args: ['sender', 'owner', 'tokenId']},
      NonOwnedToken: {custom: true, error: 'ERC721NonOwnedToken', args: ['account', 'tokenId']},
      SafeTransferRejected: {custom: true, error: 'ERC721SafeTransferRejected', args: ['recipient', 'tokenId']},
      BalanceOfAddressZero: {custom: true, error: 'ERC721BalanceOfAddressZero'},

      // Misc
      InconsistentArrayLengths: {custom: true, error: 'InconsistentArrayLengths'},
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
    tokenMetadata: async function (contract, id) {
      return contract.tokenURI(id);
    },
  };

  behavesLikeERC721(implementation);
});
