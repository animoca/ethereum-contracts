const {behavesLikeERC721} = require('./behaviors/ERC721.behavior');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');
const { ethers } = require('hardhat');

const name = 'ERC721 Mock';
const symbol = 'E721';
const tokenURI = 'uri';

const config = {
    immutable: {
        name: 'ERC721Mock',
        ctorArguments: ['name','symbol','tokenURI']
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
            // TODO
            ZeroAddress: 'ERC721: zero address'
        },
        features: {
            ERC165: true
        },
        interfaces: {
            ERC721: true
        },
        methods: {
            // ERC721Mintable
            'mint(address,uint256)': async function (contract, to, tokenId, overrides) {
                return contract.mint(to, tokenId, overrides);
              },
        },
        deploy: async function(name, symbol, tokenURI) {
            const contract = await deployFn({name, symbol, tokenURI});
            return contract;
        },
    };

    let deployer;

    before(async function() {
        [deployer] = await ethers.getSigners();
    });
    
    // TODO: Remve describe & it functions below. Should call behavesLikeERC721 at top level. 
    // Used atm for '.only' functionality to run only this test function in development
    describe.only("ERC721Mock_behaviors", async function() {
        it("Should behave like ERC721", async function () {
            behavesLikeERC721(implementation);
        });
    });
    
    }, includeDiamondTest);
    