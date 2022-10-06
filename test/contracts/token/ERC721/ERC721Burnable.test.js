const {behavesLikeERC721} = require('./behaviors/ERC721.behavior');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');

const name = 'ERC721BurnableMock';
const symbol = 'ERC721BurnableMock';
const baseMetadataURI = 'uri';

const config = {
  immutable: {
    name: 'ERC721BurnableMock',
    ctorArguments: ['name', 'symbol', 'forwarderRegistry'],
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
        name: 'ERC721FacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721Storage',
          adminProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC721MetadataWithBaseURIFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721MetadataStorage',
          arguments: ['name', 'symbol'],
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
        name: 'ERC721BatchTransferFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721BatchTransferStorage',
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
    name,
    symbol,
    baseMetadataURI,
  },
};

runBehaviorTests('ERC721Burnable', config, function (deployFn) {
  const implementation = {
    name,
    symbol,
    baseMetadataURI,
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

      // Admin
      NotMinter: "AccessControl: missing 'minter' role",
      NotContractOwner: 'Ownership: not the owner',
    },
    features: {
      BaseMetadataURI: true,
    },
    interfaces: {
      ERC721: true,
      ERC721BatchTransfer: true,
      ERC721Mintable: true,
      ERC721Deliverable: true,
      ERC721Burnable: true,
      ERC721Metadata: true,
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
      const contract = await deployFn({name, symbol, baseMetadataURI});
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
