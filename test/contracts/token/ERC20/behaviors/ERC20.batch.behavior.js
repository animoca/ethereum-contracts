const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');
const exp = require('constants');

function behavesLikeERC20Batch(implementation) {
  const {features, errors, deploy} = implementation;

  describe('like an ERC20 Batch Transfers', function () {
    let accounts, deployer, owner, recipient1, recipient2, spender, maxSpender;
    const AccountIndex = {deployer: 0, owner: 1, recipient1: 2, recipient2: 3, spender: 4, maxSpender: 5};

    const initialSupply = 100n;
    const initialAllowance = initialSupply - 1n;

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, recipient1, recipient2, spender, maxSpender] = accounts;
    });

    const fixture = async function () {
      this.contract = (await deploy([owner.address], [initialSupply], deployer)).connect(owner);
      await this.contract.approve(spender.address, initialAllowance);
      await this.contract.approve(maxSpender.address, ethers.MaxUint256);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('batchTransfer(address[],uint256[])', function () {
      it('reverts with inconsistent arrays', async function () {
        await expectRevert(this.contract.batchTransfer([recipient1.address], []), this.contract, errors.InconsistentArrayLengths);
        await expectRevert(this.contract.batchTransfer([], [1]), this.contract, errors.InconsistentArrayLengths);
      });

      it('reverts when one of the recipients is the zero address', async function () {
        await expectRevert(this.contract.batchTransfer([ethers.ZeroAddress], [1]), this.contract, errors.TransferToAddressZero, {
          owner: owner.address,
        });
        await expectRevert(
          this.contract.batchTransfer([recipient1.address, ethers.ZeroAddress], [0, 0]),
          this.contract,
          errors.TransferToAddressZero,
          {
            owner: owner.address,
          }
        );
      });

      it('reverts with an insufficient balance', async function () {
        await expectRevert(this.contract.batchTransfer([recipient1.address], [initialSupply + 1n]), this.contract, errors.TransferExceedsBalance, {
          owner: owner.address,
          balance: initialSupply,
          value: initialSupply + 1n,
        });
        await expectRevert(this.contract.batchTransfer([owner.address], [initialSupply + 1n]), this.contract, errors.TransferExceedsBalance, {
          owner: owner.address,
          balance: initialSupply,
          value: initialSupply + 1n,
        });
        await expectRevert(
          this.contract.batchTransfer([owner.address, recipient1.address], [initialSupply, 1n]),
          this.contract,
          errors.TransferExceedsBalance,
          {
            owner: owner.address,
            balance: initialSupply,
            value: initialSupply + 1n,
          }
        );
      });

      it('reverts if values overflow', async function () {
        await expectRevert(
          this.contract.batchTransfer([recipient1.address, recipient1.address], [1, ethers.MaxUint256]),
          this.contract,
          errors.BatchTransferValuesOverflow
        );
      });

      const transferWasSuccessful = function (recipientIndexes, values, senderIndex) {
        let aggregatedValues = {};
        for (let i = 0; i < recipientIndexes.length; ++i) {
          const toIndex = recipientIndexes[i];
          const value = values[i];

          it('emits a Transfer event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[senderIndex].address, accounts[toIndex].address, value);
          });

          aggregatedValues[toIndex] = aggregatedValues[toIndex] ? aggregatedValues[toIndex] + value : value;
        }

        let totalMovedBalance = 0n;
        for (const toIndex of Object.keys(aggregatedValues)) {
          const value = aggregatedValues[toIndex];

          if (senderIndex != toIndex) {
            it('increases the recipient balance', async function () {
              expect(await this.contract.balanceOf(accounts[toIndex].address)).to.equal(this.recipientBalances[toIndex] + value);
            });
            totalMovedBalance = totalMovedBalance + value;
          }
        }

        it('decreases the sender balance', async function () {
          expect(await this.contract.balanceOf(accounts[senderIndex].address)).to.equal(initialSupply - totalMovedBalance);
        });

        it('does not affect the token(s) total supply', async function () {
          expect(await this.contract.totalSupply()).to.equal(initialSupply);
        });
      };

      const transfersTokens = function (recipientIndexes, values) {
        beforeEach(async function () {
          this.recipientBalances = {};
          for (const toIndex of recipientIndexes) {
            this.recipientBalances[toIndex] = await this.contract.balanceOf(accounts[toIndex].address);
          }
          this.receipt = await this.contract.batchTransfer(
            recipientIndexes.map((toIndex) => accounts[toIndex].address),
            values
          );
        });
        transferWasSuccessful(recipientIndexes, values, AccountIndex.owner);
      };

      context('when transferring an empty list', function () {
        transfersTokens([], []);
      });

      context('when transferring zero values', function () {
        transfersTokens([AccountIndex.recipient1, AccountIndex.recipient2, AccountIndex.spender], [0n, 1n, 0n]);
      });

      context('when transferring the full balance in one transfer', function () {
        transfersTokens([AccountIndex.recipient1], [initialSupply]);
      });

      context('when transferring the full balance in several transfers', function () {
        transfersTokens([AccountIndex.recipient1, AccountIndex.recipient2], [initialSupply - 1n, 1n]);
      });

      context('when transferring to the same owner', function () {
        transfersTokens(
          [AccountIndex.recipient1, AccountIndex.owner, AccountIndex.spender, AccountIndex.owner, AccountIndex.recipient2],
          [0n, 1n, 0n, 2n, 1n]
        );
      });

      context('when transferring to the same owner where each value is under the balance but cumulates to more than balance', function () {
        transfersTokens(
          [AccountIndex.owner, AccountIndex.owner, AccountIndex.owner, AccountIndex.owner, AccountIndex.owner],
          [initialSupply, initialSupply, initialSupply - 1n, 0n, 1n]
        );
      });
    });

    describe('batchTransferFrom(address,address[],uint256[])', function () {
      context('Pre-conditions', function () {
        it('reverts when from is the zero address', async function () {
          await expectRevert(
            this.contract.batchTransferFrom(ethers.ZeroAddress, [recipient1.address], [1]),
            this.contract,
            errors.TransferExceedsBalance,
            {
              owner: ethers.ZeroAddress,
              balance: 0n,
              value: 1,
            }
          );
        });

        it('reverts with inconsistent arrays', async function () {
          await expectRevert(this.contract.batchTransferFrom(owner.address, [], [1]), this.contract, errors.InconsistentArrayLengths);
          await expectRevert(
            this.contract.batchTransferFrom(owner.address, [recipient1.address], []),
            this.contract,
            errors.InconsistentArrayLengths
          );
        });

        it('reverts when one of the recipients is the zero address', async function () {
          await expectRevert(this.contract.batchTransferFrom(owner.address, [ethers.ZeroAddress], [1]), this.contract, errors.TransferToAddressZero, {
            owner: owner.address,
          });
          await expectRevert(
            this.contract.batchTransferFrom(owner.address, [recipient1.address, ethers.ZeroAddress], [0, 0]),
            this.contract,
            errors.TransferToAddressZero,
            {
              owner: owner.address,
            }
          );
        });

        it('reverts with an insufficient balance', async function () {
          await expectRevert(
            this.contract.batchTransferFrom(owner.address, [recipient1.address], [initialSupply + 1n]),
            this.contract,
            errors.TransferExceedsBalance,
            {
              owner: owner.address,
              balance: initialSupply,
              value: initialSupply + 1n,
            }
          );
          await expectRevert(
            this.contract.batchTransferFrom(owner.address, [owner.address], [initialSupply + 1n]),
            this.contract,
            errors.TransferExceedsBalance,
            {
              owner: owner.address,
              balance: initialSupply,
              value: initialSupply + 1n,
            }
          );
          await expectRevert(
            this.contract.batchTransferFrom(owner.address, [owner.address, recipient1.address], [initialSupply, 1]),
            this.contract,
            errors.TransferExceedsBalance,
            {
              owner: owner.address,
              balance: initialSupply,
              value: initialSupply + 1n,
            }
          );
        });

        it('reverts with an insufficient allowance', async function () {
          await expectRevert(
            this.contract.connect(spender).batchTransferFrom(owner.address, [recipient1.address], [initialAllowance + 1n]),
            this.contract,
            errors.TransferExceedsAllowance,
            {
              owner: owner.address,
              spender: spender.address,
              allowance: initialAllowance,
              value: initialAllowance + 1n,
            }
          );
          await expectRevert(
            this.contract.connect(spender).batchTransferFrom(owner.address, [owner.address], [initialAllowance + 1n]),
            this.contract,
            errors.TransferExceedsAllowance,
            {
              owner: owner.address,
              spender: spender.address,
              allowance: initialAllowance,
              value: initialAllowance + 1n,
            }
          );
          await expectRevert(
            this.contract.connect(spender).batchTransferFrom(owner.address, [owner.address, recipient1.address], [initialAllowance, 1]),
            this.contract,
            errors.TransferExceedsAllowance,
            {
              owner: owner.address,
              spender: spender.address,
              allowance: initialAllowance,
              value: initialAllowance + 1n,
            }
          );
        });

        it('reverts if values overflow', async function () {
          await expectRevert(
            this.contract.batchTransferFrom(owner.address, [recipient1.address, recipient1.address], [1, ethers.MaxUint256]),
            this.contract,
            errors.BatchTransferValuesOverflow,
            {
              owner: owner.address,
              value: ethers.MaxUint256,
            }
          );
        });
      });

      const transferWasSuccessful = function (fromIndex, recipientIndexes, values, senderIndex, withEIP717) {
        let totalValue = 0n;
        let aggregatedValues = {};
        for (let i = 0; i < recipientIndexes.length; ++i) {
          const toIndex = recipientIndexes[i];
          const value = values[i];
          totalValue = totalValue + value;

          it('emits a Transfer event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[fromIndex].address, accounts[toIndex].address, value);
          });

          aggregatedValues[toIndex] = aggregatedValues[toIndex] ? aggregatedValues[toIndex] + value : value;
        }

        let totalMovedBalance = 0n;
        for (const toIndex of Object.keys(aggregatedValues)) {
          const value = aggregatedValues[toIndex];

          if (fromIndex != toIndex) {
            it('increases the recipient balance', async function () {
              expect(await this.contract.balanceOf(accounts[toIndex].address)).to.equal(this.recipientBalances[toIndex] + value);
            });
            totalMovedBalance = totalMovedBalance + value;
          }
        }

        it('decreases the sender balance', async function () {
          expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply - totalMovedBalance);
        });

        it('does not affect the token(s) total supply', async function () {
          expect(await this.contract.totalSupply()).to.equal(initialSupply);
        });

        if (fromIndex != senderIndex) {
          if (withEIP717) {
            it('[EIP717] keeps allowance at max ', async function () {
              expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(ethers.MaxUint256);
            });
          } else {
            it('decreases the spender allowance', async function () {
              expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(this.allowance - totalValue);
            });
          }

          if (features && features.AllowanceTracking && recipientIndexes.length != 0) {
            it('emits an Approval event', async function () {
              await expect(this.receipt)
                .to.emit(this.contract, 'Approval')
                .withArgs(accounts[fromIndex].address, accounts[senderIndex].address, withEIP717 ? ethers.MaxUint256 : this.allowance - totalValue);
            });
          }
        }
      };

      const transfersTokens = function (recipientIndexes, values, senderIndex, withEIP717 = false) {
        beforeEach(async function () {
          this.allowance = await this.contract.allowance(owner.address, accounts[senderIndex].address);
          this.recipientBalances = {};
          for (const toIndex of recipientIndexes) {
            this.recipientBalances[toIndex] = await this.contract.balanceOf(accounts[toIndex].address);
          }
          this.receipt = await this.contract.connect(accounts[senderIndex]).batchTransferFrom(
            owner.address,
            recipientIndexes.map((toIndex) => accounts[toIndex].address),
            values
          );
        });
        transferWasSuccessful(AccountIndex.owner, recipientIndexes, values, senderIndex, withEIP717);
      };

      const transfersBySender = function (recipientIndexes, values) {
        context('when transfer started by the owner', function () {
          transfersTokens(recipientIndexes, values, AccountIndex.owner);
        });

        context('when transfer started by an approved sender', function () {
          transfersTokens(recipientIndexes, values, AccountIndex.spender);
        });

        context('when transfer started by a sender with max approval', function () {
          transfersTokens(recipientIndexes, values, AccountIndex.maxSpender, features.EIP717);
        });
      };

      context('when transferring an empty list', function () {
        transfersBySender([], []);
      });

      context('when transferring zero values', function () {
        transfersBySender([AccountIndex.recipient1, AccountIndex.recipient2, AccountIndex.spender], [0n, 1n, 0n]);
      });

      context('when transferring the full allowance', function () {
        transfersBySender([AccountIndex.recipient1], [initialAllowance]);
        transfersBySender([AccountIndex.recipient1, AccountIndex.recipient2], [initialAllowance - 1n, 1n]);
      });

      context('when transferring to the same owner', function () {
        transfersBySender(
          [AccountIndex.recipient1, AccountIndex.owner, AccountIndex.spender, AccountIndex.owner, AccountIndex.recipient2],
          [0n, 1n, 0n, 2n, 1n]
        );
      });
    });

    if (features && features.ERC165) {
      supportsInterfaces(['IERC20BatchTransfers']);
    }
  });
}

module.exports = {
  behavesLikeERC20Batch,
};
