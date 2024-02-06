const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress, getTokenMetadataResolverWithBaseURIAddress} = require('../../../helpers/registries');
const {behavesLikeERC721} = require('./behaviors/ERC721.behavior');

const name = 'ERC721FullBurn';
const symbol = 'ERC721FullBurn';

const config = {
  immutable: {
    name: 'ERC721FullBurnMock',
    ctorArguments: ['name', 'symbol', 'metadataResolver', 'forwarderRegistry'],
    testMsgData: true,
  },
  proxied: {
    name: 'ERC721FullBurnProxiedMock',
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
        name: 'ERC721MetadataFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721MetadataStorage',
          arguments: ['name', 'symbol', 'metadataResolver'],
          adminProtected: true,
          phaseProtected: true,
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
      {
        name: 'ERC721DeliverableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721DeliverableStorage',
          adminProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC721BurnableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721BurnableStorage',
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

runBehaviorTests('ERC721FullBurn', config, function (deployFn) {
  const implementation = {
    name,
    symbol,
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

      // ERC721Mintable
      MintToAddressZero: {custom: true, error: 'ERC721MintToAddressZero'},
      ExistingToken: {custom: true, error: 'ERC721ExistingToken', args: ['tokenId']},

      // ERC2981
      IncorrectRoyaltyReceiver: {custom: true, error: 'ERC2981IncorrectRoyaltyReceiver'},
      IncorrectRoyaltyPercentage: {custom: true, error: 'ERC2981IncorrectRoyaltyPercentage', args: ['percentage']},

      // Misc
      InconsistentArrayLengths: {custom: true, error: 'InconsistentArrayLengths'},
      NotMinter: {custom: true, error: 'NotRoleHolder', args: ['role', 'account']},
      NotContractOwner: {custom: true, error: 'NotContractOwner', args: ['account']},
    },
    features: {
      MetadataResolver: true,
    },
    interfaces: {
      ERC721: true,
      ERC721BatchTransfer: true,
      ERC721Mintable: true,
      ERC721Deliverable: true,
      ERC721Burnable: true,
      ERC721Metadata: true,
      ERC2981: true,
    },
    methods: {
      'batchTransferFrom(address,address,uint256[])': async function (contract, from, to, ids, signer) {
        return contract.connect(signer).batchTransferFrom(from, to, ids);
      },
      'mint(address,uint256)': async function (contract, to, tokenId, signer) {
        return contract.connect(signer).mint(to, tokenId);
      },
      'safeMint(address,uint256,bytes)': async function (contract, to, tokenId, data, signer) {
        return contract.connect(signer).safeMint(to, tokenId, data);
      },
      'batchMint(address,uint256[])': async function (contract, to, tokenIds, signer) {
        return contract.connect(signer).batchMint(to, tokenIds);
      },
      'burnFrom(address,uint256)': async function (contract, from, id, signer) {
        return contract.connect(signer).burnFrom(from, id);
      },
      'batchBurnFrom(address,uint256[])': async function (contract, from, tokenIds, signer) {
        return contract.connect(signer).batchBurnFrom(from, tokenIds);
      },
    },
    deploy: async function (deployer) {
      const contract = await deployFn({name, symbol});
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
