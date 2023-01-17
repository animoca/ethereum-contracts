const {ethers} = require('hardhat');
const {expect} = require('chai');
const {constants} = ethers;
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');
const ReceiverType = require('../../ReceiverType');
const {nonFungibleTokenId, isFungible} = require('../../token');

function behavesLikeERC1155Deliverable({revertMessages, interfaces, methods, deploy, mint}) {
  let accounts, deployer, owner;

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer, owner] = accounts;
  });

  const fungible1 = {id: 1, supply: 10};
  const fungible2 = {id: 2, supply: 11};
  const fungible3 = {id: 3, supply: 12};

  const nft1 = nonFungibleTokenId(1);
  const nft2 = nonFungibleTokenId(2);

  describe('like an ERC1155 Deliverable', function () {
    const fixture = async function () {
      this.token = await deploy(deployer);
      this.receiver721 = await deployContract('ERC721ReceiverMock', true, this.token.address);
      this.receiver1155 = await deployContract('ERC1155TokenReceiverMock', true, this.token.address);
      this.refusingReceiver1155 = await deployContract('ERC1155TokenReceiverMock', false, this.token.address);
      this.revertingReceiver1155 = await deployContract('ERC1155TokenReceiverMock', true, constants.AddressZero);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    const mintWasSuccessful = function (tokenIds, values, data, receiverType) {
      const tokens = tokenIds.map((id, i) => [id, values[i]]);
      const fungibleTokens = tokens.filter(([id, _value]) => isFungible(id));
      const nonFungibleTokens = tokens.filter(([id, _value]) => !isFungible(id));

      if (tokens.length != 0) {
        it('increases the recipient balance(s)', async function () {
          const to = this.recipients[0];
          for (const [id, value] of tokens) {
            expect(await this.token.balanceOf(to, id)).to.equal(value);
          }
        });

        if (nonFungibleTokens.length != 0) {
          if (interfaces.ERC721) {
            it('[ERC721] gives the ownership of the Non-Fungible Token(s) to the recipient', async function () {
              const to = this.recipients[0];
              for (const [id, _value] of nonFungibleTokens) {
                expect(await this.token.ownerOf(id)).to.equal(to);
              }
            });

            it('[ERC721] sets an empty approval for the Non-Fungible Token(s)', async function () {
              for (const [id, _value] of nonFungibleTokens) {
                expect(await this.token.getApproved(id)).to.equal(constants.AddressZero);
              }
            });

            it('[ERC721] increases the recipient NFTs balance', async function () {
              const to = this.recipients[0];
              expect(await this.token.balanceOf(to)).to.equal(nonFungibleTokens.length);
            });

            it('[ERC721] emits Transfer event(s) for Non-Fungible Tokens', async function () {
              const to = this.recipients[0];
              for (const [id, _value] of nonFungibleTokens) {
                await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(constants.AddressZero, to, id);
              }
            });

            if (fungibleTokens.length != 0) {
              it('[ERC721] does not give the ownership for Fungible Token(s)', async function () {
                for (const [id, _value] of fungibleTokens) {
                  await expect(this.token.ownerOf(id)).to.be.revertedWith(revertMessages.NonExistingNFT);
                }
              });
            }
          }
        }
      }

      it('emits TransferSingle event(s)', async function () {
        const to = this.recipients[0];
        for (const [id, value] of tokens) {
          await expect(this.receipt).to.emit(this.token, 'TransferSingle').withArgs(deployer.address, constants.AddressZero, to, id, value);
        }
      });

      if (receiverType == ReceiverType.ERC1155_RECEIVER) {
        it('should call onERC1155Received', async function () {
          for (const [id, value] of tokens) {
            await expect(this.receipt)
              .to.emit(this.receiver1155, 'ERC1155Received')
              .withArgs(deployer.address, constants.AddressZero, id, value, data);
          }
        });
      }
    };

    const mintsByRecipient = function (mintFunction, ids, values, data) {
      context('when sent to a wallet', function () {
        beforeEach(async function () {
          this.recipients = ids.map(() => owner.address);
          this.receipt = await mintFunction.call(this, ids, values, data, deployer);
        });
        mintWasSuccessful(ids, values, data, ReceiverType.WALLET);
      });

      context('when sent to an ERC1155TokenReceiver contract', function () {
        beforeEach(async function () {
          this.recipients = ids.map(() => this.receiver1155.address);
          this.receipt = await mintFunction.call(this, ids, values, data, deployer);
        });
        mintWasSuccessful(ids, values, data, ReceiverType.ERC1155_RECEIVER);
      });
    };

    describe('safeDeliver(address[],uint256[],uint256[],bytes)', function () {
      const mintFn = async function (ids, values, data, sender) {
        return this.token.connect(sender).safeDeliver(this.recipients, ids, values, data);
      };

      it('reverts with inconsistent arrays', async function () {
        this.recipients = [owner.address];
        await expect(mintFn.call(this, [nft1, nft2], [1], '0x42', deployer)).to.be.revertedWith(revertMessages.InconsistentArrays);
        await expect(mintFn.call(this, [nft1], [1, 1], '0x42', deployer)).to.be.revertedWith(revertMessages.InconsistentArrays);
      });

      it('reverts if the sender is not a Minter', async function () {
        this.recipients = [owner.address];
        await expect(mintFn.call(this, [nft1], [1], '0x42', owner)).to.be.revertedWith(revertMessages.NotMinter);
      });

      it('reverts if transferred to the zero address', async function () {
        this.recipients = [constants.AddressZero];
        await expect(mintFn.call(this, [nft1], [1], '0x42', deployer)).to.be.revertedWith(revertMessages.MintToAddressZero);
      });

      it('reverts if a Fungible Token has an overflowing balance', async function () {
        this.recipients = [owner.address];
        await mintFn.call(this, [fungible1.id], [constants.MaxUint256], '0x42', deployer);
        await expect(mintFn.call(this, [fungible1.id], [1], '0x42', deployer)).to.be.revertedWith(revertMessages.BalanceOverflow);
      });

      if (interfaces.ERC721) {
        it('[ERC721] reverts if a Non-Fungible Token has a value different from 1', async function () {
          this.recipients = [owner.address];
          await expect(mintFn.call(this, [nft1], [0], '0x42', deployer)).to.be.revertedWith(revertMessages.WrongNFTValue);
          await expect(mintFn.call(this, [nft1], [2], '0x42', deployer)).to.be.revertedWith(revertMessages.WrongNFTValue);
        });

        it('[ERC721] reverts with an existing Non-Fungible Token', async function () {
          this.recipients = [owner.address];
          await mintFn.call(this, [nft1], [1], data, deployer);
          await expect(mintFn.call(this, [nft1], [1], '0x42', deployer)).to.be.revertedWith(revertMessages.ExistingNFT);
        });
      }

      it('reverts when sent to a non-receiver contract', async function () {
        this.recipients = [this.token.address];
        await expect(mintFn.call(this, [nft1], [1], '0x42', deployer)).to.be.reverted;
      });
      it('reverts when sent to an ERC721Receiver', async function () {
        this.recipients = [this.receiver721.address];
        await expect(mintFn.call(this, [nft1], [1], '0x42', deployer)).to.be.reverted;
      });
      it('reverts when sent to an ERC1155TokenReceiver which refuses the transfer', async function () {
        this.recipients = [this.refusingReceiver1155.address];
        await expect(mintFn.call(this, [nft1], [1], '0x42', deployer)).to.be.revertedWith(revertMessages.TransferRejected);
      });
      it('reverts when sent to an ERC1155TokenReceiver which reverts', async function () {
        this.recipients = [this.revertingReceiver1155.address];
        await expect(mintFn.call(this, [nft1], [1], '0x42', deployer)).to.be.reverted;
      });

      context('with an empty list of tokens', function () {
        mintsByRecipient(mintFn, [], [], '0x42');
      });

      context('with Fungible Tokens', function () {
        context('single minting (zero value)', function () {
          mintsByRecipient(mintFn, [fungible1.id], [0], '0x42');
        });

        context('single minting', function () {
          mintsByRecipient(mintFn, [fungible1.id], [fungible1.supply], '0x42');
        });

        context('multiple tokens transfer', function () {
          mintsByRecipient(mintFn, [fungible1.id, fungible2.id, fungible3.id], [fungible1.supply, 0, fungible3.supply], '0x42');
        });
      });

      context('with Non-Fungible Tokens', function () {
        context('single token transfer', function () {
          mintsByRecipient(mintFn, [nft1], [1], '0x42');
        });

        context('multiple tokens transfer', function () {
          mintsByRecipient(mintFn, [nft1, nft2], [1, 1], '0x42');
        });
      });

      context('with Fungible and Non-Fungible Tokens', function () {
        context('multiple tokens sorted by Non-Fungible Collection transfer', function () {
          mintsByRecipient(mintFn, [fungible1.id, nft1, fungible2.id, nft2], [0, 1, fungible2.supply, 1], '0x42');
        });
      });
    });

    if (interfaces.ERC1155Deliverable) {
      supportsInterfaces(['IERC1155Deliverable']);
    }
  });
}

module.exports = {
  behavesLikeERC1155Deliverable,
};
