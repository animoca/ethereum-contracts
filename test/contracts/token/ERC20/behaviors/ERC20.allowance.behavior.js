const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC20Allowance(implementation) {
  const {features, errors, deploy} = implementation;

  describe('like an ERC20 Allowance', function () {
    let deployer, owner, spender, maxSpender;

    const initialSupply = 100n;

    before(async function () {
      [deployer, owner, spender, maxSpender] = await ethers.getSigners();
    });

    const fixture = async function () {
      this.contract = (await deploy([owner.address], [initialSupply], deployer)).connect(owner);
      await this.contract.approve(maxSpender.address, ethers.MaxUint256);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('increaseAllowance(address,uint256)', function () {
      context('Pre-conditions', function () {
        it('reverts when the spender is the zero address', async function () {
          await expectRevert(this.contract.increaseAllowance(ethers.ZeroAddress, 0), this.contract, errors.ApprovalToAddressZero, {
            owner: owner.address,
          });
        });

        it('reverts when the allowance overflows', async function () {
          await this.contract.increaseAllowance(spender.address, 1);
          await expectRevert(this.contract.increaseAllowance(spender.address, ethers.MaxUint256), this.contract, errors.AllowanceOverflow, {
            owner: owner.address,
            spender: spender.address,
            allowance: 1,
            increment: ethers.MaxUint256,
          });
        });
      });

      const increasesAllowance = function (preApprovedAmount, amount) {
        const expectedAllowance = preApprovedAmount + amount;

        beforeEach(async function () {
          if (preApprovedAmount != 0n) {
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
          increasesAllowance(0n, 0n);
        });

        context('when there was a pre-approved allowance', function () {
          increasesAllowance(initialSupply, 0n);
        });
      });

      context('when increasing by a non-zero amount', function () {
        context('when there was no pre-approved allowance', function () {
          increasesAllowance(0n, 1n);
        });

        context('when there was a pre-approved allowance', function () {
          increasesAllowance(initialSupply, 1n);
        });
      });
    });

    describe('decreaseAllowance(address,uint256)', function () {
      context('Pre-conditions', function () {
        it('reverts when the spender is the zero address', async function () {
          await expectRevert(this.contract.decreaseAllowance(ethers.ZeroAddress, 0), this.contract, errors.ApprovalToAddressZero, {
            owner: owner.address,
          });
        });

        it('reverts when the allowance underflows', async function () {
          await expectRevert(this.contract.decreaseAllowance(spender.address, 1), this.contract, errors.AllowanceUnderflow, {
            owner: owner.address,
            spender: spender.address,
            allowance: 0,
            decrement: 1,
          });
        });
      });

      const decreasesAllowance = function (preApprovedAmount, amount) {
        const expectedAllowance = preApprovedAmount - amount;

        beforeEach(async function () {
          if (preApprovedAmount != 0n) {
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
          decreasesAllowance(0n, 0n);
        });

        context('when the pre-approved allowance is greater than the allowance decrease', function () {
          decreasesAllowance(1n, 0n);
        });
      });

      context('when decreasing by a non-zero amount', function () {
        context('when the pre-approved allowance equals the allowance decrease', function () {
          decreasesAllowance(2n, 2n);
        });

        context('when the pre-approved allowance is greater than the allowance decrease', function () {
          decreasesAllowance(2n, 1n);
        });
      });

      if (features && features.EIP717) {
        context('[EIP717] when decreasing the allowance of an account with maximum approval', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.decreaseAllowance(maxSpender.address, '1');
          });
          it('it does not decrease the allowance', async function () {
            expect(await this.contract.allowance(owner.address, maxSpender.address)).to.equal(ethers.MaxUint256);
          });
          it('emits an Approval event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Approval').withArgs(owner.address, maxSpender.address, ethers.MaxUint256);
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
