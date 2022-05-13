const { behavesLikeERC721 } = require('./behaviors/ERC721.behavior');
const { getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests } = require('../../../helpers/run');
const { ethers } = require('hardhat');

const name = 'ERC721 Mock';
const symbol = 'E721';
const tokenURI = 'uri';

const config = {
    immutable: {
        name: 'ERC721Mock',
        ctorArguments: ['name', 'symbol', 'tokenURI']
    },
    diamond: {
        facets: []
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

const includeDiamondTest = false;
runBehaviorTests('Standard ERC721', config, function(deployFn) {
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
            NotMinter: 'MinterRole: not a Minter',
            NotContractOwner: 'Ownable: not the owner'
        },
        features: {
            ERC165: true
        },
        interfaces: {
            ERC721: true,
            ERC721MintableOnce: true,
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