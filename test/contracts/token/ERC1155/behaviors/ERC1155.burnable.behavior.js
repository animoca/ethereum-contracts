const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC1155Burnable({errors, interfaces, methods, deploy, mint}) {
  let accounts, deployer, owner, operator, other;

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer, owner, operator, other] = accounts;
  });

  const {'burnFrom(address,uint256,uint256)': burnFrom, 'batchBurnFrom(address,uint256[],uint256[])': batchBurnFrom} = methods || {};

  describe('like a burnable ERC1155Inventory', function () {
    const token1 = {id: 1n, supply: 10n};
    const token2 = {id: 2n, supply: 11n};
    const token3 = {id: 3n, supply: 12n};

    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, token1.id, token1.supply);
      await mint(this.token, owner.address, token2.id, token2.supply);
      await mint(this.token, owner.address, token3.id, token3.supply);
      await this.token.connect(owner).setApprovalForAll(operator.address, true);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    const revertsOnPreconditions = function (burnFunction) {
      describe('Pre-conditions', function () {
        it('reverts if the sender is not approved', async function () {
          await expectRevert(burnFunction.call(this, owner.address, token1.id, 1n, other), this.token, errors.NonApproved, {
            sender: other.address,
            owner: owner.address,
          });
          await expectRevert(burnFunction.call(this, owner.address, token1.id, 1n, other), this.token, errors.NonApproved, {
            sender: other.address,
            owner: owner.address,
          });
        });

        it('reverts if from has insufficient balance', async function () {
          await expectRevert(burnFunction.call(this, owner.address, token1.id, token1.supply + 1n, owner), this.token, errors.InsufficientBalance, {
            owner: owner.address,
            id: token1.id,
            balance: token1.supply,
            value: token1.supply + 1n,
          });
        });
      });
    };

    const burnWasSuccessful = function (tokenIds, values) {
      const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
      const vals = Array.isArray(values) ? values : [values];
      const tokens = ids.map((id, i) => [id, vals[i]]);

      if (tokens.length != 0) {
        it('decreases the sender balance(s)', async function () {
          for (const [id, value] of tokens) {
            let balance;
            if (id == token1.id) {
              balance = token1.supply;
            } else if (id == token2.id) {
              balance = token2.supply;
            } else if (id == token3.id) {
              balance = token3.supply;
            }
            balance = balance - value;
            expect(await this.token.balanceOf(owner.address, id)).to.equal(balance);
          }
        });

        if (Array.isArray(tokenIds)) {
          it('emits a TransferBatch event', async function () {
            await expect(this.receipt)
              .to.emit(this.token, 'TransferBatch')
              .withArgs(this.sender, owner.address, ethers.ZeroAddress, tokenIds, values);
          });
        } else {
          it('emits a TransferSingle event', async function () {
            await expect(this.receipt)
              .to.emit(this.token, 'TransferSingle')
              .withArgs(this.sender, owner.address, ethers.ZeroAddress, tokenIds, values);
          });
        }
      }
    };

    const burnsBySender = function (burnFunction, tokenIds, values) {
      context('when called by the owner', function () {
        beforeEach(async function () {
          this.sender = owner.address;
          this.receipt = await burnFunction.call(this, owner.address, tokenIds, values, owner);
        });
        burnWasSuccessful(tokenIds, values);
      });

      context('when called by an operator', function () {
        beforeEach(async function () {
          this.sender = operator.address;
          this.receipt = await burnFunction.call(this, owner.address, tokenIds, values, operator);
        });
        burnWasSuccessful(tokenIds, values);
      });
    };

    if (burnFrom !== undefined) {
      describe('burnFrom(address,uint256,uint256)', function () {
        const burnFn = async function (from, id, value, sender) {
          return burnFrom(this.token, from, id, value, sender);
        };

        revertsOnPreconditions(burnFn);

        context('zero value burning', function () {
          burnsBySender(burnFn, token1.id, 0n);
        });

        context('partial balance burning', function () {
          burnsBySender(burnFn, token1.id, 1n);
        });

        context('full balance burning', function () {
          burnsBySender(burnFn, token1.id, token1.supply);
        });
      });
    }

    if (batchBurnFrom !== undefined) {
      describe('batchBurnFrom(address,uint256[],uint256[])', function () {
        const burnFn = async function (from, ids, values, sender) {
          const tokenIds = Array.isArray(ids) ? ids : [ids];
          const vals = Array.isArray(values) ? values : [values];
          return batchBurnFrom(this.token, from, tokenIds, vals, sender);
        };

        revertsOnPreconditions(burnFn);

        it('reverts with inconsistent arrays', async function () {
          await expectRevert(burnFn.call(this, owner.address, [], [1n], owner), this.token, errors.InconsistentArrayLengths);
        });

        context('with an empty list of tokens', function () {
          burnsBySender(burnFn, [], []);
        });

        context('single zero value burning', function () {
          burnsBySender(burnFn, [token1.id], [0n]);
        });

        context('single partial balance burning', function () {
          burnsBySender(burnFn, [token1.id], [1n]);
        });

        context('single full balance burning', function () {
          burnsBySender(burnFn, [token1.id], [token1.supply]);
        });

        context('multiple tokens burning', function () {
          burnsBySender(burnFn, [token1.id, token2.id, token3.id], [token1.supply, 0n, token3.supply]);
        });
      });
    }

    if (interfaces && interfaces.ERC1155InventoryBurnable) {
      supportsInterfaces(['IERC1155InventoryBurnable']);
    }
  });
}

module.exports = {
  behavesLikeERC1155Burnable,
};
