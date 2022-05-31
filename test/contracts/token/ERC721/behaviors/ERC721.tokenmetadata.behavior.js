const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { shouldSupportInterfaces } = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721TokenMetadata({ name, symbol, features, deploy, revertMessages }) {
    describe('like a ERC721TokenMetadata', function() {
        let accounts, deployer, owner, other;
        let nft1 = 1;
        let nft2 = 2;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, owner, other] = accounts;
        });

        const fixture = async function() {
            this.token = await deploy(deployer);
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

        describe('when setting tokenURI', function() {
            beforeEach(async function() {
                await this.token.mint(owner.address, nft1);
            });
            context('setTokenURI(uint256,string)', function() {
                it('does not revert if set by contract owner', async function() {
                    await this.token.connect(deployer).setTokenURI(nft1, 'uri');
                });
                it('reverts when set by other than contract owner', async function() {
                    await expect(this.token.connect(other).setTokenURI(nft1, 'uri')).to.be.revertedWith(revertMessages.NotContractOwner);
                });

            });
            context('batchSetTokenURI(uint256[],string[])', function() {
                it('does not revert if batch set by contract owner', async function() {
                    await this.token.connect(deployer).batchSetTokenURI([nft1, nft2], ['uri1', 'uri2']);
                });
                it('reverts when batch set by other than contract owner', async function() {
                    await expect(this.token.connect(other).batchSetTokenURI([nft1, nft2], ['uri1', 'uri2'])).to.be.revertedWith(revertMessages.NotContractOwner);
                });
            });
        });

        describe('when requesting tokenURI', function() {
            it('returns tokenURI if NFT exists and uri set', async function() {
                await this.token.mint(owner.address, nft1);
                await this.token.setTokenURI(nft1, 'uri1');
                await this.token.tokenURI(nft1);
            });
            it("reverts if NFT doesn't exist", async function() {
                await expect(this.token.tokenURI(nft2)).to.be.revertedWith(revertMessages.NonExistingNFT);
            });
            it('reverts if NFT exists but uri isn\'t set', async function() {
                await this.token.mint(owner.address, nft1);
                await expect(this.token.tokenURI(nft1)).to.be.revertedWith(revertMessages.NonExistingNFT);
            });
        });

        shouldSupportInterfaces(['contracts/token/ERC721/interfaces/IERC721Metadata.sol:IERC721Metadata']);
    });
}

module.exports = {
    behavesLikeERC721TokenMetadata,
};