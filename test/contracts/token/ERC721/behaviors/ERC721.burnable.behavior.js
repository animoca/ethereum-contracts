const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress, Zero } = require('../../../../../src/constants');
const { interfaces } = require('mocha');
const ReceiverType = require('../../ReceiverType');
const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');

function shouldBehaveLikeERC721Burnable(implementation) {

    const { deploy, methods, contractName, revertMessages } = implementation;

    describe('like a Burnable ERC721', function() {
        let accounts, deployer, minter, owner, other, approved, operator;
        let nft1 = 1;
        let nft2 = 2;
        let unknownNFT = 1000;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, minter, owner, other, approved, operator] = accounts;
        });

        const fixture = async function() {
            this.token = await deploy(implementation.name, implementation.symbol, implementation.tokenURI, deployer);
            await this.token.connect(deployer).mintOnce(owner.address, nft1);
            await this.token.connect(deployer).mintOnce(owner.address, nft2);
            await this.token.connect(owner).approve(approved.address, nft1);

            this.nftBalance = await this.token.balanceOf(owner.address);
            if (interfaces.ERC1155Inventory) {
                // TODO
            }
        };

        beforeEach(async function() {
            await loadFixture(fixture, this);
        });

        let receipt = null;

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

            it("emit Transfer event(s)", function() {
                for (const id of ids) {
                    // TODO
                }
            });

            if (interfaces.ERC1155) {
                if (Array.isArray(tokenIds)) {
                    if (Array.isArray(tokenIds)) {
                        it('[ERC1155] emits a TransferBatch event', function() {
                            // TODO
                        });
                    } else {
                        it('[ERC1155] emits a TransferSingle event', function() {
                            // TODO
                        });
                    }
                }
            }

            it("decreases the sender balance", async function() {
                expect(await this.token.balanceOf(owner.address)).to.equal(this.nftBalance - ids.length);
            });

            if (interfaces.ERC1155Inventory) {
                // TODO
            };
        };

        const shouldBurnTokenBySender = function(burnFunction, ids) {
            context('when called by the owner', function() {
                beforeEach(async function() {
                    this.receipt = await burnFunction.call(this, owner, ids, owner);
                });
                burnWasSuccessful(ids, owner);
            });
        }

        const shouldRevertOnPreconditions = function(burnFunction) {
            describe('Pre-condition', function() {
                if (interfaces.Pausable) {
                    it('[Pausable] reverts when paused', async function() {
                        // TODO
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

                if (interfaces.ERC1155) {
                    if ('[ERC1155] reverts if the id is a Fungbile Token', async function() {
                            // TODO
                        });
                }
            });
        }


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
            if (interfaces.ERC1155Inventory) {
                // TODO
            }
        });

    });


}

module.exports = {
    shouldBehaveLikeERC721Burnable,
};