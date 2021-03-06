const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

const {Zero, One, Two, Three, MaxUInt256, ZeroAddress} = require('../../../../../src/constants');

function behavesLikeERC20Allowance(implementation) {
  const {features, revertMessages, deploy} = implementation;

  describe('like an ERC20 Allowance', function () {
    let deployer, owner, spender, maxSpender;

    const initialSupply = ethers.BigNumber.from('100');

    before(async function () {
      [deployer, owner, spender, maxSpender] = await ethers.getSigners();
    });

    const fixture = async function () {
      this.contract = (await deploy([owner.address], [initialSupply], deployer)).connect(owner);
      await this.contract.approve(maxSpender.address, MaxUInt256);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('increaseAllowance(address,uint256)', function () {
      context('Pre-conditions', function () {
        it('reverts when the spender is the zero address', async function () {
          await expect(this.contract.increaseAllowance(ZeroAddress, Zero)).to.be.revertedWith(revertMessages.ApproveToZero);
        });

        it('reverts when the allowance overflows', async function () {
          await this.contract.increaseAllowance(spender.address, One);
          await expect(this.contract.increaseAllowance(spender.address, MaxUInt256)).to.be.revertedWith(revertMessages.AllowanceOverflow);
        });
      });

      const increasesAllowance = function (preApprovedAmount, amount) {
        const expectedAllowance = preApprovedAmount.add(amount);

        beforeEach(async function () {
          if (!preApprovedAmount.isZero()) {
            await this.contract.approve(spender.address, preApprovedAmount);
          }

          this.receipt = await this.contract.increaseAllowance(spender.address, amount);
        });

        it('increases the spender allowance by the specified amount', async function () {
          expect(await this.contract.allowance(owner.address, spender.address)).to.equal(expectedAllowance);
        });

        it('emits an Approval event', async function () {
          await expect(this.receipt).to.emit(this.contract, 'Approval').withArgs(owner.address, spender.address, expectedAllowance);
        });
      };

      context('when increasing by a zero amount', function () {
        context('when there was no pre-approved allowance', function () {
          increasesAllowance(Zero, Zero);
        });

        context('when there was a pre-approved allowance', function () {
          increasesAllowance(initialSupply, Zero);
        });
      });

      context('when increasing by a non-zero amount', function () {
        context('when there was no pre-approved allowance', function () {
          increasesAllowance(Zero, One);
        });

        context('when there was a pre-approved allowance', function () {
          increasesAllowance(initialSupply, One);
        });
      });
    });

    describe('decreaseAllowance(address,uint256)', function () {
      context('Pre-conditions', function () {
        it('reverts when the spender is the zero address', async function () {
          await expect(this.contract.decreaseAllowance(ZeroAddress, Zero)).to.be.revertedWith(revertMessages.ApproveToZero);
        });

        it('reverts when the allowance underflows', async function () {
          await expect(this.contract.decreaseAllowance(spender.address, One)).to.be.revertedWith(revertMessages.AllowanceUnderflow);
        });
      });

      const decreasesAllowance = function (preApprovedAmount, amount) {
        const expectedAllowance = preApprovedAmount.sub(amount);

        beforeEach(async function () {
          if (!preApprovedAmount.isZero()) {
            await this.contract.approve(spender.address, preApprovedAmount);
          }

          this.receipt = await this.contract.decreaseAllowance(spender.address, amount);
        });

        it('decreases the spender allowance by the specified amount', async function () {
          expect(await this.contract.allowance(owner.address, spender.address)).to.equal(expectedAllowance);
        });

        it('emits an Approval event', async function () {
          await expect(this.receipt).to.emit(this.contract, 'Approval').withArgs(owner.address, spender.address, expectedAllowance);
        });
      };

      context('when decreasing by a zero amount', function () {
        context('when the pre-approved allowance equals the allowance decrease', function () {
          decreasesAllowance(Zero, Zero);
        });

        context('when the pre-approved allowance is greater than the allowance decrease', function () {
          decreasesAllowance(One, Zero);
        });
      });

      context('when decreasing by a non-zero amount', function () {
        context('when the pre-approved allowance equals the allowance decrease', function () {
          decreasesAllowance(Two, Two);
        });

        context('when the pre-approved allowance is greater than the allowance decrease', function () {
          decreasesAllowance(Three, Two);
        });
      });

      if (features.EIP717) {
        context('[EIP717] when decreasing the allowance of an account with maximum approval', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.decreaseAllowance(maxSpender.address, '1');
          });
          it('it does not decrease the allowance', async function () {
            expect(await this.contract.allowance(owner.address, maxSpender.address)).to.equal(MaxUInt256);
          });
          it('emits an Approval event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Approval').withArgs(owner.address, maxSpender.address, MaxUInt256);
          });
        });
      }
    });

    if (features.ERC165) {
      supportsInterfaces(['IERC20Allowance']);
    }
  });
}

module.exports = {
  behavesLikeERC20Allowance,
};
