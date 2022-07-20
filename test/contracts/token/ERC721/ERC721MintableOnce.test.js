const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');
const {behavesLikeERC721Burnable} = require('./behaviors/ERC721.burnable.behavior');
const {behavesLikeERC721Mintable} = require('./behaviors/ERC721.mintable.behavior');
const {behavesLikeERC721Deliverable} = require('./behaviors/ERC721.deliverable.behavior');

const config = {
  immutable: {
    name: 'ERC721MintableOnceMock',
    ctorArguments: ['forwarderRegistry'],
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
        name: 'ERC721Facet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC721Storage'},
      },
      {
        name: 'ERC721BurnableFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC721BurnableStorage'},
      },
      {
        name: 'ERC721MintableOnceFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721MintableOnceStorage',
          adminProtected: true,
        },
        testMsgData: true,
      },
      {
        name: 'ERC721DeliverableOnceFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {
          method: 'initERC721DeliverableOnceStorage',
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

runBehaviorTests('ERC721MintableOnce', config, function (deployFn) {
  const implementation = {
    revertMessages: {
      NonApproved: 'ERC721: non-approved sender',
      MintToAddressZero: 'ERC721: mint to address(0)',
      SafeTransferRejected: 'ERC721: safe transfer rejected',
      NonExistingToken: 'ERC721: non-existing token',
      NonOwnedToken: 'ERC721: non-owned token',
      ExistingToken: 'ERC721: existing token',
      BurntToken: 'ERC721: burnt token',
      InconsistentArrays: 'ERC721: inconsistent arrays',

      // Admin
      NotMinter: "AccessControl: missing 'minter' role",
      NotContractOwner: 'Ownership: not the owner',
    },
    features: {
      ERC721MintableOnce: true,
    },
    interfaces: {
      ERC721Mintable: true,
      ERC721Deliverable: true,
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
      'burnFrom(address,uint256)': async function (contract, from, id, signer) {
        return contract.connect(signer).burnFrom(from, id);
      },
      'batchBurnFrom(address,uint256[])': async function (contract, from, tokenIds, signer) {
        return contract.connect(signer).batchBurnFrom(from, tokenIds);
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

  behavesLikeERC721Mintable(implementation);
  behavesLikeERC721Deliverable(implementation);
  behavesLikeERC721Burnable(implementation); // tests that after burn, can't be minted again
});
