const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress } = require('../../../../../src/constants');
const { interfaces } = require('mocha');
const ReceiverType = require('../../ReceiverType');

function shouldBehaveLikeERC721Standard(implementation) {

    const { deploy, revertMessages } = implementation;

    describe('like an ERC721 Standard', function() {
        let accounts, deployer, owner, approved, anotherApproved, operator, other;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, owner, approved, anotherApproved, operator, other] = accounts;
            console.log({ accounts });
            console.log("before deployer", deployer.address);
            console.log("before owner", owner.address);
            console.log("before approved", approved.address);
            console.log("before anotherApproved", anotherApproved.address);
            console.log("before operator", operator.address);
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

            await this.token.connect(owner).setApprovalForAll(operator.address, true);
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
                //if (selfTransfer) {
                //
                //}
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

            const shouldTransferTokenBySender = function(transferFunction, ids, data, safe, receiverType, selfTransfer) {
                context('when called by the owner', function() {
                    this.beforeEach(async function() {
                        this.receipt = await transferFunction.call(this, owner, this.toWhom, ids, data);
                    });
                    transferWasSuccessful(ids, data, safe, receiverType, selfTransfer);
                });
                context('when called by a wallet with single token approval', function() {
                    this.beforeEach(async function() {
                        this.receipt = await transferFunction.call(this, owner, this.toWhom, ids, data);
                    });
                    transferWasSuccessful(ids, data, safe, receiverType, selfTransfer);
                });
                context('when called by an operator', function() {
                    this.beforeEach(async function() {
                        this.receipt = await transferFunction.call(this, owner, this.toWhom, ids, data, signer = operator);
                    });
                    transferWasSuccessful(ids, data, safe, receiverType, selfTransfer)
                });
            }

            const shouldRevertOnPreconditions = function(transferFunction, data, safe) {
                describe('Pre-conditions', function() {
                    if (interfaces.Pausable) {
                        it('[Pausable] reverts when paused', async function() {
                            await this.token.connect(owner).pause();
                            await expect(transferFunction.call(this, owner, other, nft1, data)).to.be.revertedWith(revertMessages.TransferToZero);
                        });
                    }
                    it('reverts if transferred to the zero address', async function() {
                        await expect(transferFunction.call(this, owner, { address: ZeroAddress }, nft1, data)).to.be.revertedWith(revertMessages.TransferToZero);
                    });
                    it('reverts if the token does not exist', async function() {
                        await expect(transferFunction.call(this, owner, other, unknownNFT, data)).to.be.revertedWith(revertMessages.NonOwnedNFT);
                    });
                    it('reverts if `from` is not the token owner', async function() {
                        await expect(transferFunction.call(this, other, other, nft1, data)).to.be.revertedWith(revertMessages.NonOwnedNFT);
                    });
                    it('reverts if the sender is not authorized for the token', async function() {
                        await expect(transferFunction.call(this, owner, other, nft1, data, other)).to.be.revertedWith(revertMessages.NonApproved);
                    });

                    if (safe) {
                        it('reverts when sent to a non-receiver contract', async function() {
                            //TODO: Add revert message
                            await expect(transferFunction.call(this, owner, this.token, nft1, data)).to.be.revertedWith('');
                        });
                    }
                });
            }

            const shouldTransferTokenToRecipient = function(transferFunction, ids, data, safe) {
                context('when sent to another wallet', function() {
                    beforeEach(async function() {
                        this.toWhom = other;
                    });
                    shouldTransferTokenBySender(transferFunction, ids, data, safe, ReceiverType.WALLET);
                });

                context('when sent to the same owner', function() {
                    this.beforeEach(async function() {
                        this.toWhom = owner;
                    });
                    const selfTransfer = true;
                    shouldTransferTokenBySender(transferFunction, ids, data, safe, ReceiverType.WALLET);
                });

                context('when sent to an ERC721Receiver contract', function() {
                    this.beforeEach(async function() {
                        // TODO
                    });
                    // TODO
                });
                if (interfaces.ERC1155) {
                    context('[ERC1155] when sent to an ERC1155TokenReceiver contract', function() {
                        this.beforeEach(async function() {
                            // TODO
                        });
                        // TODO
                    });
                }
            }

            describe('transferFrom(address,address,uint256)', function() {
                const transferFn = async function(from, to, tokenId, data = undefined, signer = from) {
                    return this.token.connect(signer).transferFrom(from.address, to.address, tokenId);
                };
                const safe = false;
                const data = undefined;
                shouldRevertOnPreconditions(transferFn, data, safe);
                shouldTransferTokenToRecipient(transferFn, [nft1], data, safe);
            });

            describe('batchTransferFrom(address,adress,uint256[])', function() {
                const transferFn = async function(from, to, tokenIds, data = undefined, signer = from) {
                    const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
                    return this.token.connect(signer).batchTransferFrom(from.address, to.address, ids);
                };
                const safe = false;
                const data = undefined;
                shouldRevertOnPreconditions(transferFn, data, safe);
                context('with an empty list of token', function() {
                    shouldTransferTokenToRecipient(transferFn, [], undefined, safe);
                });
                context('with a single token', function() {
                    shouldTransferTokenToRecipient(transferFn, [nft1], undefined, safe);
                });
                context('with a list of tokens from the same collection', function() {
                    shouldTransferTokenToRecipient(transferFn, [nft1, nft2], undefined, safe);
                });
                if (interfaces.ERC1155Inventory) {
                    context('[ERC1155Inventory] with a list of tokens sorted by collection', function() {
                        // TODO
                    });
                    context('[ERC1155Inventory] with an unsorted list of tokens from different collection', function() {
                        // TODO
                    });
                }
            });

            describe('safeTransferFrom(address,address,uint256)', function() {
                const transferFn = async function(from, to, tokenId, data = undefined, signer = from) {
                    //safeTransferFrom is overloaded so we specify the function signature
                    return this.token.connect(signer)['safeTransferFrom(address,address,uint256)'](from.address, to.address, tokenId);
                };
                const safe = true;
                const data = undefined;
                shouldRevertOnPreconditions(transferFn, data, safe);
                shouldTransferTokenToRecipient(transferFn, [nft1], data, safe);
            });

            describe('safeTransferFrom(address,address,uint256,bytes)', function() {
                const transferFn = async function(from, to, tokenId, data, signer = from) {
                    return this.token.connect(signer)['safeTransferFrom(address,address,uint256,bytes)'](from.address, to.address, tokenId, data);
                }
                const safe = true;
                const data = '0x42';
                shouldRevertOnPreconditions(transferFn, data, safe);
                shouldTransferTokenToRecipient(transferFn, [nft1], data, safe);
            });

            console.log({ approved })
        });

        describe('approve(address,address)', function() {
            const tokenId = nft3;

            let receipt = null;
            let approvedAddress = null;

            const itClearsApproval = function() {
                it('clears approval for the token', async function() {
                    expect(await this.token.getApproved(tokenId)).to.equal(ZeroAddress);
                });
            };

            const itApproves = function() {
                it('sets the approval for the target address', async function() {
                    console.log("this.approvedAddress", this.approvedAddress);
                    expect(await this.token.getApproved(tokenId)).to.equal(this.approvedAddress);
                });
            };

            const itEmitsApprovalEvent = function(address) {
                it('emits an Approval event', async function() {
                    await expect(this.receipt).to.emit(this.token, 'Approval')
                        .withArgs(owner.address, address, tokenId);
                });
            };

            context('when clearing approval', function() {
                context('when there was no prior approval', function() {
                    beforeEach(async function() {
                        this.receipt = await this.token.connect(owner).approve(ZeroAddress, tokenId);
                    });
                    itClearsApproval();
                    itEmitsApprovalEvent(ZeroAddress);
                });
                context('when there was a prior approval', function() {
                    beforeEach(async function() {
                        await this.token.connect(owner).approve(approved.address, tokenId);
                        this.receipt = await this.token.connect(owner).approve(ZeroAddress, tokenId);
                    });
                    itClearsApproval();
                    itEmitsApprovalEvent(ZeroAddress);
                });
            });

            context('when approving a non-zero address', function() {
                console.log("A approved", approved);
                context('when there was no prior approval', function() {
                    console.log("B approved", approved);
                    beforeEach(async function() {
                        console.log("C approved", approved.address);
                        this.approvedAddress = approved.address;
                        receipt = await this.token.connect(owner).approve(this.approvedAddress, tokenId);
                    });
                    itApproves();
                    //itEmitsApprovalEvent();
                });

            });



            //context


        });
    });
}

module.exports = {
    shouldBehaveLikeERC721Standard,
};