const {behavesLikeERC721} = require('./behaviors/ERC721.behavior');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');

const name = 'ERC721BurnableMock';
const symbol = 'ERC721BurnableMock';
const baseMetadataURI = 'uri';

const config = {
  immutable: {
    name: 'ERC721BurnableMock',
    ctorArguments: ['name', 'symbol', 'baseMetadataURI', 'forwarderRegistry'],
    metaTxSupport: true,
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
          arguments: [],
          adminProtected: true,
          phaseProtected: true,
        },
        metaTxSupport: true,
      },
      {
        name: 'ERC721TokenMetadataWithBaseURIFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721MetadataWithBaseURIStorage',
          arguments: ['name', 'symbol', 'baseMetadataURI'],
          adminProtected: true,
          phaseProtected: true,
        },
        metaTxSupport: true,
      },
      {
        name: 'ERC721MintableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721MintableStorage',
          arguments: [],
          adminProtected: true,
          phaseProtected: false,
        },
        metaTxSupport: true,
      },
      {
        name: 'ERC721BurnableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721BurnableStorage',
          arguments: [],
          adminProtected: true,
          phaseProtected: false,
        },
        metaTxSupport: true,
      },
      {
        name: 'ERC721BatchTransferFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721BatchTransferStorage',
          arguments: [],
          adminProtected: true,
          phaseProtected: false,
        },
        metaTxSupport: true,
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

runBehaviorTests('Burnable ERC721', config, function (deployFn) {
  const implementation = {
    contractName: name,
    nfMaskLength: 32,
    name,
    symbol,
    baseMetadataURI,
    revertMessages: {
      NonApproved: 'ERC721: non-approved sender',
      SelfApproval: 'ERC721: self-approval',
      SelfApprovalForAll: 'ERC721: self-approval',
      ZeroAddress: 'ERC721: zero address',
      TransferToZero: 'ERC721: transfer to zero',
      MintToZero: 'ERC721: mint to zero',
      TransferRejected: 'ERC721: transfer refused',
      NonExistingNFT: 'ERC721: non-existing NFT',
      NonOwnedNFT: 'ERC721: non-owned NFT',
      ExistingOrBurntNFT: 'ERC721: existing/burnt NFT',

      // Admin
      NotMinter: "AccessControl: missing 'minter' role",
      NotContractOwner: 'Ownership: not the owner',
    },
    features: {
      BaseMetadataURI: true,
    },
    interfaces: {
      ERC721: true,
      ERC721Mintable: true,
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
  };

  behavesLikeERC721(implementation);
});
