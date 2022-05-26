const {shouldBehaveLikeERC721} = require('./behaviors/ERC721.behavior');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');

const name = 'ERC721Mock';
const symbol = 'ERC721Mock';
const tokenURI = 'uri';

const config = {
  immutable: {
    name: 'ERC721SimpleMock',
    ctorArguments: ['forwarderRegistry'],
    metaTxSupport: true,
  },
  diamond: {
    facets: [
      {name: 'ProxyAdminFacetMock', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {name: 'ERC165Facet', ctorArguments: ['forwarderRegistry'], init: {method: 'initInterfaceDetectionStorage'}},
      {name: 'OwnableFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initOwnershipStorage', arguments: ['initialOwner']}},
      {name: 'AccessControlFacet', ctorArguments: ['forwarderRegistry']},
      {
        name: 'ERC721FacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721Storage',
          arguments: [],
          adminProtected: true,
          versionProtected: true,
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
          versionProtected: false,
        },
        metaTxSupport: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
  },
};

runBehaviorTests('Simple ERC721', config, function (deployFn) {
  const implementation = {
    contractName: name,
    nfMaskLength: 32,
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
      NotContractOwner: 'Ownable: not the owner',
    },
    features: {},
    interfaces: {
      ERC721: true,
      ERC721Mintable: true,
    },
    methods: {
      'mint(address,uint256)': async function (contract, to, tokenId, signer) {
        return contract.connect(signer).mint(to, tokenId);
      },
      'safeMint(address,uint256,bytes)': async function (contract, to, tokenId, data, signer) {
        return contract.connect(signer).safeMint(to, tokenId, data);
      },
      'batchMint(address,uint256[])': async function (contract, to, tokenIds, signer) {
        return contract.connect(signer).batchMint(to, tokenIds);
      },
    },
    deploy: async function (deployer) {
      const contract = await deployFn();
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      return contract;
    },
    mint: async function (contract, to, id, _value, signer) {
      return contract.connect(signer).safeMint(to, id, '0x');
    },
  };

  shouldBehaveLikeERC721(implementation);
});
