const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {deployContract} = require('../../../../helpers/contract');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');
const {MaxUInt256, ZeroAddress} = require('../../../../../src/constants');
const ReceiverType = require('../../ReceiverType');
const {nonFungibleTokenId, isFungible} = require('../../token');

function behavesLikeERC1155Standard({revertMessages, interfaces, deploy, mint}) {
  let accounts, deployer, owner, approved, operator, other;

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer, owner, approved, operator, other] = accounts;
  });

  const fungible1 = {id: 1, supply: 10};
  const fungible2 = {id: 2, supply: 11};
  const fungible3 = {id: 3, supply: 12};
  const nft1 = nonFungibleTokenId(1);
  const nft2 = nonFungibleTokenId(2);
  const nonExistingNFT = nonFungibleTokenId(99);

  describe('like an ERC1155', function () {
    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, fungible1.id, fungible1.supply);
      await mint(this.token, owner.address, fungible2.id, fungible2.supply);
      await mint(this.token, owner.address, fungible3.id, fungible3.supply);
      await mint(this.token, owner.address, nft1, 1);
      await mint(this.token, owner.address, nft2, 1);
      await this.token.connect(owner).setApprovalForAll(operator.address, true);
      if (interfaces.ERC721) {
        await this.token.approve(approved, nft1);
        await this.token.approve(approved, nft2);
      }
      this.receiver721 = await deployContract('ERC721ReceiverMock', true, this.token.address);
      this.receiver1155 = await deployContract('ERC1155TokenReceiverMock', true, this.token.address);
      this.refusingReceiver1155 = await deployContract('ERC1155TokenReceiverMock', false, this.token.address);
      this.revertingReceiver1155 = await deployContract('ERC1155TokenReceiverMock', true, ZeroAddress);
      // this.receiver1155721 = await ERC1155721ReceiverMock.new(true, true, this.token.address);

      // pre-transfer state
      if (interfaces.ERC721) {
        this.nftBalance = await this.token.balanceOf(owner.address);
      }
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('balanceOf(address,uint256)', function () {
      it('reverts when queried about the zero address', async function () {
        await expect(this.token.balanceOf(ZeroAddress, nft1)).to.be.revertedWith(revertMessages.BalanceOfAddressZero);
        await expect(this.token.balanceOf(ZeroAddress, fungible1.id)).to.be.revertedWith(revertMessages.BalanceOfAddressZero);
      });

      // it('returns 1 for each Non-Fungible Token owned', async function () {
      //   (await this.token.balanceOf(owner, nft1)).should.be.bignumber.equal('1');
      //   (await this.token.balanceOf(owner, nft2)).should.be.bignumber.equal('1');
      //   (await this.token.balanceOf(owner, nftOtherCollection)).should.be.bignumber.equal('1');
      // });

      it('returns the balance of Fungible Tokens owned by the given address', async function () {
        expect(await this.token.balanceOf(owner.address, fungible1.id)).to.equal(fungible1.supply);
        expect(await this.token.balanceOf(owner.address, fungible2.id)).to.equal(fungible2.supply);
        expect(await this.token.balanceOf(other.address, nft1)).to.equal(0);
        expect(await this.token.balanceOf(other.address, fungible1.id)).to.equal(0);
      });
    });

    describe('balanceOfBatch(address[],uint256[])', function () {
      it('reverts with inconsistent arrays', async function () {
        await expect(this.token.balanceOfBatch([owner.address], [nft1, nft2])).to.be.revertedWith(revertMessages.InconsistentArrays);
      });

      it('reverts when queried about the zero address', async function () {
        await expect(this.token.balanceOfBatch([ZeroAddress], [nft1])).to.be.revertedWith(revertMessages.BalanceOfAddressZero);
      });

      context('when the given addresses own some tokens', function () {
        it('returns the amounts of tokens owned by the given addresses', async function () {
          let ids = [fungible1.id, fungible2.id, nft1, nft2, fungible1.id];
          const balances = await this.token.balanceOfBatch([owner.address, owner.address, owner.address, owner.address, other.address], ids);
          expect(balances[0]).to.equal(fungible1.supply);
          expect(balances[1]).to.equal(fungible2.supply);
          expect(balances[2]).to.equal(1);
          expect(balances[3]).to.equal(1);
          expect(balances[4]).to.equal(0);
        });
      });
    });

    describe('setApprovalForAll(address,bool)', function () {
      it('reverts in case of self-approval', async function () {
        await expect(this.token.connect(owner).setApprovalForAll(owner.address, true)).to.be.revertedWith(revertMessages.SelfApprovalForAll);
        await expect(this.token.connect(owner).setApprovalForAll(owner.address, false)).to.be.revertedWith(revertMessages.SelfApprovalForAll);
      });

      context('when setting an operator', function () {
        beforeEach(async function () {
          this.receipt = await this.token.connect(owner).setApprovalForAll(other.address, true);
        });
        it('sets the operator', async function () {
          expect(await this.token.isApprovedForAll(owner.address, other.address)).to.be.true;
        });
        it('emits an ApprovalForAll event', async function () {
          await expect(this.receipt).to.emit(this.token, 'ApprovalForAll').withArgs(owner.address, other.address, true);
        });
      });

      context('when unsetting an operator', function () {
        beforeEach(async function () {
          this.receipt = await this.token.connect(owner).setApprovalForAll(operator.address, false);
        });
        it('unsets the operator', async function () {
          expect(await this.token.isApprovedForAll(owner.address, operator.address)).to.be.false;
        });
        it('emits an ApprovalForAll event', async function () {
          await expect(this.receipt).to.emit(this.token, 'ApprovalForAll').withArgs(owner.address, operator.address, false);
        });
      });
    });

    describe('transfer', function () {
      const transferWasSuccessful = function (tokenIds, values, data, receiverType, selfTransfer) {
        const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
        const vals = Array.isArray(values) ? values : [values];
        const tokens = ids.map((id, i) => [id, vals[i]]);
        const fungibleTokens = tokens.filter(([id, _value]) => isFungible(id));
        const nonFungibleTokens = tokens.filter(([id, _value]) => !isFungible(id));

        if (tokens.length != 0) {
          if (selfTransfer) {
            it('does not affect the from balance(s)', async function () {
              for (const [id, _value] of tokens) {
                let balance;
                if (!isFungible(id)) {
                  balance = '1';
                } else {
                  if (id == fungible1.id) {
                    balance = fungible1.supply;
                  } else if (id == fungible2.id) {
                    balance = fungible2.supply;
                  } else if (id == fungible3.id) {
                    balance = fungible3.supply;
                  }
                }
                expect(await this.token.balanceOf(owner.address, id)).to.equal(balance);
              }
            });
          } else {
            it('decreases the from balance(s)', async function () {
              const amounts = {};
              for (const [id, value] of tokens) {
                if (amounts[id] !== undefined) {
                  amounts[id] += value;
                } else {
                  amounts[id] = value;
                }
              }
              for (const [id, amount] of Object.entries(amounts)) {
                let balance;
                if (!isFungible(id)) {
                  balance = '0';
                } else {
                  let initialBalance;
                  if (id == fungible1.id) {
                    initialBalance = fungible1.supply;
                  } else if (id == fungible2.id) {
                    initialBalance = fungible2.supply;
                  } else if (id == fungible3.id) {
                    initialBalance = fungible3.supply;
                  }
                  balance = initialBalance - amount;
                }
                expect(await this.token.balanceOf(owner.address, id)).to.equal(balance);
              }
            });

            it('increases the recipient balance(s)', async function () {
              const amounts = {};
              for (const [id, value] of tokens) {
                if (amounts[id] !== undefined) {
                  amounts[id] += value;
                } else {
                  amounts[id] = value;
                }
              }
              for (const [id, amount] of Object.entries(amounts)) {
                expect(await this.token.balanceOf(this.to, id)).to.equal(amount);
              }
            });
          }

          if (nonFungibleTokens.length != 0) {
            if (interfaces.ERC721) {
              if (selfTransfer) {
                it('[ERC721] does not affect the Non-Fungible Token(s) ownership', async function () {
                  for (const [id, _value] of nonFungibleTokens) {
                    expect(await this.token.ownerOf(id)).to.equal(owner.address);
                  }
                });
              } else {
                it('[ERC721] gives the ownership of the Non-Fungible Token(s) to the recipient', async function () {
                  for (const [id, _value] of nonFungibleTokens) {
                    expect(await this.token.ownerOf(id)).to.equal(this.to);
                  }
                });
              }
            }

            if (interfaces.ERC721) {
              if (selfTransfer) {
                it('[ERC721] does not affect the sender NFTs balance', async function () {
                  expect(await this.token.balanceOf(owner.address)).to.equal(this.nftBalance);
                });
              } else {
                it('[ERC721] decreases sender NFTs balance', async function () {
                  expect(await this.token.balanceOf(owner.address)).to.equal(this.nftBalance.sub(nonFungibleTokens.length));
                });

                it('[ERC721] increases recipient NFTs balance', async function () {
                  expect(await this.token.balanceOf(this.to)).to.equal(nonFungibleTokens.length);
                });
              }

              it('[ERC721] clears the Non-Fungible Token(s) approval', async function () {
                for (const [id, _value] of nonFungibleTokens) {
                  expect(await this.token.getApproved(id)).to.equal(ZeroAddress);
                }
              });

              it('[ERC721] emits Transfer event(s) for the Non-Fungible Token(s)', async function () {
                for (const [id, _value] of nonFungibleTokens) {
                  await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(owner.address, this.to, id);
                }
              });
            }
          }

          if (interfaces.ERC1155Inventory && fungibleTokens.length != 0) {
            it('[ERC1155Inventory] does not give the ownership for Fungible Token(s)', async function () {
              for (const [id, _value] of fungibleTokens) {
                await expect(this.token.ownerOf(id)).to.be.revertedWith(revertMessages.NonExistingNFT);
              }
            });
          }
        }

        if (Array.isArray(tokenIds)) {
          it('emits a TransferBatch event', async function () {
            await expect(this.receipt).to.emit(this.token, 'TransferBatch').withArgs(this.sender, owner.address, this.to, tokenIds, values);
          });
        } else {
          it('emits a TransferSingle event', async function () {
            await expect(this.receipt).to.emit(this.token, 'TransferSingle').withArgs(this.sender, owner.address, this.to, tokenIds, values);
          });
        }

        if (receiverType == ReceiverType.ERC1155_RECEIVER || receiverType == ReceiverType.ERC1155721_RECEIVER) {
          if (Array.isArray(tokenIds)) {
            it('[ERC1155] should call onERC1155BatchReceived', async function () {
              await expect(this.receipt)
                .to.emit(this.receiver1155, 'ERC1155BatchReceived')
                .withArgs(this.sender, owner.address, tokenIds, values, data);
            });
          } else {
            it('[ERC1155] should call onERC1155Received', async function () {
              await expect(this.receipt).to.emit(this.receiver1155, 'ERC1155Received').withArgs(this.sender, owner.address, tokenIds, values, data);
            });
          }
        }
      };

      const transfersBySender = function (transferFunction, tokenIds, values, data, receiverType, selfTransfer = false) {
        context('when called by the owner', function () {
          beforeEach(async function () {
            this.sender = owner.address;
            this.receipt = await transferFunction.call(this, owner.address, this.to, tokenIds, values, data, owner);
          });
          transferWasSuccessful(tokenIds, values, data, receiverType, selfTransfer);
        });

        context('when called by an operator', function () {
          beforeEach(async function () {
            this.sender = operator.address;
            this.receipt = await transferFunction.call(this, owner.address, this.to, tokenIds, values, data, operator);
          });
          transferWasSuccessful(tokenIds, values, data, receiverType, selfTransfer);
        });

        const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
        const approvedTokenIds = ids.filter((id) => id == nft1 || id == nft2);
        if (interfaces.ERC721 && ids.length != 0 && ids.length == approvedTokenIds.length) {
          context('[ERC721] when called by a wallet with single token approval', function () {
            beforeEach(async function () {
              this.sender = approved.address;
              this.receipt = await transferFunction.call(this, owner.address, this.to, tokenIds, values, data, approved);
            });
            transferWasSuccessful(tokenIds, values, data, receiverType, selfTransfer);
          });
        }
      };

      const transfersByRecipient = function (transferFunction, ids, values, data) {
        context('when sent to another wallet', function () {
          beforeEach(async function () {
            this.to = other.address;
          });
          transfersBySender(transferFunction, ids, values, data, ReceiverType.WALLET);
        });

        context('when sent to the same owner', function () {
          beforeEach(async function () {
            this.to = owner.address;
          });
          const selfTransfer = true;
          transfersBySender(transferFunction, ids, values, data, ReceiverType.WALLET, selfTransfer);
        });

        context('when sent to an ERC1155TokenReceiver contract', function () {
          beforeEach(async function () {
            this.to = this.receiver1155.address;
          });
          transfersBySender(transferFunction, ids, values, data, ReceiverType.ERC1155_RECEIVER);
        });

        // context('when sent to an ERC1155721TokenReceiver contract', function () {
        //   beforeEach(async function () {
        //     this.to = this.receiver1155721.address;
        //   });
        //   shouldTransferTokenBySender(transferFunction, ids, values, data, ReceiverType.ERC1155721_RECEIVER);
        // });
      };

      const revertsOnPreconditions = function (transferFunction) {
        describe('Pre-conditions', function () {
          const data = '0x42';
          it('reverts if transferred to the zero address', async function () {
            await expect(transferFunction.call(this, owner.address, ZeroAddress, nft1, 1, data, owner)).to.be.revertedWith(
              revertMessages.TransferToAddressZero
            );
          });

          it('reverts if the sender is not approved', async function () {
            await expect(transferFunction.call(this, owner.address, other.address, nft1, 1, data, other)).to.be.revertedWith(
              revertMessages.NonApproved
            );
            await expect(transferFunction.call(this, owner.address, other.address, fungible1.id, 1, data, other)).to.be.revertedWith(
              revertMessages.NonApproved
            );
          });

          it('reverts in case of balance overflow', async function () {
            await mint(this.token, other.address, fungible1.id, MaxUInt256);
            await expect(transferFunction.call(this, owner.address, other.address, fungible1.id, 1, data, owner)).to.be.revertedWith(
              revertMessages.BalanceOverflow
            );
          });

          if (interfaces.ERC721) {
            it('[ERC721] reverts if a Non-Fungible Token has a value different from 1', async function () {
              await expect(transferFunction.call(this, owner.address, other.address, nft1, 0, data, owner)).to.be.revertedWith(
                revertMessages.WrongNFTValue
              );
              await expect(transferFunction.call(this, owner.address, other.address, nft1, 2, data, owner)).to.be.revertedWith(
                revertMessages.WrongNFTValue
              );
            });

            it('[ERC721] reverts with a non-existing Non-Fungible Token', async function () {
              await expect(transferFunction.call(this, owner.address, other.address, nonExistingNFT, 1, data, owner)).to.be.revertedWith(
                revertMessages.NonOwnedNFT
              );
            });

            it('[ERC721] reverts if from is not the owner for a Non-Fungible Token', async function () {
              await expect(transferFunction.call(this, other.address, approved.address, nft1, 1, data, other)).to.be.revertedWith(
                revertMessages.NonOwnedNFT
              );
            });
          }

          it('reverts if from has insufficient balance for a Fungible Token', async function () {
            await expect(transferFunction.call(this, other.address, approved.address, fungible1.id, 1, data, other)).to.be.revertedWith(
              revertMessages.InsufficientBalance
            );
          });

          it('reverts when sent to a non-receiver contract', async function () {
            await expect(transferFunction.call(this, owner.address, this.token.address, nft1, 1, data, owner)).to.be.reverted;
          });

          it('reverts when sent to an ERC721Receiver', async function () {
            await expect(transferFunction.call(this, owner.address, this.receiver721.address, nft1, 1, data, owner)).to.be.reverted;
          });

          it('reverts when sent to an ERC1155TokenReceiver which refuses the transfer', async function () {
            await expect(transferFunction.call(this, owner.address, this.refusingReceiver1155.address, nft1, 1, data, owner)).to.be.revertedWith(
              revertMessages.TransferRejected
            );
          });

          it('reverts when sent to an ERC1155TokenReceiver which reverts', async function () {
            await expect(transferFunction.call(this, owner.address, this.revertingReceiver1155.address, nft1, 1, data, owner)).to.be.reverted;
          });
        });
      };

      describe('safeTransferFrom(address,address,uint256,uint256,bytes)', function () {
        const transferFn = async function (from, to, id, value, data, sender) {
          return this.token.connect(sender)['safeTransferFrom(address,address,uint256,uint256,bytes)'](from, to, id, value, data);
        };

        revertsOnPreconditions(transferFn);
        context('with a Fungible Token', function () {
          context('zero value transfer', function () {
            transfersByRecipient(transferFn, fungible1.id, 0, '0x42');
          });
          context('partial balance transfer', function () {
            transfersByRecipient(transferFn, fungible1.id, 1, '0x42');
          });
          context('full balance transfer', function () {
            transfersByRecipient(transferFn, fungible1.id, fungible1.supply, '0x42');
          });
        });
        context('with a Non-Fungible Token', function () {
          transfersByRecipient(transferFn, nft1, 1, '0x42');
        });
      });

      describe('safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)', function () {
        const transferFn = async function (from, to, ids, values, data, sender) {
          const ids_ = Array.isArray(ids) ? ids : [ids];
          const values_ = Array.isArray(values) ? values : [values];
          return this.token.connect(sender)['safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'](from, to, ids_, values_, data);
        };
        revertsOnPreconditions(transferFn);

        it('reverts with inconsistent arrays', async function () {
          await expect(transferFn.call(this, owner.address, other.address, [nft1, nft2], [1], '0x42', owner)).to.be.revertedWith(
            revertMessages.InconsistentArrays
          );
        });

        context('with an empty list of tokens', function () {
          transfersByRecipient(transferFn, [], [], '0x42');
        });
        context('with Fungible Tokens', function () {
          context('single zero value transfer', function () {
            transfersByRecipient(transferFn, [fungible1.id], [0], '0x42');
          });
          context('single partial balance transfer', function () {
            transfersByRecipient(transferFn, [fungible1.id], [1], '0x42');
          });
          context('single full balance transfer', function () {
            transfersByRecipient(transferFn, [fungible1.id], [fungible1.supply], '0x42');
          });
          context('multiple tokens transfer', function () {
            transfersByRecipient(
              transferFn,
              [fungible1.id, fungible2.id, fungible1.id, fungible3.id],
              [fungible1.supply - 1, 0, 1, fungible3.supply],
              '0x42'
            );
          });
        });
        context('with Non-Fungible Tokens', function () {
          context('single token transfer', function () {
            transfersByRecipient(transferFn, [nft1], [1], '0x42');
          });
          context('multiple tokens transfer', function () {
            transfersByRecipient(transferFn, [nft1, nft2], [1, 1], '0x42');
          });
        });
        context('with Fungible and Non-Fungible Tokens', function () {
          transfersByRecipient(transferFn, [fungible1.id, nft1, fungible2.id, nft2, fungible1.id], [fungible1.supply - 1, 1, 0, 1, 1], '0x42');
        });
      });
    });

    supportsInterfaces(['IERC165', 'IERC1155']);
  });
}

module.exports = {
  behavesLikeERC1155Standard,
};
