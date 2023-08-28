const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {nonFungibleTokenId} = require('../../token');

function behavesLikeERC1155WithOperatorFilterer({errors, deploy, mint}) {
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

  describe('like an ERC1155 with OperatorFilterer', function () {
    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, fungible1.id, fungible1.supply);
      await mint(this.token, owner.address, fungible2.id, fungible2.supply);
      await mint(this.token, owner.address, fungible3.id, fungible3.supply);
      await mint(this.token, owner.address, nft1, 1);
      await mint(this.token, owner.address, nft2, 1);
      await this.token.connect(owner).setApprovalForAll(operator.address, true);
      this.refusingOperatorRegistry = await deployContract('OperatorFilterRegistryMock', false);
      await this.token.updateOperatorFilterRegistry(this.refusingOperatorRegistry.address);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('operatorFilterRegistry()', function () {
      it('returns the correct value', async function () {
        expect(await this.token.operatorFilterRegistry()).to.equal(this.refusingOperatorRegistry.address);
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
              transferFunction.call(this, owner.address, other.address, fungible1.id, 1, data, operator),
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
