const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC20Standard(implementation) {
  const {features, errors, deploy} = implementation;

  describe('like an ERC20', function () {
    let accounts, deployer, owner, recipient, spender, maxSpender;
    const AccountIndex = {deployer: 0, owner: 1, recipient: 2, spender: 3, maxSpender: 4};

    const initialSupply = 100n;
    const initialAllowance = initialSupply - 1n;

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, recipient, spender, maxSpender] = accounts;
    });

    const fixture = async function () {
      this.contract = (await deploy([owner.address], [initialSupply], deployer)).connect(owner);
      await this.contract.approve(spender.address, initialAllowance);
      await this.contract.approve(maxSpender.address, ethers.MaxUint256);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('totalSupply()', function () {
      it('returns the initial supply of tokens', async function () {
        expect(await this.contract.totalSupply()).to.equal(initialSupply);
      });
    });

    describe('balanceOf(address)', function () {
      it('returns zero for an account without balance', async function () {
        expect(await this.contract.balanceOf(spender.address)).to.equal(0n);
      });

      it('returns the correct balance for an account with balance', async function () {
        expect(await this.contract.balanceOf(owner.address)).to.equal(initialSupply);
      });
    });

    describe('allowance(address,address)', function () {
      it('returns zero when there is no allowance', async function () {
        expect(await this.contract.allowance(owner.address, recipient.address)).to.equal(0n);
        expect(await this.contract.allowance(owner.address, owner.address)).to.equal(0n);
      });

      it('returns the allowance if it has been set', async function () {
        expect(await this.contract.allowance(owner.address, spender.address)).to.equal(initialAllowance);
      });

      it('returns the max allowance if it has been set at max', async function () {
        expect(await this.contract.allowance(owner.address, maxSpender.address)).to.equal(ethers.MaxUint256);
      });
    });

    describe('approve(address,uint256)', function () {
      it('reverts if approving the zero address', async function () {
        await expectRevert(this.contract.approve(ethers.ZeroAddress, 1), this.contract, errors.ApprovalToAddressZero, {owner: owner.address});
      });

      const approveWasSuccessful = function (approvedIndex, amount) {
        it('sets the new allowance for the spender', async function () {
          expect(await this.contract.allowance(owner.address, accounts[approvedIndex].address)).to.equal(amount);
        });

        it('emits the Approval event', async function () {
          await expect(this.receipt).to.emit(this.contract, 'Approval').withArgs(owner.address, accounts[approvedIndex].address, amount);
        });
      };

      const approvesBySender = function (amount) {
        context('when approving another account', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.approve(spender.address, amount);
          });
          approveWasSuccessful(AccountIndex.spender, amount);
        });
        context('when approving oneself', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.approve(owner.address, amount);
          });
          approveWasSuccessful(AccountIndex.owner, amount);
        });
      };

      context('when approving a zero amount', function () {
        approvesBySender(0n);
      });
      context('when approving a non-zero amount', function () {
        const amount = initialSupply;

        context("when approving less than the owner's balance", function () {
          approvesBySender(amount - 1n);
        });

        context("when approving exactly the owner's balance", function () {
          approvesBySender(amount);
        });

        context("when approving more than the owner's balance", function () {
          approvesBySender(amount + 1n);
        });
      });
    });

    describe('transfer(address,uint256)', function () {
      context('Pre-conditions', function () {
        it('reverts when sent to the zero address', async function () {
          await expectRevert(this.contract.transfer(ethers.ZeroAddress, 1), this.contract, errors.TransferToAddressZero, {owner: owner.address});
        });

        it('reverts with an insufficient balance', async function () {
          const value = initialSupply + 1n;
          await expectRevert(this.contract.transfer(recipient.address, value), this.contract, errors.TransferExceedsBalance, {
            owner: owner.address,
            balance: initialSupply,
            value,
          });
        });
      });

      const transferWasSuccessful = function (toIndex, value, fromIndex) {
        if (toIndex == fromIndex) {
          it('does not affect the sender balance', async function () {
            expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply);
          });
        } else {
          it('decreases the sender balance', async function () {
            expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply - value);
          });

          it('increases the recipient balance', async function () {
            expect(await this.contract.balanceOf(accounts[toIndex].address)).to.equal(value);
          });
        }

        it('does not affect the token(s) total supply', async function () {
          expect(await this.contract.totalSupply()).to.equal(initialSupply);
        });

        it('emits a Transfer event', async function () {
          await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[fromIndex].address, accounts[toIndex].address, value);
        });
      };

      const transfersByRecipient = function (value) {
        context('when transferring to the sender', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.transfer(owner.address, value);
          });
          transferWasSuccessful(AccountIndex.owner, value, AccountIndex.owner);
        });

        context('when transferring to another account', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.transfer(recipient.address, value);
          });
          transferWasSuccessful(AccountIndex.recipient, value, AccountIndex.owner);
        });
      };

      context('when transferring a zero value', function () {
        transfersByRecipient(0n);
      });

      context('when transferring a non-zero value', function () {
        transfersByRecipient(1n);
      });

      context('when transferring the full balance', function () {
        transfersByRecipient(initialSupply);
      });
    });

    describe('transferFrom(address,address,uint256)', function () {
      context('Pre-conditions', function () {
        it('reverts when from is the zero address', async function () {
          await expectRevert(
            this.contract.connect(spender).transferFrom(ethers.ZeroAddress, recipient.address, 1),
            this.contract,
            errors.TransferExceedsAllowance,
            {owner: ethers.ZeroAddress, spender: spender.address, allowance: 0, value: 1},
          );
        });

        it('reverts when sent to the zero address', async function () {
          await expectRevert(
            this.contract.connect(spender).transferFrom(owner.address, ethers.ZeroAddress, 1),
            this.contract,
            errors.TransferToAddressZero,
            {owner: owner.address},
          );
        });

        it('reverts with an insufficient balance', async function () {
          const value = initialSupply + 1n;
          await this.contract.approve(spender.address, value);
          await expectRevert(
            this.contract.connect(spender).transferFrom(owner.address, recipient.address, value),
            this.contract,
            errors.TransferExceedsBalance,
            {owner: owner.address, balance: initialSupply, value},
          );
        });

        it('reverts with an insufficient allowance', async function () {
          const value = initialAllowance + 1n;
          await expectRevert(
            this.contract.connect(spender).transferFrom(owner.address, recipient.address, value),
            this.contract,
            errors.TransferExceedsAllowance,
            {owner: owner.address, spender: spender.address, allowance: initialAllowance, value},
          );
        });
      });

      const transferWasSuccessful = function (fromIndex, toIndex, value, senderIndex, withEIP717) {
        if (fromIndex == toIndex) {
          it('does not affect the sender balance', async function () {
            expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply);
          });
        } else {
          it('decreases the sender balance', async function () {
            expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply - value);
          });

          it('increases the recipient balance', async function () {
            expect(await this.contract.balanceOf(accounts[toIndex].address)).to.equal(value);
          });
        }

        it('does not affect the token(s) total supply', async function () {
          expect(await this.contract.totalSupply()).to.equal(initialSupply);
        });

        it('emits a Transfer event', async function () {
          await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[fromIndex].address, accounts[toIndex].address, value);
        });

        if (fromIndex != senderIndex) {
          if (withEIP717) {
            it('[EIP717] keeps allowance at max ', async function () {
              expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(ethers.MaxUint256);
            });
          } else {
            it('decreases the spender allowance', async function () {
              expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(this.allowance - value);
            });
          }

          if (features && features.AllowanceTracking) {
            it('emits an Approval event', async function () {
              await expect(this.receipt)
                .to.emit(this.contract, 'Approval')
                .withArgs(accounts[fromIndex].address, accounts[senderIndex].address, withEIP717 ? ethers.MaxUint256 : this.allowance - value);
            });
          }
        }
      };

      const transfersByRecipient = function (fromIndex, value, senderIndex, withEIP717 = false) {
        context('when transferring to different recipients', function () {
          beforeEach(async function () {
            this.allowance = await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address);
          });
          context('when transferring to the owner', function () {
            beforeEach(async function () {
              this.receipt = await this.contract.connect(accounts[senderIndex]).transferFrom(accounts[fromIndex].address, owner.address, value);
            });
            transferWasSuccessful(fromIndex, AccountIndex.owner, value, senderIndex, withEIP717);
          });
          context('when transferring to the spender', function () {
            beforeEach(async function () {
              this.receipt = await this.contract.connect(accounts[senderIndex]).transferFrom(accounts[fromIndex].address, spender.address, value);
            });
            transferWasSuccessful(fromIndex, AccountIndex.spender, value, senderIndex, withEIP717);
          });
          context('when transferring to another account', function () {
            beforeEach(async function () {
              this.receipt = await this.contract.connect(accounts[senderIndex]).transferFrom(accounts[fromIndex].address, recipient.address, value);
            });
            transferWasSuccessful(fromIndex, AccountIndex.recipient, value, senderIndex, withEIP717);
          });
        });
      };

      const transfersBySender = function (value) {
        context('when transfer started by the owner', function () {
          transfersByRecipient(AccountIndex.owner, value, AccountIndex.owner);
        });

        context('when transfer started by an approved sender', function () {
          transfersByRecipient(AccountIndex.owner, value, AccountIndex.spender);
        });

        context('when transfer started by a sender with max approval', function () {
          transfersByRecipient(AccountIndex.owner, value, AccountIndex.maxSpender, features.EIP717);
        });
      };

      context('when transferring a zero value', function () {
        transfersBySender(0n);
      });

      context('when transferring a non-zero value', function () {
        transfersBySender(1n);
      });

      context('when transferring the full allowance', function () {
        transfersBySender(initialAllowance);
      });
    });

    if (features && features.ERC165) {
      supportsInterfaces(['@openzeppelin/contracts/utils/introspection/IERC165.sol:IERC165', 'contracts/token/ERC20/interfaces/IERC20.sol:IERC20']);
    }
  });
}

module.exports = {
  behavesLikeERC20Standard,
};
