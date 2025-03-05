const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC1155Standard({errors, deploy, mint}, operatorFilterRegistryAddress = null) {
  let accounts, deployer, owner, approved, operator, other;

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer, owner, approved, operator, other] = accounts;
  });

  const token1 = {id: 1n, supply: 10n};
  const token2 = {id: 2n, supply: 11n};
  const token3 = {id: 3n, supply: 12n};

  describe('like an ERC1155', function () {
    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, token1.id, token1.supply);
      await mint(this.token, owner.address, token2.id, token2.supply);
      await mint(this.token, owner.address, token3.id, token3.supply);
      await this.token.connect(owner).setApprovalForAll(operator.address, true);
      this.receiver1155 = await deployContract('ERC1155TokenReceiverMock', true, this.token.getAddress());
      this.refusingReceiver1155 = await deployContract('ERC1155TokenReceiverMock', false, this.token.getAddress());
      this.revertingReceiver1155 = await deployContract('ERC1155TokenReceiverMock', true, ethers.ZeroAddress);
      if (operatorFilterRegistryAddress !== null) {
        await this.token.updateOperatorFilterRegistry(operatorFilterRegistryAddress);
      }
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('balanceOf(address,uint256)', function () {
      it('reverts when queried about the zero address', async function () {
        await expectRevert(this.token.balanceOf(ethers.ZeroAddress, token1.id), this.token, errors.BalanceOfAddressZero);
      });

      it('returns the balance of tokens owned by the given address', async function () {
        expect(await this.token.balanceOf(owner.address, token1.id)).to.equal(token1.supply);
        expect(await this.token.balanceOf(owner.address, token2.id)).to.equal(token2.supply);
        expect(await this.token.balanceOf(other.address, token1.id)).to.equal(0n);
      });
    });

    describe('balanceOfBatch(address[],uint256[])', function () {
      it('reverts with inconsistent arrays', async function () {
        await expectRevert(this.token.balanceOfBatch([owner.address], [token1.id, token2.id]), this.token, errors.InconsistentArrayLengths);
      });

      it('reverts when queried about the zero address', async function () {
        await expectRevert(this.token.balanceOfBatch([ethers.ZeroAddress], [token1.id]), this.token, errors.BalanceOfAddressZero);
      });

      context('when the given addresses own some tokens', function () {
        it('returns the amounts of tokens owned by the given addresses', async function () {
          let ids = [token1.id, token2.id, token1.id];
          const balances = await this.token.balanceOfBatch([owner.address, owner.address, other.address], ids);
          expect(balances[0]).to.equal(token1.supply);
          expect(balances[1]).to.equal(token2.supply);
          expect(balances[2]).to.equal(0n);
        });
      });
    });

    describe('setApprovalForAll(address,bool)', function () {
      it('reverts in case of self-approval', async function () {
        await expectRevert(this.token.connect(owner).setApprovalForAll(owner.address, true), this.token, errors.SelfApprovalForAll, {
          account: owner.address,
        });
        await expectRevert(this.token.connect(owner).setApprovalForAll(owner.address, false), this.token, errors.SelfApprovalForAll, {
          account: owner.address,
        });
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
      const transferWasSuccessful = function (tokenIds, values, data, isERC1155Receiver, selfTransfer) {
        const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
        const vals = Array.isArray(values) ? values : [values];
        const tokens = ids.map((id, i) => [id, vals[i]]);

        if (tokens.length != 0) {
          if (selfTransfer) {
            it('does not affect the from balance(s)', async function () {
              for (const [id] of tokens) {
                let balance;
                if (id == token1.id) {
                  balance = token1.supply;
                } else if (id == token2.id) {
                  balance = token2.supply;
                } else if (id == token3.id) {
                  balance = token3.supply;
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
                let initialBalance;
                if (id == token1.id) {
                  initialBalance = token1.supply;
                } else if (id == token2.id) {
                  initialBalance = token2.supply;
                } else if (id == token3.id) {
                  initialBalance = token3.supply;
                }
                balance = initialBalance - amount;
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

        if (isERC1155Receiver) {
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

      const transfersBySender = function (transferFunction, tokenIds, values, data, isERC1155Receiver, selfTransfer = false) {
        context('when called by the owner', function () {
          beforeEach(async function () {
            this.sender = owner.address;
            this.receipt = await transferFunction.call(this, owner.address, this.to, tokenIds, values, data, owner);
          });
          transferWasSuccessful(tokenIds, values, data, isERC1155Receiver, selfTransfer);
        });

        context('when called by an operator', function () {
          beforeEach(async function () {
            this.sender = operator.address;
            this.receipt = await transferFunction.call(this, owner.address, this.to, tokenIds, values, data, operator);
          });
          transferWasSuccessful(tokenIds, values, data, isERC1155Receiver, selfTransfer);
        });
      };

      const transfersByRecipient = function (transferFunction, ids, values, data) {
        context('when sent to another wallet', function () {
          beforeEach(async function () {
            this.to = other.address;
          });
          transfersBySender(transferFunction, ids, values, data, false);
        });

        context('when sent to the same owner', function () {
          beforeEach(async function () {
            this.to = owner.address;
          });
          const selfTransfer = true;
          transfersBySender(transferFunction, ids, values, data, false, selfTransfer);
        });

        context('when sent to an ERC1155TokenReceiver contract', function () {
          beforeEach(async function () {
            this.to = await this.receiver1155.getAddress();
          });
          transfersBySender(transferFunction, ids, values, data, true);
        });
      };

      const revertsOnPreconditions = function (transferFunction, isBatch) {
        describe('Pre-conditions', function () {
          const data = '0x42';

          it('reverts if transferred to the zero address', async function () {
            await expectRevert(
              transferFunction.call(this, owner.address, ethers.ZeroAddress, token1.id, 1n, data, owner),
              this.token,
              errors.TransferToAddressZero,
            );
          });

          it('reverts if the sender is not approved', async function () {
            await expectRevert(
              transferFunction.call(this, owner.address, other.address, token1.id, 1n, data, other),
              this.token,
              errors.NonApproved,
              {
                sender: other.address,
                owner: owner.address,
              },
            );
            await expectRevert(
              transferFunction.call(this, owner.address, other.address, token1.id, 1n, data, other),
              this.token,
              errors.NonApproved,
              {
                sender: other.address,
                owner: owner.address,
              },
            );
          });

          it('reverts in case of balance overflow', async function () {
            await mint(this.token, other.address, token1.id, ethers.MaxUint256);
            await expectRevert(
              transferFunction.call(this, owner.address, other.address, token1.id, 1n, data, owner),
              this.token,
              errors.BalanceOverflow,
              {
                recipient: other.address,
                id: token1.id,
                balance: ethers.MaxUint256,
                value: 1n,
              },
            );
          });

          it('reverts if from has insufficient balance', async function () {
            await expectRevert(
              transferFunction.call(this, other.address, approved.address, token1.id, 1n, data, other),
              this.token,
              errors.InsufficientBalance,
              {
                owner: other.address,
                id: token1.id,
                balance: 0n,
                value: 1n,
              },
            );
          });

          it('reverts when sent to a non-receiver contract', async function () {
            await expect(transferFunction.call(this, owner.address, this.token.getAddress(), token1.id, 1n, data, owner)).to.be.reverted;
          });

          it('reverts when sent to an ERC1155TokenReceiver which refuses the transfer', async function () {
            if (isBatch) {
              await expectRevert(
                transferFunction.call(this, owner.address, this.refusingReceiver1155.getAddress(), token1.id, 1n, data, owner),
                this.token,
                errors.SafeBatchTransferRejected,
                {
                  recipient: await this.refusingReceiver1155.getAddress(),
                  ids: [token1.id],
                  values: [1n],
                },
              );
            } else {
              await expectRevert(
                transferFunction.call(this, owner.address, this.refusingReceiver1155.getAddress(), token1.id, 1n, data, owner),
                this.token,
                errors.SafeTransferRejected,
                {
                  recipient: await this.refusingReceiver1155.getAddress(),
                  id: token1.id,
                  value: 1n,
                },
              );
            }
          });

          it('reverts when sent to an ERC1155TokenReceiver which reverts', async function () {
            await expect(transferFunction.call(this, owner.address, this.revertingReceiver1155.getAddress(), token1.id, 1n, data, owner)).to.be
              .reverted;
          });
        });
      };

      describe('safeTransferFrom(address,address,uint256,uint256,bytes)', function () {
        const transferFn = async function (from, to, id, value, data, sender) {
          return this.token.connect(sender)['safeTransferFrom(address,address,uint256,uint256,bytes)'](from, to, id, value, data);
        };

        revertsOnPreconditions(transferFn, false);
        context('zero value transfer', function () {
          transfersByRecipient(transferFn, token1.id, 0n, '0x42');
        });
        context('partial balance transfer', function () {
          transfersByRecipient(transferFn, token1.id, 1n, '0x42');
        });
        context('full balance transfer', function () {
          transfersByRecipient(transferFn, token1.id, token1.supply, '0x42');
        });
      });

      describe('safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)', function () {
        const transferFn = async function (from, to, ids, values, data, sender) {
          const ids_ = Array.isArray(ids) ? ids : [ids];
          const values_ = Array.isArray(values) ? values : [values];
          return this.token.connect(sender)['safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'](from, to, ids_, values_, data);
        };
        revertsOnPreconditions(transferFn, true);

        it('reverts with inconsistent arrays', async function () {
          await expectRevert(
            transferFn.call(this, owner.address, other.address, [], [1], '0x42', owner),
            this.token,
            errors.InconsistentArrayLengths,
          );
        });

        context('with an empty list of tokens', function () {
          transfersByRecipient(transferFn, [], [], '0x42');
        });
        context('single zero value transfer', function () {
          transfersByRecipient(transferFn, [token1.id], [0n], '0x42');
        });
        context('single partial balance transfer', function () {
          transfersByRecipient(transferFn, [token1.id], [1n], '0x42');
        });
        context('single full balance transfer', function () {
          transfersByRecipient(transferFn, [token1.id], [token1.supply], '0x42');
        });
        context('multiple tokens transfer', function () {
          transfersByRecipient(transferFn, [token1.id, token2.id, token1.id, token3.id], [token1.supply - 1n, 0n, 1n, token3.supply], '0x42');
        });
      });
    });

    supportsInterfaces(['@openzeppelin/contracts/utils/introspection/IERC165.sol:IERC165', 'IERC1155']);
  });
}

module.exports = {
  behavesLikeERC1155Standard,
};
