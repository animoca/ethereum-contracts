const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress } = require('../../../../../src/constants');
const ReceiverType = require('../../ReceiverType');
const { ethers } = require('hardhat');
const { shouldSupportInterfaces } = require('../../../introspection/behaviors/SupportsInterface.behavior');
const { deployTestHelperContract } = require('../../../../helpers/run');

function shouldBehaveLikeERC721Standard({ name, deploy, mint, revertMessages, interfaces, methods }) {
    //const { name, deploy, mint, revertMessages, interfaces, methods } = implementation;

    const { 'batchTransferFrom(address,address,uint256[])': batchTransferFrom_ERC721 } = methods;

    if (batchTransferFrom_ERC721 === undefined) {
        console.log(`ERC721: non-standard ERC721 method batchTransfer(address,uint256[]) is not supported by ${name}, associated tests will be skipped`);
    }

    describe('like an ERC721 Standard', function() {
        let accounts, deployer, owner, approved, anotherApproved, operator, other;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, owner, approved, anotherApproved, operator, other] = accounts;
        });

        const nft1 = 1;
        const nft2 = 2;
        const nft3 = 3;
        const unknownNFT = 1000;

        const fixture = async function() {
            this.token = await deploy(deployer);
            await mint(this.token, owner.address, nft1, 1, deployer);
            await mint(this.token, owner.address, nft2, 1, deployer);
            await mint(this.token, owner.address, nft3, 1, deployer);
            await this.token.connect(owner).setApprovalForAll(operator.address, true);
            this.receiver721 = await deployTestHelperContract('ERC721ReceiverMock', [true, this.token.address]);
            this.refusingReceiver721 = await deployTestHelperContract('ERC721ReceiverMock', [false, this.token.address]);
            this.wrongTokenReceiver721 = await deployTestHelperContract('ERC721ReceiverMock', [true, ZeroAddress]);
            this.nftBalance = await this.token.balanceOf(owner.address);
        };

        beforeEach(async function() {
            await loadFixture(fixture, this);
        });

        describe('balanceOf(address)', function() {
            context('when the given address owns some tokens', function() {
                it('returns the amount of tokens owned by the given address', async function() {
                    expect(await this.token.balanceOf(owner.address)).to.equal(3);
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
            const transferWasSuccessful = function(tokenIds, data, safe, receiverType, selfTransfer) {
                const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIDs];

                if (selfTransfer) {
                    it('does not affect the token(s) ownership', async function() {
                        for (const id of ids) {
                            expect(await this.token.ownerOf(id)).to.equal(owner.address);
                        }
                    });
                } else {
                    it('gives the token(s) ownership to the recipient', async function() {
                        for (const id of ids) {
                            expect(await this.token.ownerOf(id)).to.equal(this.toWhom.address);
                        }
                    });
                }

                it('clears the approval for the token(s)', async function() {
                    for (const id of ids) {
                        expect(await this.token.getApproved(id)).to.equal(ZeroAddress);
                    }
                });
                it('emits Transfer event(s)', async function() {
                    for (const id of ids) {
                        await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(owner.address, this.toWhom.address, id);
                    }
                });

                if (selfTransfer) {
                    it('does not affect the sender balance', async function() {
                        expect(await this.token.balanceOf(owner.address)).to.equal(this.nftBalance);
                    });
                } else {
                    it('decreases the sender balance', async function() {
                        expect(await this.token.balanceOf(owner.address)).to.equal(this.nftBalance - ids.length);
                    });

                    it('increases the recipients balance', async function() {
                        expect(await this.token.balanceOf(this.toWhom.address)).to.equal(ids.length);
                    });
                }

                if (safe && receiverType == ReceiverType.ERC721_RECEIVER) {
                    it('should call on ERC721Received', async function() {
                        await expect(this.receipt).to.emit(this.receiver721, 'Received');
                    });
                }
            };

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
                        this.receipt = await transferFunction.call(this, owner, this.toWhom, ids, data, (signer = operator));
                    });
                    transferWasSuccessful(ids, data, safe, receiverType, selfTransfer);
                });
            };

            const shouldRevertOnPreconditions = function(transferFunction, data, safe) {
                describe('Pre-conditions', function() {
                    if (interfaces.Pausable) {
                        it('[Pausable] reverts when paused', async function() {
                            await this.token.connect(deployer).pause();
                            await expect(transferFunction.call(this, owner, other, nft1, data)).to.be.revertedWith(revertMessages.AlreadyPaused);
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

                    it("doesn't revert if the sender is authorized for the token", async function() {
                        await this.token.connect(owner).approve(other.address, nft1);
                        await expect(transferFunction.call(this, owner, other, nft1, data, other));
                    });

                    if (safe) {
                        it('reverts when sent to a non-receiver contract', async function() {
                            await expect(transferFunction.call(this, owner, this.token, nft1, data)).to.be.reverted;
                        });
                        it('reverts when sent to an ERC721Receiver which refuses the transfer', async function() {
                            await expect(transferFunction.call(this, owner, this.refusingReceiver721, nft1, data)).to.be.revertedWith(
                                revertMessages.TransferRejected
                            );
                        });
                        it('reverts when sent to an ERC721Receiver which accepts another token', async function() {
                            await expect(transferFunction.call(this, owner, this.wrongTokenReceiver721, nft1, data)).to.be.reverted;
                        });
                    }
                });
            };

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
                    shouldTransferTokenBySender(transferFunction, ids, data, safe, ReceiverType.WALLET, selfTransfer);
                });

                context('when sent to an ERC721Receiver contract', function() {
                    this.beforeEach(async function() {
                        this.toWhom = this.receiver721;
                    });
                    shouldTransferTokenBySender(transferFunction, ids, data, safe, ReceiverType.ERC721_RECEIVER);
                });
            };

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
                if (batchTransferFrom_ERC721 === undefined) {
                    return;
                }
                const transferFn = async function(from, to, tokenIds, data = undefined, signer = from) {
                    const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
                    return batchTransferFrom_ERC721(this.token, from.address, to.address, ids, signer);
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
            });

            describe('safeTransferFrom(address,address,uint256)', function() {
                const transferFn = async function(from, to, tokenId, data = undefined, signer = from) {
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
                };
                const safe = true;
                const data = '0x42';
                shouldRevertOnPreconditions(transferFn, data, safe);
                shouldTransferTokenToRecipient(transferFn, [nft1], data, safe);
            });
        });

        describe('approve(address,address)', function() {
            const tokenId = nft3;

            const itClearsApproval = function() {
                it('clears approval for the token', async function() {
                    expect(await this.token.getApproved(tokenId)).to.equal(ZeroAddress);
                });
            };

            const itApproves = function() {
                it('sets the approval for the target address', async function() {
                    expect(await this.token.getApproved(tokenId)).to.equal(this.approvedAddress);
                });
            };

            const itEmitsApprovalEvent = function() {
                it('emits an Approval event', async function() {
                    await expect(this.receipt).to.emit(this.token, 'Approval').withArgs(owner.address, this.approvedAddress, tokenId);
                });
            };

            context('when clearing approval', function() {
                context('when there was no prior approval', function() {
                    beforeEach(async function() {
                        this.receipt = await this.token.connect(owner).approve(ZeroAddress, tokenId);
                        this.approvedAddress = ZeroAddress;
                    });
                    itClearsApproval();
                    itEmitsApprovalEvent();
                });
                context('when there was a prior approval', function() {
                    beforeEach(async function() {
                        await this.token.connect(owner).approve(approved.address, tokenId);
                        this.receipt = await this.token.connect(owner).approve(ZeroAddress, tokenId);
                        this.approvedAddress = ZeroAddress;
                    });
                    itClearsApproval();
                    itEmitsApprovalEvent();
                });
            });

            context('when approving a non-zero address', function() {
                context('when there was no prior approval', function() {
                    beforeEach(async function() {
                        this.receipt = await this.token.connect(owner).approve(approved.address, tokenId);
                        this.approvedAddress = approved.address;
                    });
                    itApproves();
                    itEmitsApprovalEvent();
                });

                context('when there was a prior approval to the same address', function() {
                    beforeEach(async function() {
                        await this.token.connect(owner).approve(approved.address, tokenId);
                        this.receipt = await this.token.connect(owner).approve(approved.address, tokenId);
                        this.approvedAddress = approved.address;
                    });
                    itApproves();
                    itEmitsApprovalEvent();
                });

                context('when there was a prior approval to a different address', function() {
                    this.beforeEach(async function() {
                        await this.token.connect(owner).approve(approved.address, tokenId);
                        this.receipt = await this.token.connect(owner).approve(anotherApproved.address, tokenId);
                        this.approvedAddress = anotherApproved.address;
                    });
                    itApproves();
                    itEmitsApprovalEvent();
                });
            });

            it('reverts in case of self-approval', async function() {
                await expect(this.token.connect(owner).approve(owner.address, tokenId)).to.be.revertedWith(revertMessages.SelfApproval);
            });

            it('reverts if the sender does not own the Non-Fungible Token', async function() {
                await expect(this.token.connect(other).approve(approved.address, tokenId)).to.be.revertedWith(revertMessages.NonApproved);
            });

            it('reverts if the sender is approved for the given Non-Fungible Token', async function() {
                await this.token.connect(owner).approve(approved.address, tokenId);
                await expect(this.token.connect(approved).approve(anotherApproved.address, tokenId)).to.be.revertedWith(revertMessages.NonApproved);
            });

            context('when the sender is an operator', function() {
                this.beforeEach(async function() {
                    await this.token.connect(owner).setApprovalForAll(operator.address, true);
                    this.receipt = await this.token.connect(operator).approve(approved.address, tokenId);
                    this.approvedAddress = approved.address;
                });
                itApproves();
                itEmitsApprovalEvent();
            });

            it('reverts if the Non-Fungible Token does not exist', async function() {
                await expect(this.token.connect(owner).approve(approved.address, unknownNFT)).to.be.revertedWith(revertMessages.NonExistingNFT);
            });
        });

        describe('getApproved(uint256)', function() {
            context('when the NFT exists', function() {
                context('when the owner has approved an operator for the NFT', function() {
                    it('returns the approved operator address', async function() {
                        await this.token.connect(owner).approve(approved.address, nft1);
                        const actual = await this.token.getApproved(nft1);
                        expect(actual).to.equal(approved.address);
                    });
                });

                context('when the owner has not approved an operator for the NFT', function() {
                    it('returns the zero address', async function() {
                        const actual = await this.token.getApproved(nft2);
                        expect(actual).to.equal(ZeroAddress);
                    });
                });
            });

            it('reverts if the NFT does not exist', async function() {
                await expect(this.token.getApproved(unknownNFT)).to.be.revertedWith(revertMessages.NonExistingNFT);
            });
        });

        describe('setApprovalForAll(address, bool)', function() {
            context('when the operatr being approved is not the owner', function() {
                const itApproves = function(isApproved) {
                    it(isApproved ? 'approves the operator' : 'unsets the operator approval', async function() {
                        expect(await this.token.isApprovedForAll(owner.address, this.approvedAddress)).to.equal(isApproved);
                    });
                };

                const itEmitsApprovalEvent = function(isApproved) {
                    it('emits an ApprovalForAll event', async function() {
                        await expect(this.receipt).to.emit(this.token, 'ApprovalForAll').withArgs(owner.address, this.approvedAddress, isApproved);
                    });
                };

                context('when the operator has never had an approval explicitly set', function() {
                    context('when setting the operator as approved', function() {
                        beforeEach(async function() {
                            this.receipt = await this.token.connect(owner).setApprovalForAll(operator.address, true);
                            this.approvedAddress = operator.address;
                        });
                        itApproves(true);
                        itEmitsApprovalEvent(true);
                    });

                    context('when unsetting the operator approval', function() {
                        this.beforeEach(async function() {
                            this.receipt = await this.token.connect(owner).setApprovalForAll(operator.address, false);
                            this.approvedAddress = operator.address;
                        });
                        itApproves(false);
                        itEmitsApprovalEvent(false);
                    });
                });

                context('when the operator approval was previously unset', function() {
                    beforeEach(async function() {
                        await this.token.connect(owner).setApprovalForAll(operator.address, false);
                    });
                    context('when setting the operator as approved', function() {
                        beforeEach(async function() {
                            this.receipt = await this.token.connect(owner).setApprovalForAll(operator.address, true);
                            this.approvedAddress = operator.address;
                        });
                        itApproves(true);
                        itEmitsApprovalEvent(true);
                    });

                    context('when unsetting the operator approved again', function() {
                        beforeEach(async function() {
                            this.receipt = await this.token.connect(owner).setApprovalForAll(operator.address, false);
                            this.approvedAddress = operator.address;
                        });
                        itApproves(false);
                        itEmitsApprovalEvent(false);
                    });
                });
            });

            it('reverts if operator being approved is the onwer', async function() {
                await expect(this.token.connect(owner).setApprovalForAll(owner.address, true)).to.be.revertedWith(revertMessages.SelfApprovalForAll);
            });
        });

        describe('isApprovedForAll(address,address)', function() {
            context('when the token owner has approved the operator', function() {
                it('returns true', async function() {
                    const actual = await this.token.isApprovedForAll(owner.address, operator.address);
                    expect(actual).to.equal(true);
                });
            });

            context('when the token owner has not approved the operator', function() {
                it('returns false', async function() {
                    const actual = await this.token.isApprovedForAll(owner.address, other.address);
                    expect(actual).to.equal(false);
                });
            });
        });

        shouldSupportInterfaces(['contracts/token/ERC721/interfaces/IERC721.sol:IERC721']);
    });
}

module.exports = {
    shouldBehaveLikeERC721Standard,
};