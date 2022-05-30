const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');
const {behavesLikeERC721Burnable} = require('./behaviors/ERC721.burnable.behavior');
const {behavesLikeERC721Mintable} = require('./behaviors/ERC721.mintable.behavior');

const name = 'ERC721 MintableOnce Mock';
const symbol = 'E721MINTABLEONCE';
const tokenURI = 'uri';

const config = {
  immutable: {
    name: 'ERC721MintableOnceMock',
    ctorArguments: ['name', 'symbol', 'tokenURI', 'forwarderRegistry'],
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
          versionProtected: true,
        },
        metaTxSupport: true,
      },
      {
        name: 'ERC721MintableOnceFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721MintableOnceStorage',
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

runBehaviorTests('Mintable Once ERC721', config, function (deployFn) {
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
      BurntNFT: 'ERC721: burnt NFT',

      // Admin
      NotMinter: "AccessControl: missing 'minter' role",
      NotContractOwner: 'Ownable: not the owner',
    },
    features: {
      ERC721MintableOnce: true,
    },
    interfaces: {
      ERC721Mintable: true, // MintableOnce should pass tests for Mintable
      ERC721Burnable: true,
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
      'batchBurnFrom(address,uint256[])': async function (contract, from, tokenIds, signer) {
        return contract.connect(signer).batchBurnFrom(from, tokenIds);
      },
    },
    deploy: async function (deployer) {
      const contract = await deployFn({name, symbol, tokenURI});
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      return contract;
    },
    mint: async function (contract, to, id, _value, signer) {
      return contract.connect(signer).safeMint(to, id, '0x');
    },
  };

  describe('ERC721MintableOnceMock', function () {
    context('msgData()', function () {
      it('it is called for 100% coverage', async function () {
        const [deployer] = await ethers.getSigners();
        const token = await implementation.deploy(deployer);
        if (token.msgData) {
          await token.msgData();
        }
      });
    });
    behavesLikeERC721Mintable(implementation);
    behavesLikeERC721Burnable(implementation); // tests that after burn, can't be minted again
  });
});
