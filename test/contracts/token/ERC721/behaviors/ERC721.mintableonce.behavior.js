const { loadFixture } = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress, Zero } = require('../../../../../src/constants');
const { interfaces } = require('mocha');
const ReceiverType = require('../../ReceiverType');
const { ERC721_RECEIVER } = require('../../ReceiverType');

function shouldBehaveLikeERC721MintableOnce(implementation) {

    const { deploy, methods, contractName, revertMessages } = implementation;

    describe('like a MintableOnce ERC721', function() {
        let accounts, deployer, minter, owner;

        before(async function() {
            accounts = await ethers.getSigners();
            [deployer, owner] = accounts;
        });

        const fixture = async function() {
            this.token = await deploy(implementation.name, implementation.symbol, implementation.tokenURI);
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
                // TODO
            });

            if (interfaces.ERC1155Inventory) {
                // TODO
            }

            if (safe && receiverType == ReceiverType.ERC721_RECEIVER) {
                // TODO
            }
        }

        const shouldRevertOnPreconditions = function(mintFunction, safe) {
            // TODO
        };

        const shouldMintTokenToRecipient = function(mintFunction, ids, data, safe) {
            context('when sent to a wallet', function() {
                this.beforeEach(async function() {
                    this.toWhom = owner;
                    this.receipt = await mintFunction.call(this, this.toWhom, ids, data, deployer);
                });
                mintWasSuccessful(ids, data, safe, ReceiverType.WALLET);
            });
        };

        context('mintOnce(address, uint256)', function() {
            const mintFn = async function(to, tokenId, _data, signer = deployer) {
                return this.token.connect(signer).mintOnce(to.address, tokenId);
            };
            const safe = false;
            const data = undefined;
            const nftId = 1;
            shouldMintTokenToRecipient(mintFn, nftId, data, safe);
        });
    });
}

module.exports = {
    shouldBehaveLikeERC721MintableOnce,
};