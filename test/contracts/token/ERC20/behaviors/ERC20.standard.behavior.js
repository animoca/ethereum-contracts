const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {supporstInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');
const {Zero, One, MaxUInt256, ZeroAddress} = require('../../../../../src/constants');

function behavesLikeERC20Standard(implementation) {
  const {features, revertMessages, deploy} = implementation;

  describe('like an ERC20 Standard', function () {
    let accounts, deployer, owner, recipient, spender, maxSpender;
    const AccountIndex = {deployer: 0, owner: 1, recipient: 2, spender: 3, maxSpender: 4};

    const initialSupply = ethers.BigNumber.from('100');
    const initialAllowance = initialSupply.sub(One);

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, recipient, spender, maxSpender] = accounts;
    });

    const fixture = async function () {
      this.contract = (await deploy([owner.address], [initialSupply], deployer)).connect(owner);
      await this.contract.approve(spender.address, initialAllowance);
      await this.contract.approve(maxSpender.address, MaxUInt256);
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
        expect(await this.contract.balanceOf(spender.address)).to.equal(Zero);
      });

      it('returns the correct balance for an account with balance', async function () {
        expect(await this.contract.balanceOf(owner.address)).to.equal(initialSupply);
      });
    });

    describe('allowance(address,address)', function () {
      it('returns zero when there is no allowance', async function () {
        expect(await this.contract.allowance(owner.address, recipient.address)).to.equal(Zero);
        expect(await this.contract.allowance(owner.address, owner.address)).to.equal(Zero);
      });

      it('returns the allowance if it has been set', async function () {
        expect(await this.contract.allowance(owner.address, spender.address)).to.equal(initialAllowance);
      });

      it('returns the max allowance if it has been set at max', async function () {
        expect(await this.contract.allowance(owner.address, maxSpender.address)).to.equal(MaxUInt256);
      });
    });

    describe('approve(address,uint256)', function () {
      it('reverts if approving the zero address', async function () {
        await expect(this.contract.approve(ZeroAddress, One)).to.be.revertedWith(revertMessages.ApproveToZero);
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
        approvesBySender(Zero);
      });
      context('when approving a non-zero amount', function () {
        const amount = initialSupply;

        context("when approving less than the owner's balance", function () {
          approvesBySender(amount.sub('1'));
        });

        context("when approving exactly the owner's balance", function () {
          approvesBySender(amount);
        });

        context("when approving more than the owner's balance", function () {
          approvesBySender(amount.add('1'));
        });
      });
    });

    describe('transfer(address,uint256)', function () {
      context('Pre-conditions', function () {
        it('reverts when sent to the zero address', async function () {
          await expect(this.contract.transfer(ZeroAddress, One)).to.be.revertedWith(revertMessages.TransferToZero);
        });

        it('reverts with an insufficient balance', async function () {
          await expect(this.contract.transfer(recipient.address, initialSupply.add(One))).to.be.revertedWith(revertMessages.TransferExceedsBalance);
        });
      });

      const transferWasSuccessful = function (toIndex, value, fromIndex) {
        if (toIndex == fromIndex) {
          it('does not affect the sender balance', async function () {
            expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply);
          });
        } else {
          it('decreases the sender balance', async function () {
            expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply.sub(value));
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
        transfersByRecipient(Zero);
      });

      context('when transferring a non-zero value', function () {
        transfersByRecipient(One);
      });

      context('when transferring the full balance', function () {
        transfersByRecipient(initialSupply);
      });
    });

    describe('transferFrom(address,address,uint256)', function () {
      context('Pre-conditions', function () {
        it('reverts when from is the zero address', async function () {
          await expect(this.contract.connect(spender).transferFrom(ZeroAddress, recipient.address, One)).to.be.revertedWith(
            revertMessages.TransferExceedsAllowance
          );
        });

        it('reverts when sent to the zero address', async function () {
          await expect(this.contract.connect(spender).transferFrom(owner.address, ZeroAddress, One)).to.be.revertedWith(
            revertMessages.TransferToZero
          );
        });

        it('reverts with an insufficient balance', async function () {
          await this.contract.approve(spender.address, initialSupply.add(One));
          await expect(this.contract.connect(spender).transferFrom(owner.address, recipient.address, initialSupply.add(One))).to.be.revertedWith(
            revertMessages.TransferExceedsBalance
          );
        });

        it('reverts with an insufficient allowance', async function () {
          await expect(this.contract.connect(spender).transferFrom(owner.address, recipient.address, initialAllowance.add(One))).to.be.revertedWith(
            revertMessages.TransferExceedsAllowance
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
            expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply.sub(value));
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
              expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(MaxUInt256);
            });
          } else {
            it('decreases the spender allowance', async function () {
              expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(this.allowance.sub(value));
            });
          }

          if (features.AllowanceTracking) {
            it('emits an Approval event', async function () {
              await expect(this.receipt)
                .to.emit(this.contract, 'Approval')
                .withArgs(accounts[fromIndex].address, accounts[senderIndex].address, withEIP717 ? MaxUInt256 : this.allowance.sub(value));
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
        transfersBySender(Zero);
      });

      context('when transferring a non-zero value', function () {
        transfersBySender(One);
      });

      context('when transferring the full allowance', function () {
        transfersBySender(initialAllowance);
      });
    });

    if (features.ERC165) {
      supporstInterfaces(['contracts/introspection/interfaces/IERC165.sol:IERC165', 'IERC20']);
    }
  });
}

module.exports = {
  behavesLikeERC20Standard,
};
