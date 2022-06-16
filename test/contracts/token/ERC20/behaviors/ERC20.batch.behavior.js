const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

const {Zero, One, Two, MaxUInt256, ZeroAddress} = require('../../../../../src/constants');

function behavesLikeERC20Batch(implementation) {
  const {features, revertMessages, deploy} = implementation;

  describe('like an ERC20 Batch Transfers', function () {
    let accounts, deployer, owner, recipient1, recipient2, spender, maxSpender;
    const AccountIndex = {deployer: 0, owner: 1, recipient1: 2, recipient2: 3, spender: 4, maxSpender: 5};

    const initialSupply = ethers.BigNumber.from('100');
    const initialAllowance = initialSupply.sub(One);

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, recipient1, recipient2, spender, maxSpender] = accounts;
    });

    const fixture = async function () {
      this.contract = (await deploy([owner.address], [initialSupply], deployer)).connect(owner);
      await this.contract.approve(spender.address, initialAllowance);
      await this.contract.approve(maxSpender.address, MaxUInt256);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('batchTransfer(address[],uint256[])', function () {
      it('reverts with inconsistent arrays', async function () {
        await expect(this.contract.batchTransfer([recipient1.address], [])).to.be.revertedWith(revertMessages.InconsistentArrays);
        await expect(this.contract.batchTransfer([], [One])).to.be.revertedWith(revertMessages.InconsistentArrays);
      });

      it('reverts when one of the recipients is the zero address', async function () {
        await expect(this.contract.batchTransfer([ZeroAddress], [One])).to.be.revertedWith(revertMessages.TransferToZero);
        await expect(this.contract.batchTransfer([recipient1.address, ZeroAddress], [Zero, Zero])).to.be.revertedWith(revertMessages.TransferToZero);
      });

      it('reverts with an insufficient balance', async function () {
        await expect(this.contract.batchTransfer([recipient1.address], [initialSupply.add(One)])).to.be.revertedWith(
          revertMessages.TransferExceedsBalance
        );
        await expect(this.contract.batchTransfer([owner.address], [initialSupply.add(One)])).to.be.revertedWith(
          revertMessages.TransferExceedsBalance
        );
        await expect(this.contract.batchTransfer([owner.address, recipient1.address], [initialSupply, One])).to.be.revertedWith(
          revertMessages.TransferExceedsBalance
        );
      });

      it('reverts if values overflow', async function () {
        await expect(this.contract.batchTransfer([recipient1.address, recipient1.address], [One, MaxUInt256])).to.be.revertedWith(
          revertMessages.BatchTransferValuesOverflow
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

          aggregatedValues[toIndex] = aggregatedValues[toIndex] ? aggregatedValues[toIndex].add(value) : value;
        }

        let totalMovedBalance = Zero;
        for (const toIndex of Object.keys(aggregatedValues)) {
          const value = aggregatedValues[toIndex];

          if (senderIndex != toIndex) {
            it('increases the recipient balance', async function () {
              expect(await this.contract.balanceOf(accounts[toIndex].address)).to.equal(this.recipientBalances[toIndex].add(value));
            });
            totalMovedBalance = totalMovedBalance.add(value);
          }
        }

        it('decreases the sender balance', async function () {
          expect(await this.contract.balanceOf(accounts[senderIndex].address)).to.equal(initialSupply.sub(totalMovedBalance));
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
        transfersTokens([AccountIndex.recipient1, AccountIndex.recipient2, AccountIndex.spender], [Zero, One, Zero]);
      });

      context('when transferring the full balance in one transfer', function () {
        transfersTokens([AccountIndex.recipient1], [initialSupply]);
      });

      context('when transferring the full balance in several transfers', function () {
        transfersTokens([AccountIndex.recipient1, AccountIndex.recipient2], [initialSupply.sub(One), One]);
      });

      context('when transferring to the same owner', function () {
        transfersTokens(
          [AccountIndex.recipient1, AccountIndex.owner, AccountIndex.spender, AccountIndex.owner, AccountIndex.recipient2],
          [Zero, One, Zero, Two, One]
        );
      });

      context('when transferring to the same owner where each value is under the balance but cumulates to more than balance', function () {
        transfersTokens(
          [AccountIndex.owner, AccountIndex.owner, AccountIndex.owner, AccountIndex.owner, AccountIndex.owner],
          [initialSupply, initialSupply, initialSupply.sub(One), Zero, One]
        );
      });
    });

    describe('batchTransferFrom(address,address[],uint256[])', function () {
      context('Pre-conditions', function () {
        it('reverts when from is the zero address', async function () {
          await expect(this.contract.batchTransferFrom(ZeroAddress, [recipient1.address], [One])).to.be.revertedWith(
            revertMessages.TransferExceedsBalance
          );
        });

        it('reverts with inconsistent arrays', async function () {
          await expect(this.contract.batchTransferFrom(owner.address, [], [One])).to.be.revertedWith(revertMessages.InconsistentArrays);
          await expect(this.contract.batchTransferFrom(owner.address, [recipient1.address], [])).to.be.revertedWith(
            revertMessages.InconsistentArrays
          );
        });

        it('reverts when one of the recipients is the zero address', async function () {
          await expect(this.contract.batchTransferFrom(owner.address, [ZeroAddress], [One])).to.be.revertedWith(revertMessages.TransferToZero);
          await expect(this.contract.batchTransferFrom(owner.address, [recipient1.address, ZeroAddress], [Zero, Zero])).to.be.revertedWith(
            revertMessages.TransferToZero
          );
        });

        it('reverts with an insufficient balance', async function () {
          await expect(this.contract.batchTransferFrom(owner.address, [recipient1.address], [initialSupply.add(One)])).to.be.revertedWith(
            revertMessages.TransferExceedsBalance
          );
          await expect(this.contract.batchTransferFrom(owner.address, [owner.address], [initialSupply.add(One)])).to.be.revertedWith(
            revertMessages.TransferExceedsBalance
          );
          await expect(this.contract.batchTransferFrom(owner.address, [owner.address, recipient1.address], [initialSupply, One])).to.be.revertedWith(
            revertMessages.TransferExceedsBalance
          );
        });

        it('reverts with an insufficient allowance', async function () {
          await expect(
            this.contract.connect(spender).batchTransferFrom(owner.address, [recipient1.address], [initialAllowance.add(One)])
          ).to.be.revertedWith(revertMessages.TransferExceedsAllowance);
          await expect(
            this.contract.connect(spender).batchTransferFrom(owner.address, [owner.address], [initialAllowance.add(One)])
          ).to.be.revertedWith(revertMessages.TransferExceedsAllowance);
          await expect(
            this.contract.connect(spender).batchTransferFrom(owner.address, [owner.address, recipient1.address], [initialAllowance, One])
          ).to.be.revertedWith(revertMessages.TransferExceedsAllowance);
        });

        it('reverts if values overflow', async function () {
          await expect(
            this.contract.batchTransferFrom(owner.address, [recipient1.address, recipient1.address], [One, MaxUInt256])
          ).to.be.revertedWith(revertMessages.BatchTransferValuesOverflow);
        });
      });

      const transferWasSuccessful = function (fromIndex, recipientIndexes, values, senderIndex, withEIP717) {
        let totalValue = Zero;
        let aggregatedValues = {};
        for (let i = 0; i < recipientIndexes.length; ++i) {
          const toIndex = recipientIndexes[i];
          const value = values[i];
          totalValue = totalValue.add(value);

          it('emits a Transfer event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[fromIndex].address, accounts[toIndex].address, value);
          });

          aggregatedValues[toIndex] = aggregatedValues[toIndex] ? aggregatedValues[toIndex].add(value) : value;
        }

        let totalMovedBalance = Zero;
        for (const toIndex of Object.keys(aggregatedValues)) {
          const value = aggregatedValues[toIndex];

          if (fromIndex != toIndex) {
            it('increases the recipient balance', async function () {
              expect(await this.contract.balanceOf(accounts[toIndex].address)).to.equal(this.recipientBalances[toIndex].add(value));
            });
            totalMovedBalance = totalMovedBalance.add(value);
          }
        }

        it('decreases the sender balance', async function () {
          expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply.sub(totalMovedBalance));
        });

        it('does not affect the token(s) total supply', async function () {
          expect(await this.contract.totalSupply()).to.equal(initialSupply);
        });

        if (fromIndex != senderIndex) {
          if (withEIP717) {
            it('[EIP717] keeps allowance at max ', async function () {
              expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(MaxUInt256);
            });
          } else {
            it('decreases the spender allowance', async function () {
              expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(
                this.allowance.sub(totalValue)
              );
            });
          }

          if (features.AllowanceTracking && recipientIndexes.length != 0) {
            it('emits an Approval event', async function () {
              await expect(this.receipt)
                .to.emit(this.contract, 'Approval')
                .withArgs(accounts[fromIndex].address, accounts[senderIndex].address, withEIP717 ? MaxUInt256 : this.allowance.sub(totalValue));
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
        transfersBySender([AccountIndex.recipient1, AccountIndex.recipient2, AccountIndex.spender], [Zero, One, Zero]);
      });

      context('when transferring the full allowance', function () {
        transfersBySender([AccountIndex.recipient1], [initialAllowance]);
        transfersBySender([AccountIndex.recipient1, AccountIndex.recipient2], [initialAllowance.sub(One), One]);
      });

      context('when transferring to the same owner', function () {
        transfersBySender(
          [AccountIndex.recipient1, AccountIndex.owner, AccountIndex.spender, AccountIndex.owner, AccountIndex.recipient2],
          [Zero, One, Zero, Two, One]
        );
      });
    });

    if (features.ERC165) {
      supportsInterfaces(['IERC20BatchTransfers']);
    }
  });
}

module.exports = {
  behavesLikeERC20Batch,
};
