const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { shouldSupportInterfaces } = require('../../../introspection/behaviors/SupportsInterface.behavior');

function shouldBehaveLikeERC721Burnable(implementation) {
    const { deploy, features, revertMessages, interfaces } = implementation;

    describe('like a Burnable ERC721', function() {
        let accounts, deployer, owner, other, approved, operator;
        let nft1 = 1;
        let nft2 = 2;
        let unknownNFT = 1000;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, minter, owner, other, approved, operator] = accounts;
        });

        const fixture = async function() {
            this.token = await deploy(implementation.name, implementation.symbol, implementation.tokenURI, deployer);
            //if (features.ERC721MintableOnce) {
            //  await this.token.connect(deployer).mintOnce(owner.address, nft1);
            //  await this.token.connect(deployer).mintOnce(owner.address, nft2);
            //} else {
            await this.token.connect(deployer).mint(owner.address, nft1);
            await this.token.connect(deployer).mint(owner.address, nft2);
            //}
            await this.token.connect(owner).approve(approved.address, nft1);
            await this.token.connect(owner).approve(approved.address, nft2);
            await this.token.connect(owner).setApprovalForAll(operator.address, true);

            this.nftBalance = await this.token.balanceOf(owner.address);
        };

        beforeEach(async function() {
            await loadFixture(fixture, this);
        });

        const shouldNotBeMintableAgain = function(ids) {
            ids = Array.isArray(ids) ? ids : [ids];
            context('ERC721MintableOnce', function() {
                it('should not be mintable again, using mintOnce', async function() {
                    for (const id of ids) {
                        await expect(this.token.connect(deployer).mint(owner.address, id)).to.be.revertedWith(revertMessages.BurntNFT);
                    }
                });
                it('should not be mintable again, using batchMintOnce', async function() {
                    await expect(this.token.connect(deployer).batchMint(owner.address, ids)).to.be.revertedWith(revertMessages.BurntNFT);
                });
            });
        };

        const burnWasSuccessful = function(tokenIds, signer = deployer) {
            const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
            it('transfers the ownership of the token(s)', async function() {
                for (const id of ids) {
                    await expect(this.token.ownerOf(id)).to.be.revertedWith(revertMessages.NonExistingNFT);
                }
            });

            it('clears the approval for the token(s)', async function() {
                for (const id of ids) {
                    await expect(this.token.getApproved(id)).to.be.revertedWith(revertMessages.NonExistingNFT);
                }
            });

            it('emit Transfer event(s)', async function() {
                for (const id of ids) {
                    await expect(this.receipt).to.emit(this.token, 'Transfer');
                }
            });

            it('decreases the sender balance', async function() {
                expect(await this.token.balanceOf(owner.address)).to.equal(this.nftBalance - ids.length);
            });
        };

        const shouldBurnTokenBySender = function(burnFunction, ids) {
            context('when called by the owner', function() {
                beforeEach(async function() {
                    this.receipt = await burnFunction.call(this, owner, ids, owner);
                });
                burnWasSuccessful(ids, owner);

                if (features.ERC721MintableOnce && ids.length > 0) {
                    shouldNotBeMintableAgain(ids);
                }
            });

            context('when called by a wallet with single token approval', function() {
                beforeEach(async function() {
                    this.receipt = await burnFunction.call(this, owner, ids, approved);
                });
                burnWasSuccessful(ids, approved);
            });

            context('when called by an operator', function() {
                beforeEach(async function() {
                    this.receipt = await burnFunction.call(this, owner, ids, operator);
                });
                burnWasSuccessful(ids, operator);
            });
        };

        const shouldRevertOnPreconditions = function(burnFunction) {
            describe('Pre-condition', function() {
                if (interfaces.Pausable) {
                    it('[Pausable] reverts when paused', async function() {
                        await this.token.connect(deployer).pause();
                        await expect(burnFunction.call(this, owner, nft1, owner)).to.be.revertedWith(revertMessages.AlreadyPaused);
                    });
                }
                it('reverts if the token does not exist', async function() {
                    await expect(burnFunction.call(this, owner, unknownNFT)).to.be.revertedWith(revertMessages.NonOwnedNFT);
                });

                it('reverts if `from` is not the token owner', async function() {
                    await expect(burnFunction.call(this, other, nft1, other)).to.be.revertedWith(revertMessages.NonOwnedNFT);
                });

                it('reverts if the sender is not authorized for the token', async function() {
                    await expect(burnFunction.call(this, owner, nft1, other)).to.be.revertedWith(revertMessages.NonApproved);
                });
            });
        };

        describe('burnFrom(address,uint256)', function() {
            const burnFn = async function(from, tokenId, signer = deployer) {
                return this.token.connect(signer).burnFrom(from.address, tokenId);
            };
            shouldRevertOnPreconditions(burnFn);
            shouldBurnTokenBySender(burnFn, nft1);
        });

        describe('batchBurnFrom(address, uint256[])', function() {
            const burnFn = async function(from, tokenIds, signer = deployer) {
                const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
                return this.token.connect(signer).batchBurnFrom(from.address, ids);
            };
            shouldRevertOnPreconditions(burnFn);
            context('with an empty list of tokens', function() {
                shouldBurnTokenBySender(burnFn, []);
            });
            context('with a single token', function() {
                shouldBurnTokenBySender(burnFn, [nft1]);
            });
            context('with a list of tokens from the same collection', function() {
                shouldBurnTokenBySender(burnFn, [nft1, nft2]);
            });
        });

        shouldSupportInterfaces(['contracts/token/ERC721/interfaces/IERC721Burnable.sol:IERC721Burnable']);
    });
}

module.exports = {
    shouldBehaveLikeERC721Burnable,
};