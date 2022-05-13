const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress, Zero } = require('../../../../../src/constants');
const { interfaces } = require('mocha');
const ReceiverType = require('../../ReceiverType');
const { ERC721_RECEIVER } = require('../../ReceiverType');
const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');

function shouldBehaveLikeERC721Metadata(implementation) {

    const { deploy, methods, contractName, revertMessages } = implementation;

    describe('like a ERC721Metadata', function() {
        let accounts, deployer, owner;
        let nft1 = 1;
        let nft2 = 2;
        let unknownNFT = 1000;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, owner] = accounts;
        });

        const fixture = async function() {
            this.token = await deploy(implementation.name, implementation.symbol, implementation.tokenURI, deployer);
        };

        beforeEach(async function() {
            await loadFixture(fixture, this);
        });


    });
}

module.exports = {
    shouldBehaveLikeERC721Metadata,
};