const { behavesLikeERC721 } = require('./behaviors/ERC721.behavior');
const { getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests } = require('../../../helpers/run');
const { ethers } = require('hardhat');

const name = 'ERC721 MintableOnce Mock';
const symbol = 'E721MINTABLEONCE';
const tokenURI = 'uri';

const config = {
    immutable: {
        name: 'ERC721MintableOnceMock',
        ctorArguments: ['name', 'symbol', 'tokenURI']
    },
    diamond: {
        facets: [

            { name: 'ProxyAdminFacetMock', ctorArguments: ['forwarderRegistry'], init: { method: 'initProxyAdminStorage', arguments: ['initialAdmin'] } },
            { name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: { method: 'initDiamondCutStorage' } },
            { name: 'ERC165Facet', ctorArguments: ['forwarderRegistry'], init: { method: 'initInterfaceDetectionStorage' } },
            { name: 'OwnableFacet', ctorArguments: ['forwarderRegistry'], init: { method: 'initOwnershipStorage', arguments: ['initialOwner'] } },
            { name: 'AccessControlFacet', ctorArguments: ['forwarderRegistry'] },
            {
                name: "ERC721FacetMock",
                ctorArguments: ['forwarderRegistry'],
                init: {
                    method: 'initERC721Storage',
                    arguments: [],
                    adminProtected: false,
                    versionProtected: false
                },
                metaTxSupport: false,
            },
            {
                name: "ERC721MintableOnceFacetMock",
                ctorArguments: ['forwarderRegistry'],
                init: {
                    method: 'initERC721MintableOnceStorage',
                    arguments: [],
                    adminProtected: false,
                    versionProtected: false
                },
                metaTxSupport: false,
            },
            {
                name: "ERC721BurnableFacetMock",
                ctorArguments: ['forwarderRegistry'],
                init: {
                    method: 'initERC721BurnableStorage',
                    arguments: [],
                    adminProtected: false,
                    versionProtected: false
                },
                metaTxSupport: false
            },
        ]
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
runBehaviorTests('Mintable Once ERC721', config, function(deployFn) {
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
            NotMinter: 'MinterRole: not a Minter',
            NotContractOwner: 'Ownable: not the owner'
        },
        features: {
            ERC721MintableOnce: true
        },
        interfaces: {
            ERC721Burnable: true
        },
        methods: {
            //TODO
        },
        deploy: async function(name, symbol, tokenURI, deployer) {
            const contract = await deployFn({ name, symbol, tokenURI });
            await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
            return contract;
        },
    };

    let deployer;

    before(async function() {
        [deployer] = await ethers.getSigners();
    });

    behavesLikeERC721(implementation);

}, includeDiamondTest);