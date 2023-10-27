const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');

function behavesLikeERC1155WithOperatorFilterer({errors, deploy, mint}) {
  let accounts, deployer, owner, approved, operator, other;

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer, owner, approved, operator, other] = accounts;
  });

  const token1 = {id: 1n, supply: 10n};
  const token2 = {id: 2n, supply: 11n};
  const token3 = {id: 3n, supply: 12n};

  describe('like an ERC1155 with OperatorFilterer', function () {
    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, token1.id, token1.supply);
      await mint(this.token, owner.address, token2.id, token2.supply);
      await mint(this.token, owner.address, token3.id, token3.supply);
      await this.token.connect(owner).setApprovalForAll(operator.address, true);
      this.refusingOperatorRegistry = await deployContract('OperatorFilterRegistryMock', false);
      await this.token.updateOperatorFilterRegistry(this.refusingOperatorRegistry.getAddress());
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('operatorFilterRegistry()', function () {
      it('returns the correct value', async function () {
        expect(await this.token.operatorFilterRegistry()).to.equal(await this.refusingOperatorRegistry.getAddress());
      });
    });

    describe('setApprovalForAll(address,bool)', function () {
      it('reverts when setting an operator', async function () {
        await expectRevert(this.token.connect(owner).setApprovalForAll(other.address, true), this.token, errors.OperatorNotAllowed, {
          operator: other.address,
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
      const revertsOnPreconditions = function (transferFunction) {
        describe('Pre-conditions', function () {
          const data = '0x42';
          it('reverts if sent by an operator', async function () {
            await expectRevert(
              transferFunction.call(this, owner.address, other.address, token1.id, 1, data, operator),
              this.token,
              errors.OperatorNotAllowed,
              {
                operator: operator.address,
              }
            );
          });
        });
      };

      describe('safeTransferFrom(address,address,uint256,uint256,bytes)', function () {
        const transferFn = async function (from, to, id, value, data, sender) {
          return this.token.connect(sender)['safeTransferFrom(address,address,uint256,uint256,bytes)'](from, to, id, value, data);
        };

        revertsOnPreconditions(transferFn);
      });

      describe('safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)', function () {
        const transferFn = async function (from, to, ids, values, data, sender) {
          const ids_ = Array.isArray(ids) ? ids : [ids];
          const values_ = Array.isArray(values) ? values : [values];
          return this.token.connect(sender)['safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'](from, to, ids_, values_, data);
        };
        revertsOnPreconditions(transferFn);
      });
    });
  });
}

module.exports = {
  behavesLikeERC1155WithOperatorFilterer,
};
