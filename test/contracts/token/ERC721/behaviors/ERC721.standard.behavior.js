const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress } = require('../../../../../src/constants');
const { interfaces } = require('mocha');

function shouldBehaveLikeERC721Standard(implementation) {

    const { deploy, revertMessages } = implementation;

    describe('like an ERC721 Standard', function() {
        let accounts, deployer, owner, recipient, spender, maxSpender;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, owner, other, spender, maxSpender] = accounts;
        });

        const nft1 = 1;
        const nft2 = 2;
        const nft3 = 3;
        const nft4 = 4;
        const nft5 = 5;
        const unknownNFT = 1000;

        const fixture = async function() {
            this.token = await deploy(implementation.name, implementation.symbol, implementation.tokenURI);
            await this.token.mint(owner.address, nft1);
            await this.token.mint(owner.address, nft2);
            await this.token.mint(owner.address, nft3);
            await this.token.mint(owner.address, nft4);
            await this.token.mint(owner.address, nft5);

            this.nftBalance = await this.token.balanceOf(owner.address);
        };

        beforeEach(async function() {
            await loadFixture(fixture, this);
        });

        describe('balanceOf(address)', function() {

            context('when the given address owns some tokens', function() {
                it('returns the amount of tokens owned by the given address', async function() {
                    expect(await this.token.balanceOf(owner.address)).to.equal(5);
                });
            });

            context('when the given address does not own any tokens', function() {
                it('returns 0', async function() {
                    expect(await this.token.balanceOf(other.address)).to.equal(0);
                });
            });

            context('when querying the zero address', function() {
                it('throws', async function() {
                    await expect(this.token.balanceOf(ZeroAddress)).to.be.revertedWith(revertMessages.ZeroAddress);
                });
            });

        });

        describe('ownerOf(uint256)', function() {
            context('when the given token ID was tracked by this token', function() {
                it('returns the owner of the given token ID', async function() {
                    expect(await this.token.ownerOf(nft1)).to.equal(owner.address);
                });
            });

            it('reverts if the token does not exist', async function() {
                await expect(this.token.ownerOf(unknownNFT)).to.be.revertedWith(revertMessages.NonExistingNFT);
            });
        });

        describe('transfers', function() {

            let receipt = null;

            const transferWasSuccessful = function(ids, data, safe) {
                it('gives the token(s) ownership to the recipient', async function() {
                    for (const id of ids) {
                        expect(await this.token.ownerOf(id)).to.equal(this.toWhom.address);
                    }
                });
                it('clears the approval for the token(s)', async function() {
                    for (const id of ids) {
                        expect(await this.token.getApproved(id)).to.equal(ZeroAddress);
                    }
                });
                it('emits Transfer event(s)', async function() {
                    for (const id of ids) {
                        await expect(this.receipt).to.emit(this.token, 'Transfer')
                            .withArgs(owner.address, this.toWhom.address, id);
                    }
                });
            }

            const shouldTransferTokenBySender = function(transferFunction, ids, data, safe) {
                context('when called by the owner', function() {
                    this.beforeEach(async function() {
                        this.receipt = await transferFunction.call(this, owner, this.toWhom, ids);
                    });
                    transferWasSuccessful(ids, data, safe);
                });
            }

            const shouldRevertOnPreconditions = function(transferFunction, safe) {
                describe('Pre-conditions', function() {
                    //beforeEach(async function() {
                    //    this.toWhom = other;
                    //});
                    const data = '0x42';
                    if (interfaces.Pausable) {
                        it('[Pausable] reverts when paused', async function() {
                            await this.token.connect(owner).pause();
                            await expect(transferFunction.call(this, owner, other, nft1)).to.be.revertedWith(revertMessages.TransferToZero);
                        });
                    }
                    it('reverts if transferred to the zero address', async function() {
                        await expect(transferFunction.call(this, owner, { address: ZeroAddress }, nft1)).to.be.revertedWith(revertMessages.TransferToZero);
                    });
                    it('reverts if the token does not exist', async function() {
                        await expect(transferFunction.call(this, owner, other, unknownNFT)).to.be.revertedWith(revertMessages.NonOwnedNFT);
                    });
                    it('reverts if `from` is not the token owner', async function() {
                        await expect(transferFunction.call(this, other, other, nft1)).to.be.revertedWith(revertMessages.NonOwnedNFT);
                    });
                    it('reverts if the sender is not authorized for the token', async function() {
                        //TODO
                    });
                });
            }

            const shouldTransferTokenToRecipient = function(transferFunction, ids, data, safe) {
                context('when sent to another wallet', function() {
                    beforeEach(async function() {
                        this.toWhom = other;
                    });
                    shouldTransferTokenBySender(transferFunction, ids, data, safe);
                });
            }

            describe('transferFrom(address,address,uint256)', function() {
                const transferFn = async function(from, to, tokenId) {
                    return this.token.connect(from).transferFrom(from.address, to.address, tokenId);
                };
                const safe = false;
                const data = undefined;
                shouldRevertOnPreconditions(transferFn, safe);
                shouldTransferTokenToRecipient(transferFn, [nft1], data, safe);
            });

            describe('batchTransferFrom(address,adress,uint256[])', function() {
                const transferFn = async function(from, to, tokenIds, ) {
                    const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
                    return this.token.connect(from).batchTransferFrom(from.address, to.address, ids);
                };
                const safe = true;
                context('with an empty list of token', function() {
                    shouldTransferTokenToRecipient(transferFn, [], undefined, safe);
                });
                context('with a single token', function() {
                    shouldTransferTokenToRecipient(transferFn, [nft1], undefined, safe);
                });
                context('with a list of tokens from the same collection', function() {
                    shouldTransferTokenToRecipient(transferFn, [nft1, nft2], undefined, safe);
                });
            });

            describe('safeTransferFrom(address,address,uint256)', function() {
                const transferFn = async function(from, to, tokenId) {
                    //safeTransferFrom is overloaded so we specify the function signature
                    return this.token.connect(from)['safeTransferFrom(address,address,uint256)'](from.address, to.address, tokenId);
                };
                const safe = true;
                shouldTransferTokenToRecipient(transferFn, [nft1], undefined, safe);
            });
        });
    });
}

module.exports = {
    shouldBehaveLikeERC721Standard,
};