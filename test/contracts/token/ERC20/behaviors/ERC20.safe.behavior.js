const {ethers} = require('hardhat');
const {expect} = require('chai');
const {Zero, One, MaxUInt256, ZeroAddress} = require('../../../../../src/constants');
const {loadFixture} = require('../../../../helpers/fixtures');
const {deployContract} = require('../../../../helpers/contract');
const {getForwarderRegistryAddress} = require('../../../../helpers/run');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC20Safe(implementation) {
  const {features, revertMessages, deploy} = implementation;

  describe('like an ERC20 Safe Transfers', function () {
    let accounts, deployer, owner, recipient, spender, maxSpender;
    const AccountIndex = {deployer: 0, owner: 1, recipient: 2, spender: 3, maxSpender: 4};

    const initialSupply = ethers.BigNumber.from('100');
    const initialAllowance = initialSupply.sub(One);
    const data = '0x42';

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, recipient, spender, maxSpender] = accounts;
    });

    const fixture = async function () {
      this.contract = (await deploy([owner.address], [initialSupply], deployer)).connect(owner);
      await this.contract.approve(spender.address, initialAllowance);
      await this.contract.approve(maxSpender.address, MaxUInt256);
      this.nonReceiver = await deployContract('ERC20Mock', [], [], '', '', '1', '', await getForwarderRegistryAddress());
      this.receiver = await deployContract('ERC20ReceiverMock', true, this.contract.address);
      this.refusingReceiver = await deployContract('ERC20ReceiverMock', false, this.contract.address);
      this.wrongTokenReceiver = await deployContract('ERC20ReceiverMock', false, ZeroAddress);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('safeTransfer(address,uint256,bytes)', function () {
      context('Pre-conditions', function () {
        it('reverts when sent to the zero address', async function () {
          await expect(this.contract.safeTransfer(ZeroAddress, One, data)).to.be.revertedWith(revertMessages.TransferToZero);
        });

        it('reverts with an insufficient balance', async function () {
          await expect(this.contract.safeTransfer(recipient.address, initialSupply.add(One), data)).to.be.revertedWith(
            revertMessages.TransferExceedsBalance
          );
        });

        it('reverts when sent to a non-receiver contract', async function () {
          await expect(this.contract.safeTransfer(this.nonReceiver.address, One, data)).to.be.reverted;
        });

        it('reverts when sent to a refusing receiver contract', async function () {
          await expect(this.contract.safeTransfer(this.refusingReceiver.address, One, data)).to.be.revertedWith(revertMessages.SafeTransferRejected);
        });

        it('reverts when sent to a receiver contract receiving another token', async function () {
          await expect(this.contract.safeTransfer(this.wrongTokenReceiver.address, One, data)).to.be.revertedWith('ERC20Receiver: wrong token');
        });
      });

      const transferWasSuccessful = function (toIndex, value, senderIndex, toReceiver = false) {
        if (toIndex == senderIndex) {
          it('does not affect the sender balance', async function () {
            expect(await this.contract.balanceOf(accounts[senderIndex].address)).to.equal(initialSupply);
          });
        } else {
          it('decreases the sender balance', async function () {
            expect(await this.contract.balanceOf(accounts[senderIndex].address)).to.equal(initialSupply.sub(value));
          });

          it('increases the recipient balance', async function () {
            expect(await this.contract.balanceOf(toReceiver ? this.receiver.address : accounts[toIndex].address)).to.equal(value);
          });
        }

        it('does not affect the token(s) total supply', async function () {
          expect(await this.contract.totalSupply()).to.equal(initialSupply);
        });

        it('emits a Transfer event', async function () {
          await expect(this.receipt)
            .to.emit(this.contract, 'Transfer')
            .withArgs(accounts[senderIndex].address, toReceiver ? this.receiver.address : accounts[toIndex].address, value);
        });

        if (toReceiver) {
          it('calls onERC20Received(address,address,uint256,bytes) on a receiver contract', async function () {
            await expect(this.receipt)
              .to.emit(this.receiver, 'ERC20Received')
              .withArgs(accounts[senderIndex].address, accounts[senderIndex].address, value, data);
          });
        }
      };

      const transfersByRecipient = function (value) {
        context('when transferring to the sender', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.safeTransfer(owner.address, value, data);
          });
          transferWasSuccessful(AccountIndex.owner, value, AccountIndex.owner);
        });

        context('when transferring to another account', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.safeTransfer(recipient.address, value, data);
          });
          transferWasSuccessful(AccountIndex.recipient, value, AccountIndex.owner);
        });

        context('when transferring to an ERC20Receiver contract', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.safeTransfer(this.receiver.address, value, data);
          });
          transferWasSuccessful(null, value, AccountIndex.owner, true);
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

    describe('safeTransferFrom(address,address,uint256,bytes)', function () {
      context('Pre-conditions', function () {
        it('reverts when from is the zero address', async function () {
          await expect(this.contract.connect(spender).safeTransferFrom(ZeroAddress, recipient.address, One, data)).to.be.revertedWith(
            revertMessages.TransferExceedsAllowance
          );
        });

        it('reverts when sent to the zero address', async function () {
          await expect(this.contract.connect(spender).safeTransferFrom(owner.address, ZeroAddress, One, data)).to.be.revertedWith(
            revertMessages.TransferToZero
          );
        });

        it('reverts with an insufficient balance', async function () {
          await this.contract.approve(spender.address, initialSupply.add(One));
          await expect(
            this.contract.connect(spender).safeTransferFrom(owner.address, recipient.address, initialSupply.add(One), data)
          ).to.be.revertedWith(revertMessages.TransferExceedsBalance);
        });

        it('reverts with an insufficient allowance', async function () {
          await expect(
            this.contract.connect(spender).safeTransferFrom(owner.address, recipient.address, initialAllowance.add(One), data)
          ).to.be.revertedWith(revertMessages.TransferExceedsAllowance);
        });

        it('reverts when sent to a non-receiver contract', async function () {
          await expect(this.contract.connect(spender).safeTransferFrom(owner.address, this.nonReceiver.address, One, data)).to.be.reverted;
        });

        it('reverts when sent to a refusing receiver contract', async function () {
          await expect(this.contract.connect(spender).safeTransferFrom(owner.address, this.refusingReceiver.address, One, data)).to.be.revertedWith(
            revertMessages.SafeTransferRejected
          );
        });

        const transferWasSuccessful = function (fromIndex, toIndex, value, senderIndex, withEIP717, toReceiver = false) {
          if (fromIndex == toIndex) {
            it('does not affect the sender balance', async function () {
              expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply);
            });
          } else {
            it('decreases the sender balance', async function () {
              expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply.sub(value));
            });

            it('increases the recipient balance', async function () {
              expect(await this.contract.balanceOf(toReceiver ? this.receiver.address : accounts[toIndex].address)).to.equal(value);
            });
          }

          it('does not affect the token(s) total supply', async function () {
            expect(await this.contract.totalSupply()).to.equal(initialSupply);
          });

          it('emits a Transfer event', async function () {
            await expect(this.receipt)
              .to.emit(this.contract, 'Transfer')
              .withArgs(accounts[fromIndex].address, toReceiver ? this.receiver.address : accounts[toIndex].address, value);
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
                this.receipt = await this.contract
                  .connect(accounts[senderIndex])
                  .safeTransferFrom(accounts[fromIndex].address, owner.address, value, data);
              });
              transferWasSuccessful(fromIndex, AccountIndex.owner, value, senderIndex, withEIP717);
            });
            context('when transferring to the spender', function () {
              beforeEach(async function () {
                this.receipt = await this.contract
                  .connect(accounts[senderIndex])
                  .safeTransferFrom(accounts[fromIndex].address, spender.address, value, data);
              });
              transferWasSuccessful(fromIndex, AccountIndex.spender, value, senderIndex, withEIP717);
            });
            context('when transferring to another account', function () {
              beforeEach(async function () {
                this.receipt = await this.contract
                  .connect(accounts[senderIndex])
                  .safeTransferFrom(accounts[fromIndex].address, recipient.address, value, data);
              });
              transferWasSuccessful(fromIndex, AccountIndex.recipient, value, senderIndex, withEIP717);
            });
            context('when transferring to an ERC20Receiver contract', function () {
              beforeEach(async function () {
                this.receipt = await this.contract
                  .connect(accounts[senderIndex])
                  .safeTransferFrom(accounts[fromIndex].address, this.receiver.address, value, data);
              });
              transferWasSuccessful(fromIndex, null, value, senderIndex, withEIP717, true);
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
    });

    if (features.ERC165) {
      supportsInterfaces(['IERC20SafeTransfers']);
    }
  });
}

module.exports = {
  behavesLikeERC20Safe,
};
