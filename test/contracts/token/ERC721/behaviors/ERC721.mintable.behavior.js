const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress } = require('../../../../../src/constants');
const ReceiverType = require('../../ReceiverType');
const { ethers } = require('hardhat');
const { deployTestHelperContract } = require('../../../../helpers/run');

function behavesLikeERC721Mintable({ name, deploy, revertMessages, methods }) {

    const {
        'mint(address,uint256)': mint_ERC721,
        'batchMint(address,uint256[])': batchMint_ERC721,
        'safeMint(address,uint256,bytes)': safeMint_ERC721,
    } = methods;

    if (mint_ERC721 === undefined) {
        console.log(
            `ERC721Mintable: non-standard ERC721 method mint(address,uint256)` + ` is not supported by ${name}, associated tests will be skipped`
        );
    }
    if (batchMint_ERC721 === undefined) {
        console.log(
            `ERC721Mintable: non-standard ERC721 method batchMint(address,uint256[])` +
            `is not supported by ${contractName}, associated tests will be skipped`
        );
    }
    if (safeMint_ERC721 === undefined) {
        console.log(
            `ERC721Mintable: non-standard ERC721 method safeMint(address,uint256,bytes)` + ` is not supported by ${name}, associated tests will be skipped`
        );
    }

    describe('like a Mintable ERC721', function() {
        let accounts, deployer, owner;
        let nft1 = 1;
        let unknownNFT = 1000;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, owner] = accounts;
        });

        const fixture = async function() {
            this.token = await deploy(deployer);
            this.receiver721 = await deployTestHelperContract('ERC721ReceiverMock', [true, this.token.address]);
            this.refusingReceiver721 = await deployTestHelperContract('ERC721ReceiverMock', [false, this.token.address]);
            this.wrongTokenReceiver721 = await deployTestHelperContract('ERC721ReceiverMock', [true, ZeroAddress]);
        };

        beforeEach(async function() {
            await loadFixture(fixture, this);
        });

        const mintWasSuccessful = function(tokenIds, data, safe, receiverType) {
            const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
            it('gives the ownership of the token(s) to the given address', async function() {
                for (const id of ids) {
                    expect(await this.token.ownerOf(id)).to.equal(this.toWhom.address);
                }
            });

            it('has an empty approval for the token(s)', async function() {
                for (const id of ids) {
                    expect(await this.token.ownerOf(id)).to.equal(this.toWhom.address);
                }
            });

            it('emits Transfer event(s)', async function() {
                for (const id of ids) {
                    await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(ZeroAddress, this.toWhom.address, id);
                }
            });

            it('adjusts recipient balance', async function() {
                const quantity = Array.isArray(tokenIds) ? tokenIds.length : 1;
                expect(await this.token.balanceOf(this.toWhom.address)).to.equal(quantity);
            });

            if (safe && receiverType == ReceiverType.ERC721_RECEIVER) {
                it('should call onERC721Received', async function() {
                    await expect(this.receipt).to.emit(this.receiver721, 'Received');
                });
            }
        };

        const shouldRevertOnPreconditions = function(mintFunction, safe) {
            describe('Pre-conditions', function() {
                const data = '0x42';
                const signer = deployer;
                it('reverts if minted to the zero address', async function() {
                    await expect(mintFunction.call(this, { address: ZeroAddress }, nft1, data)).to.be.revertedWith(revertMessages.MintToZero);
                });
                it('reverts if the token already exists', async function() {
                    await mintFunction.call(this, owner, unknownNFT, data);
                    await expect(mintFunction.call(this, owner, unknownNFT, data)).to.be.revertedWith(revertMessages.ExistingOrBurntNFT);
                });
                it('reverts if sent by non-minter', async function() {
                    await expect(mintFunction.call(this, owner, nft1, data, owner)).to.be.revertedWith(revertMessages.NotMinter);
                });

                if (safe) {
                    it('reverts when sent to a non-receiver contract', async function() {
                        await expect(mintFunction.call(this, this.token, nft1, data)).to.be.reverted;
                    });
                    it('reverts when sent to an ERC721Receiver which refuses the transfer', async function() {
                        await expect(mintFunction.call(this, this.refusingReceiver721, nft1, data)).to.be.revertedWith(revertMessages.TransferRejected);
                    });
                    it('reverts when sent to an ERC721Receiver which accepts another token', async function() {
                        await expect(mintFunction.call(this, this.wrongTokenReceiver721, nft1, data)).to.be.reverted;
                    });
                }
            });
        };

        const shouldMintTokenToRecipient = function(mintFunction, ids, data, safe) {
            context('when sent to a wallet', function() {
                this.beforeEach(async function() {
                    this.toWhom = owner;
                    this.receipt = await mintFunction.call(this, this.toWhom, ids, data, deployer);
                });
                mintWasSuccessful(ids, data, safe, ReceiverType.WALLET);
            });

            context('when sent to an ERC721Receiver contract', function() {
                this.beforeEach(async function() {
                    this.toWhom = this.receiver721;
                    this.receipt = await mintFunction.call(this, this.toWhom, ids, data, deployer);
                });
                mintWasSuccessful(ids, data, safe, ReceiverType.ERC721_RECEIVER);
            });
        };

        context('mint(address, uint256)', function() {
            if (mint_ERC721 === undefined) {
                return;
            }

            const mintFn = async function(to, tokenId, data, signer = deployer) {
                return mint_ERC721(this.token, to.address, tokenId, signer);
            };
            const safe = false;
            const data = undefined;
            const nftId = 1;
            shouldRevertOnPreconditions(mintFn, safe);
            shouldMintTokenToRecipient(mintFn, nftId, data, safe);
        });

        context('batchMint(address, uint256[])', function() {
            if (batchMint_ERC721 === undefined) {
                return;
            }
            const mintFn = async function(to, tokenIds, data, signer = deployer) {
                const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
                return batchMint_ERC721(this.token, to.address, ids, signer);
            };
            const safe = false;
            shouldRevertOnPreconditions(mintFn, safe);
            context('with an empty list of tokens', function() {
                shouldMintTokenToRecipient(mintFn, [], undefined, safe);
            });
            context('with a single token', function() {
                const nft1 = 1;
                shouldMintTokenToRecipient(mintFn, [nft1], undefined, safe);
            });
            context('with a list of tokens from the same collection', function() {
                const nft1 = 1;
                const nft2 = 2;
                shouldMintTokenToRecipient(mintFn, [nft1, nft2], undefined, safe);
            });
        });

        context('safeMint(address,uint256,bytes)', function() {
            if (safeMint_ERC721 === undefined) {
                return;
            }
            const mintFn = async function(to, tokenId, data, signer = deployer) {
                return safeMint_ERC721(this.token, to.address, tokenId, data, signer);
            };
            const safe = true;
            const data = '0x42';
            const nftId = 1;
            shouldRevertOnPreconditions(mintFn, safe);
            shouldMintTokenToRecipient(mintFn, nftId, data, safe);
        });
    });
}

module.exports = {
    behavesLikeERC721Mintable,
};