const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress, Zero } = require('../../../../../src/constants');
const { interfaces } = require('mocha');
const ReceiverType = require('../../ReceiverType');
const { ERC721_RECEIVER } = require('../../ReceiverType');
const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');

function shouldBehaveLikeERC721Burnable(implementation) {

    const { deploy, methods, contractName, revertMessages } = implementation;

    describe('like a Burnable ERC721', function() {
        let accounts, deployer, minter, owner, other, approved, operator;
        let receiver721;
        let nft1 = 1;
        let nft2 = 2;
        let unknownNFT = 1000;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, minter, owner, other, approved, operator] = accounts;
        });

        // TODO: Move to helper file
        async function deployERC721ReceiverMock(token) {
            const ERC721ReceiverMock = await ethers.getContractFactory('ERC721ReceiverMock');
            const acceptIncomingToken = true;
            const receivedTokenAddress = token.address;
            this.recipientContract = await ERC721ReceiverMock.deploy(acceptIncomingToken, receivedTokenAddress);
            await this.recipientContract.deployed();
            return this.recipientContract;
        }

        const fixture = async function() {
            this.token = await deploy(implementation.name, implementation.symbol, implementation.tokenURI, deployer);
            this.receiver721 = await deployERC721ReceiverMock(this.token);
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
                console.log("owner balance", await this.token.balanceOf(owner.address)); //1
                console.log("nftBlanace", this.nftBalance); //2
                console.log("ids.length", ids.length); //1
                expect(await this.token.balanceOf(owner.address)).to.equal(this.nftBalance - ids.length);
            });

            if (interfaces.ERC1155Inventory) {
                // TODO
            };
        };

        const shouldBurnTokenBySender = function(burnFunction, ids) {
            context('when called by the owner', function() {
                beforeEach(async function() {
                    receipt = await burnFunction.call(this, owner, ids, owner);
                });
                burnWasSuccessful(ids, owner);
            });
        }


        describe('burnFrom(address,uint256)', function() {
            const burnFn = async function(from, tokenId, signer = deployer) {
                    console.log("burnFN from.address", from.address);
                    console.log('burnFn tokenId', tokenId);
                    return this.token.connect(signer).burnFrom(from.address, tokenId);
                }
                // TODO: shouldRevertOnPreconditions(burnFn)
            context('with an empty list of tokens', function() {
                shouldBurnTokenBySender(burnFn, nft1);
            });
        });

    });


}

module.exports = {
    shouldBehaveLikeERC721Burnable,
};