const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress, Zero } = require('../../../../../src/constants');
const { interfaces } = require('mocha');
const ReceiverType = require('../../ReceiverType');
const { ERC721_RECEIVER } = require('../../ReceiverType');
const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');

function shouldBehaveLikeERC721Mintable(implementation) {

    const { deploy, methods, contractName, revertMessages } = implementation;

    describe('like a Mintable ERC721', function() {
        let accounts, deployer, minter, owner;
        let receiver721;
        let nft1 = 1;
        let unknownNFT = 1000;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, owner] = accounts;
        });

        // TODO: Move to helper file
        async function deployERC721Mock(token) {
            const ERC721ReceiverMock = await ethers.getContractFactory('ERC721ReceiverMock');
            const acceptIncomingToken = true;
            const receivedTokenAddress = token.address;
            this.recipientContract = await ERC721ReceiverMock.deploy(acceptIncomingToken, receivedTokenAddress);
            await this.recipientContract.deployed();
            return this.recipientContract;
        }


        const fixture = async function() {
            this.token = await deploy(implementation.name, implementation.symbol, implementation.tokenURI, deployer);
            this.receiver721 = await deployERC721Mock(this.token);
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
                    await expect(this.receipt).to.emit(this.token, 'Transfer')
                        .withArgs(ZeroAddress, this.toWhom.address, id);
                }
            });

            if (interfaces.ERC1155) {
                // TODO
            }

            it('adjusts recipient balance', async function() {
                const quantity = Array.isArray(tokenIds) ? tokenIds.length : 1;
                expect(await this.token.balanceOf(this.toWhom.address)).to.equal(quantity);
            });

            if (interfaces.ERC1155Inventory) {
                // TODO
            }

            if (safe && receiverType == ReceiverType.ERC721_RECEIVER) {
                it("should call onERC721Received", async function() {
                    // TODO
                });
            }
        }

        const shouldRevertOnPreconditions = function(mintFunction, safe) {
            // TODO
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
                it("reverts if sent by non-minter", async function() {
                    // TODO: how are minters set
                    //const signer = owner;
                    //await expect(mintFunction.call(this, owner, unknownNFT, data, signer)).to.be.revertedWith(revertMessages.NotMinter);
                });
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
                    this.toWhom = owner;
                    this.receipt = await mintFunction.call(this, this.toWhom, ids, data, deployer);
                });
                mintWasSuccessful(ids, data, safe, ReceiverType.ERC721_RECEIVER);
            });

            if (!interfaces.ERC1155) {
                //TODO
            }
        };

        context('mint(address, uint256)', function() {
            const mintFn = async function(to, tokenId, data, signer = deployer) {
                return this.token.connect(signer).mint(to.address, tokenId);
            };
            const safe = false;
            const data = undefined;
            const nftId = 1;
            shouldRevertOnPreconditions(mintFn, safe);
            shouldMintTokenToRecipient(mintFn, nftId, data, safe);
        });

        context('batchMint(address, uint256[])', function() {
            const mintFn = async function(to, tokenIds, data, signer = deployer) {
                const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
                return this.token.connect(signer).batchMint(to.address, ids);
            };
            const safe = false;
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
            if (interfaces.ERC1155Inventory) {
                // TODO
            }
        });

        context('safeMint(address,uint256,bytes)', function() {
            const mintFn = async function(to, tokenId, data, signer = deployer) {
                return this.token.connect(signer).safeMint(to.address, tokenId, data);
            };
            const safe = true;
            const data = '0x42';
            const nftId = 1;
            shouldMintTokenToRecipient(mintFn, nftId, data, safe);
        });
    });
}

module.exports = {
    shouldBehaveLikeERC721Mintable,
};