const {ethers} = require('hardhat');
const {expect} = require('chai');
const {constants} = ethers;
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721BatchTransfer({deploy, mint, interfaces, revertMessages, methods}) {
  const {'batchTransferFrom(address,address,uint256[])': batchTransferFrom_ERC721} = methods;

  describe('like an ERC721 BatchTransfer', function () {
    let accounts, deployer, owner, approved, operator, other;

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, approved, operator, other] = accounts;
    });

    const nft1 = 1;
    const nft2 = 2;
    const nft3 = 3;
    const unknownNFT = 1000;

    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, nft1, 1, deployer);
      await mint(this.token, owner.address, nft2, 1, deployer);
      await mint(this.token, owner.address, nft3, 1, deployer);
      await this.token.connect(owner).approve(approved.address, nft1);
      await this.token.connect(owner).approve(approved.address, nft2);
      await this.token.connect(owner).setApprovalForAll(operator.address, true);
      this.nftBalance = await this.token.balanceOf(owner.address);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    if (batchTransferFrom_ERC721 !== undefined) {
      const transferWasSuccessful = function (tokenIds, selfTransfer) {
        if (selfTransfer) {
          it('does not affect the token(s) ownership', async function () {
            for (const tokenId of tokenIds) {
              expect(await this.token.ownerOf(tokenId)).to.equal(this.from);
            }
          });
        } else {
          it('gives the token(s) ownership to the recipient', async function () {
            for (const tokenId of tokenIds) {
              expect(await this.token.ownerOf(tokenId)).to.equal(this.to);
            }
          });
        }

        it('clears the approval for the token(s)', async function () {
          for (const tokenId of tokenIds) {
            expect(await this.token.getApproved(tokenId)).to.equal(constants.AddressZero);
          }
        });

        it('emits Transfer event(s)', async function () {
          for (const tokenId of tokenIds) {
            await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(this.from, this.to, tokenId);
          }
        });

        if (selfTransfer) {
          it('does not affect the owner balance', async function () {
            expect(await this.token.balanceOf(this.from)).to.equal(this.nftBalance);
          });
        } else {
          it('decreases the owner balance', async function () {
            expect(await this.token.balanceOf(this.from)).to.equal(this.nftBalance - tokenIds.length);
          });

          it('increases the recipients balance', async function () {
            expect(await this.token.balanceOf(this.to)).to.equal(tokenIds.length);
          });
        }
      };

      const transfersBySender = function (tokenIds, selfTransfer = false) {
        context('when called by the owner', function () {
          this.beforeEach(async function () {
            this.receipt = await batchTransferFrom_ERC721(this.token, this.from, this.to, tokenIds, owner);
          });
          transferWasSuccessful(tokenIds, selfTransfer);
        });

        context('when called by a wallet with single token approval', function () {
          this.beforeEach(async function () {
            this.receipt = await batchTransferFrom_ERC721(this.token, this.from, this.to, tokenIds, approved);
          });
          transferWasSuccessful(tokenIds, selfTransfer);
        });

        context('when called by an operator', function () {
          this.beforeEach(async function () {
            this.receipt = await batchTransferFrom_ERC721(this.token, this.from, this.to, tokenIds, operator);
          });
          transferWasSuccessful(tokenIds, selfTransfer);
        });
      };

      const transfersByRecipient = function (ids) {
        context('when sent to another wallet', function () {
          beforeEach(async function () {
            this.from = owner.address;
            this.to = other.address;
          });
          transfersBySender(ids);
        });

        context('when sent to the same owner', function () {
          this.beforeEach(async function () {
            this.from = owner.address;
            this.to = owner.address;
          });
          transfersBySender(ids, true);
        });
      };

      describe('batchTransferFrom(address,adress,uint256[])', function () {
        describe('Pre-conditions', function () {
          it('reverts if transferred to the zero address', async function () {
            await expect(batchTransferFrom_ERC721(this.token, owner.address, constants.AddressZero, [nft1], owner)).to.be.revertedWith(
              revertMessages.TransferToAddressZero
            );
          });

          it('reverts if the token does not exist', async function () {
            await expect(batchTransferFrom_ERC721(this.token, owner.address, other.address, [unknownNFT], owner)).to.be.revertedWith(
              revertMessages.NonExistingToken
            );
          });

          it('reverts if `from` is not the token owner', async function () {
            await expect(batchTransferFrom_ERC721(this.token, other.address, other.address, [nft1], other)).to.be.revertedWith(
              revertMessages.NonOwnedToken
            );
          });

          it('reverts if the sender is not authorized for the token', async function () {
            await expect(batchTransferFrom_ERC721(this.token, owner.address, other.address, [nft1], other)).to.be.revertedWith(
              revertMessages.NonApproved
            );
          });
        });

        context('with an empty list of token', function () {
          transfersByRecipient([]);
        });
        context('with a single token', function () {
          transfersByRecipient([nft1]);
        });
        context('with a list of tokens', function () {
          transfersByRecipient([nft1, nft2]);
        });
      });
    }

    if (interfaces.ERC721BatchTransfer) {
      supportsInterfaces(['IERC721BatchTransfer']);
    }
  });
}

module.exports = {
  behavesLikeERC721BatchTransfer,
};
