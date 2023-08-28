const {ethers} = require('hardhat');
const {constants} = ethers;
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');
const ReceiverType = require('../../ReceiverType');
const {nonFungibleTokenId, isFungible} = require('../../token');

function behavesLikeERC1155Mintable({errors, interfaces, methods, deploy}) {
  let accounts, deployer, owner, other;

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer, owner, other] = accounts;
  });

  const {'safeMint(address,uint256,uint256,bytes)': safeMint, 'safeBatchMint(address,uint256[],uint256[],bytes)': safeBatchMint} = methods || {};

  const fungible1 = {id: 1, supply: 10};
  const fungible2 = {id: 2, supply: 11};
  const fungible3 = {id: 3, supply: 12};

  const nft1 = nonFungibleTokenId(1);
  const nft2 = nonFungibleTokenId(2);

  describe('like an ERC1155 Mintable', function () {
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
      const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
      const vals = Array.isArray(values) ? values : [values];
      const tokens = ids.map((id, i) => [id, vals[i]]);
      const fungibleTokens = tokens.filter(([id, _value]) => isFungible(id));
      const nonFungibleTokens = tokens.filter(([id, _value]) => !isFungible(id));

      if (tokens.length != 0) {
        it('increases the recipient balance(s)', async function () {
          for (const [id, value] of tokens) {
            expect(await this.token.balanceOf(this.to, id)).to.equal(value);
          }
        });

        // if (nonFungibleTokens.length != 0) {
        //   if (interfaces && interfaces.ERC721) {
        //     it('[ERC721] gives the ownership of the Non-Fungible Token(s) to the recipient', async function () {
        //       for (const [id, _value] of nonFungibleTokens) {
        //         expect(await this.token.ownerOf(id)).to.equal(this.to);
        //       }
        //     });

        //     it('[ERC721] sets an empty approval for the Non-Fungible Token(s)', async function () {
        //       for (const [id, _value] of nonFungibleTokens) {
        //         expect(await this.token.getApproved(id)).to.equal(constants.AddressZero);
        //       }
        //     });

        //     it('[ERC721] increases the recipient NFTs balance', async function () {
        //       expect(await this.token.balanceOf(this.to)).to.equal(nonFungibleTokens.length);
        //     });

        //     it('[ERC721] emits Transfer event(s) for Non-Fungible Tokens', async function () {
        //       for (const [id, _value] of nonFungibleTokens) {
        //         await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(constants.AddressZero, this.to, id);
        //       }
        //     });

        //     if (fungibleTokens.length != 0) {
        //       it('[ERC721] does not give the ownership for Fungible Token(s)', async function () {
        //         for (const [id, _value] of fungibleTokens) {
        //           await expect(this.token.ownerOf(id)).to.be.revertedWith(revertMessages.NonExistingNFT);
        //         }
        //       });
        //     }
        //   }
        // }
      }

      if (Array.isArray(tokenIds)) {
        it('emits a TransferBatch event', async function () {
          await expect(this.receipt)
            .to.emit(this.token, 'TransferBatch')
            .withArgs(deployer.address, constants.AddressZero, this.to, tokenIds, values);
        });
      } else {
        it('emits a TransferSingle event', async function () {
          await expect(this.receipt)
            .to.emit(this.token, 'TransferSingle')
            .withArgs(deployer.address, constants.AddressZero, this.to, tokenIds, values);
        });
      }

      if (receiverType == ReceiverType.ERC1155_RECEIVER) {
        if (Array.isArray(tokenIds)) {
          it('should call onERC1155BatchReceived', async function () {
            await expect(this.receipt)
              .to.emit(this.receiver1155, 'ERC1155BatchReceived')
              .withArgs(deployer.address, constants.AddressZero, tokenIds, values, data);
          });
        } else {
          it('should call onERC1155Received', async function () {
            await expect(this.receipt)
              .to.emit(this.receiver1155, 'ERC1155Received')
              .withArgs(deployer.address, constants.AddressZero, tokenIds, values, data);
          });
        }
      }
    };

    const revertsOnPreconditions = function (mintFn, isBatch) {
      const data = '0x42';
      describe('Pre-conditions', function () {
        it('reverts if the sender is not a Minter', async function () {
          this.to = owner.address;
          await expectRevert(mintFn.call(this, nft1, 1, data, other), this.token, errors.NotMinter, {
            role: await this.token.MINTER_ROLE(),
            account: other.address,
          });
        });

        it('reverts if transferred to the zero address', async function () {
          this.to = constants.AddressZero;
          await expectRevert(mintFn.call(this, nft1, 1, data, deployer), this.token, errors.MintToAddressZero);
        });

        it('reverts if a Fungible Token has an overflowing balance', async function () {
          this.to = owner.address;
          await mintFn.call(this, fungible1.id, constants.MaxUint256, data, deployer);
          await expectRevert(mintFn.call(this, fungible1.id, 1, data, deployer), this.token, errors.BalanceOverflow, {
            recipient: owner.address,
            id: fungible1.id,
            balance: constants.MaxUint256,
            value: 1,
          });
        });

        // if (interfaces && interfaces.ERC721) {
        //   it('[ERC721] reverts if a Non-Fungible Token has a value different from 1', async function () {
        //     this.to = other.address;
        //     await expect(mintFn.call(this, nft1, 0, data, deployer)).to.be.revertedWith(revertMessages.WrongNFTValue);
        //     await expect(mintFn.call(this, nft1, 2, data, deployer)).to.be.revertedWith(revertMessages.WrongNFTValue);
        //   });

        //   it('[ERC721] reverts with an existing Non-Fungible Token', async function () {
        //     this.to = owner.address;
        //     await mintFn.call(this, nft1, 1, data, deployer);
        //     await expect(mintFn.call(this, nft1, 1, data, deployer)).to.be.revertedWith(revertMessages.ExistingNFT);
        //   });
        // }

        it('reverts when sent to a non-receiver contract', async function () {
          this.to = this.token.address;
          await expect(mintFn.call(this, nft1, 1, data, deployer)).to.be.reverted;
        });
        it('reverts when sent to an ERC721Receiver', async function () {
          this.to = this.receiver721.address;
          await expect(mintFn.call(this, nft1, 1, data, deployer)).to.be.reverted;
        });
        it('reverts when sent to an ERC1155TokenReceiver which refuses the transfer', async function () {
          this.to = this.refusingReceiver1155.address;
          if (isBatch) {
            await expectRevert(mintFn.call(this, nft1, 1, data, deployer), this.token, errors.SafeBatchTransferRejected, {
              recipient: this.refusingReceiver1155.address,
              ids: [nft1],
              values: [1],
            });
          } else {
            await expectRevert(mintFn.call(this, nft1, 1, data, deployer), this.token, errors.SafeTransferRejected, {
              recipient: this.refusingReceiver1155.address,
              id: nft1,
              value: 1,
            });
          }
        });
        it('reverts when sent to an ERC1155TokenReceiver which reverts', async function () {
          this.to = this.revertingReceiver1155.address;
          await expect(mintFn.call(this, nft1, 1, data, deployer)).to.be.reverted;
        });
      });
    };

    const mintsByRecipient = function (mintFunction, ids, values, data) {
      context('when sent to a wallet', function () {
        beforeEach(async function () {
          this.to = owner.address;
          this.receipt = await mintFunction.call(this, ids, values, data, deployer);
        });
        mintWasSuccessful(ids, values, data, ReceiverType.WALLET);
      });

      context('when sent to an ERC1155TokenReceiver contract', function () {
        beforeEach(async function () {
          this.to = this.receiver1155.address;
          this.receipt = await mintFunction.call(this, ids, values, data, deployer);
        });
        mintWasSuccessful(ids, values, data, ReceiverType.ERC1155_RECEIVER);
      });
    };

    if (safeMint !== undefined) {
      describe('safeMint(address,uint256,uint256,bytes)', function () {
        const mintFn = async function (id, value, data, sender) {
          return safeMint(this.token, this.to, id, value, data, sender);
        };

        revertsOnPreconditions(mintFn, false);

        context('with a Fungible Token (zero value)', function () {
          mintsByRecipient(mintFn, fungible1.id, 0, '0x42');
        });

        context('with a Fungible Token', function () {
          mintsByRecipient(mintFn, fungible1.id, fungible1.supply, '0x42');
        });

        context('with a Non-Fungible Token', function () {
          mintsByRecipient(mintFn, nft1, 1, '0x42');
        });
      });
    }

    if (safeBatchMint !== undefined) {
      describe('safeBatchMint(address,uint256[],uint256[],bytes)', function () {
        const mintFn = async function (ids, values, data, sender) {
          const tokenIds = Array.isArray(ids) ? ids : [ids];
          const vals = Array.isArray(values) ? values : [values];
          return safeBatchMint(this.token, this.to, tokenIds, vals, data, sender);
        };

        revertsOnPreconditions(mintFn, true);

        it('reverts with inconsistent arrays', async function () {
          this.to = owner.address;
          await expectRevert(mintFn.call(this, [nft1, nft2], [1], '0x42', deployer), this.token, errors.InconsistentArrayLengths);
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

          context('multiple minting', function () {
            mintsByRecipient(mintFn, [fungible1.id, fungible2.id, fungible3.id], [fungible1.supply, 0, fungible3.supply], '0x42');
          });
        });

        context('with Non-Fungible Tokens', function () {
          context('single minting', function () {
            mintsByRecipient(mintFn, [nft1], [1], '0x42');
          });

          context('multiple minting', function () {
            mintsByRecipient(mintFn, [nft1, nft2], [1, 1], '0x42');
          });
        });

        context('with Fungible and Non-Fungible Tokens', function () {
          context('multiple minting', function () {
            mintsByRecipient(mintFn, [fungible1.id, nft1, fungible2.id, nft2], [0, 1, fungible2.supply, 1], '0x42');
          });
        });
      });
    }

    if (interfaces && interfaces.ERC1155Mintable) {
      supportsInterfaces(['IERC1155Mintable']);
    }
  });
}

module.exports = {
  behavesLikeERC1155Mintable,
};
