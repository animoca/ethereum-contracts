const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { shouldSupportInterfaces } = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721Metadata({ name, symbol, features, deploy, revertMessages }) {
    describe('like a ERC721Metadata', function() {
        let accounts, deployer, owner;
        let nft1 = 1;
        let nft2 = 2;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, owner] = accounts;
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

        describe('tokenURI', function() {
            beforeEach(async function() {
                await this.token.mint(owner.address, nft1);
            });

            it('tokenURI()', async function() {
                await this.token.tokenURI(nft1); //doesn't revert
                await expect(this.token.tokenURI(nft2)).to.be.revertedWith(revertMessages.NonExistingNFT);
            });

            if (features.BaseMetadataURI) {
                describe('[BaseMetadataURI] setBaseMetadataURI(string)', function() {
                    const newBaseMetadataURI = 'test/';
                    it('reverts if not called by the contract owner', async function() {
                        // account 'owner' is the token owner, not contract owner.
                        await expect(this.token.connect(owner).setBaseMetadataURI(newBaseMetadataURI)).to.be.revertedWith(revertMessages.NotContractOwner);
                    });
                    it('updates the base token URI', async function() {
                        await this.token.setBaseMetadataURI(newBaseMetadataURI); // doesn't revert
                        expect(await this.token.tokenURI(nft1)).to.equal(newBaseMetadataURI + nft1.toString());
                    });
                    it('emits the BaseMetadataURISet event', async function() {
                        let receipt = await this.token.setBaseMetadataURI(newBaseMetadataURI);
                        await expect(receipt).to.emit(this.token, 'BaseMetadataURISet');
                    });
                });
            }
        });
        shouldSupportInterfaces(['contracts/token/ERC721/interfaces/IERC721Metadata.sol:IERC721Metadata']);
    });
}

module.exports = {
    behavesLikeERC721Metadata,
};