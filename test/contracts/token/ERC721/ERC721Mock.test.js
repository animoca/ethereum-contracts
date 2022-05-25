const {behavesLikeERC721} = require('./behaviors/ERC721.behavior');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');

const name = 'ERC721Mock';
const symbol = 'ERC721Mock';
const tokenURI = 'uri';

const config = {
  immutable: {
    name: 'ERC721Mock',
    ctorArguments: ['name', 'symbol', 'tokenURI'],
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
        name: 'ERC721TokenMetadataWithBaseURIFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721MetadataStorageWithBaseURIStorage',
          arguments: ['name', 'symbol', 'tokenURI'],
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
      {
        name: 'ERC721BurnableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721BurnableStorage',
          arguments: [],
          adminProtected: true,
          versionProtected: false,
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
    name,
    symbol,
    tokenURI,
  },
};

const includeDiamondTest = true;
runBehaviorTests(
  'Standard ERC721',
  config,
  function (deployFn) {
    const implementation = {
      name,
      symbol,
      tokenURI,
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
        ERC721Burnable: true,
        ERC721Metadata: true,
      },
      methods: {},
      deploy: async function (name, symbol, tokenURI, deployer) {
        const contract = await deployFn({name, symbol, tokenURI});
        await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
        return contract;
      },
    };

    behavesLikeERC721(implementation);
  },
  includeDiamondTest
);
