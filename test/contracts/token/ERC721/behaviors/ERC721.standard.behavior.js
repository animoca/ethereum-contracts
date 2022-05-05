const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress } = require('../../../../../src/constants');

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
                it("returns the amount of tokens owned by the given address", async function() {
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

        const shouldTransferTokenToRecipient = function(transferFunction, ids, data, safe) {
            context('when sent to another wallet', function() {
                beforeEach(async function() {
                    this.toWhom = other;
                });
                shouldTransferTokenBySender(transferFunction, ids, data, safe);
            });
        }

        describe('transfers', function() {

            let receipt = null;

            const transferWasSuccessful = function(ids, data, safe) {
                it("gives the token(s) ownership to the recipient", async function() {
                    for (const id of ids) {
                        expect(await this.token.ownerOf(id)).to.equal(this.toWhom.address);
                    }
                });
                it("clears the approval for the token(s)", async function() {
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
                context("when called by the owner", function() {
                    this.beforeEach(async function() {
                        this.receipt = await transferFunction.call(this, owner, this.toWhom, ids);
                    });
                    transferWasSuccessful(ids, data, safe);
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

            describe("transferFrom(address,address,uint256)", function() {
                const transferFn = async function(from, to, tokenId) {
                    console.log(`transferFn from ${from.address} to ${to.address} tokenId ${tokenId}`);
                    return this.token.connect(from).transferFrom(from.address, to.address, tokenId);
                }
                const safe = false;
                const data = undefined;
                shouldTransferTokenToRecipient(transferFn, [nft1], data, safe);
            });
        });
    });
}

module.exports = {
    shouldBehaveLikeERC721Standard,
};