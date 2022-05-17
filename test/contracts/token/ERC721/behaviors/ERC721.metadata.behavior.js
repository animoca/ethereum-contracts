const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ethers } = require('hardhat');

function shouldBehaveLikeERC721Metadata(implementation) {

    const { name, symbol, features, deploy, revertMessages } = implementation;

    describe('like a ERC721Metadata', function() {
        let accounts, deployer, owner;
        let nft1 = 1;
        let nft2 = 2;

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

        it('has a name', async function() {
            expect(await this.token.name()).to.equal(name);
        });

        it('has a symbol', async function() {
            expect(await this.token.symbol()).to.equal(symbol);
        });

        describe('when requesting tokenURI', function() {
            beforeEach(async function() {
                await this.token.mint(owner.address, nft1);
            });
            it('returns tokenURI if NFT exists', async function() {
                await this.token.tokenURI(nft1); //doesn't revert
            });
            it('reverts if NFT doesn\'t exist', async function() {
                await expect(this.token.tokenURI(nft2)).to.be.revertedWith(revertMessages.NonExistingNFT);
            });

            if (features.BaseMetadataURI) {
                // TODO
            }
        });


    });
}

module.exports = {
    shouldBehaveLikeERC721Metadata,
};