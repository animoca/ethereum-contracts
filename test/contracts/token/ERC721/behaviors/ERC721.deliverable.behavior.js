const {ethers} = require('hardhat');
const {constants} = ethers;
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721Deliverable({deploy, errors}) {
  describe('like an ERC721 Deliverable', function () {
    let accounts, deployer, owner;

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner] = accounts;
    });

    const fixture = async function () {
      this.token = await deploy(deployer);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    const mintWasSuccessful = function (tokenIds) {
      const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
      it('gives the ownership of the token(s) to the given address', async function () {
        for (const id of ids) {
          expect(await this.token.ownerOf(id)).to.equal(owner.address);
        }
      });

      it('has an empty approval for the token(s)', async function () {
        for (const id of ids) {
          expect(await this.token.ownerOf(id)).to.equal(owner.address);
        }
      });

      it('emits Transfer event(s)', async function () {
        for (const id of ids) {
          await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(constants.AddressZero, owner.address, id);
        }
      });

      it('adjusts recipient balance', async function () {
        const quantity = Array.isArray(tokenIds) ? tokenIds.length : 1;
        expect(await this.token.balanceOf(owner.address)).to.equal(quantity);
      });
    };

    describe('deliver(address[],uint256[])', function () {
      describe('Pre-conditions', function () {
        it('reverts with inconsistent arrays', async function () {
          await expectRevert(this.token.deliver([], [1]), this.token, errors.InconsistentArrayLengths);
          await expectRevert(this.token.deliver([owner.address], []), this.token, errors.InconsistentArrayLengths);
        });

        it('reverts if minted to the zero address', async function () {
          await expectRevert(this.token.deliver([constants.AddressZero], [1]), this.token, errors.MintToAddressZero);
        });

        it('reverts if the token already exists', async function () {
          await this.token.deliver([owner.address], [1]);
          await expectRevert(this.token.deliver([owner.address], [1]), this.token, errors.ExistingToken, {
            tokenId: 1,
          });
        });

        it('reverts if sent by non-minter', async function () {
          await expectRevert(this.token.connect(owner).deliver([owner.address], [1]), this.token, errors.NotMinter, {
            role: await this.token.MINTER_ROLE(),
            account: owner.address,
          });
        });
      });

      context('with an empty list of tokens', function () {
        this.beforeEach(async function () {
          this.receipt = await this.token.deliver([], []);
        });
        mintWasSuccessful([]);
      });
      context('with a single token', function () {
        this.beforeEach(async function () {
          this.receipt = await this.token.deliver([owner.address], [1]);
        });
        mintWasSuccessful([1]);
      });
      context('with a list of tokens from the same collection', function () {
        this.beforeEach(async function () {
          this.receipt = await this.token.deliver([owner.address, owner.address], [1, 2]);
        });
        mintWasSuccessful([1, 2]);
      });
    });

    supportsInterfaces(['IERC721Deliverable']);
  });
}

module.exports = {
  behavesLikeERC721Deliverable,
};
