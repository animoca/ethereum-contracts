const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');
const {behavesLikeERC1155} = require('./behaviors/ERC1155.behavior');

const baseMetadataURI = 'uri';

const config = {
  immutable: {
    name: 'ERC1155BurnableMock',
    ctorArguments: ['forwarderRegistry'],
    testMsgData: true,
  },
  proxied: {
    name: 'ERC1155BurnableProxiedMock',
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
      {
        name: 'ERC1155FacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC1155Storage', adminProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC1155MetadataURIWithBaseURIFacetMock',
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
        init: {method: 'initERC1155MintableStorage', adminProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC1155DeliverableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC1155DeliverableStorage', adminProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC1155BurnableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC1155BurnableStorage', adminProtected: true},
        testMsgData: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
    baseMetadataURI,
  },
};

runBehaviorTests('ERC1155Burnable', config, function (deployFn) {
  const implementation = {
    baseMetadataURI,
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

      // Admin
      NotMinter: "AccessControl: missing 'minter' role",
      NotContractOwner: 'Ownership: not the owner',
    },
    features: {
      BaseMetadataURI: true,
    },
    interfaces: {
      ERC1155: true,
      ERC1155Mintable: true,
      ERC1155Deliverable: true,
      ERC1155Burnable: true,
      ERC1155MetadataURI: true,
    },
    methods: {
      'safeMint(address,uint256,uint256,bytes)': async function (contract, to, id, value, data, signer) {
        return contract.connect(signer).safeMint(to, id, value, data);
      },
      'safeBatchMint(address,uint256[],uint256[],bytes)': async function (contract, to, ids, values, data, signer) {
        return contract.connect(signer).safeBatchMint(to, ids, values, data);
      },
      'burnFrom(address,uint256,uint256)': async function (contract, from, id, value, signer) {
        return contract.connect(signer).burnFrom(from, id, value);
      },
      'batchBurnFrom(address,uint256[],uint256[])': async function (contract, from, ids, values, signer) {
        return contract.connect(signer).batchBurnFrom(from, ids, values);
      },
    },
    deploy: async function (deployer) {
      const contract = await deployFn({baseMetadataURI});
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

  behavesLikeERC1155(implementation);
});
