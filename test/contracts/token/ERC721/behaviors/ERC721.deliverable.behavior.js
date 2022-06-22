const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {ZeroAddress} = require('../../../../../src/constants');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721Deliverable({deploy, mint, revertMessages, interfaces, features, methods}) {
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
          await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(ZeroAddress, owner.address, id);
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
          await expect(this.token.deliver([], [1])).to.be.revertedWith(revertMessages.InconsistentArrays);
          await expect(this.token.deliver([owner.address], [])).to.be.revertedWith(revertMessages.InconsistentArrays);
        });

        it('reverts if minted to the zero address', async function () {
          await expect(this.token.deliver([ZeroAddress], [1])).to.be.revertedWith(revertMessages.MintToAddressZero);
        });

        it('reverts if the token already exists', async function () {
          await this.token.deliver([owner.address], [1]);
          await expect(this.token.deliver([owner.address], [1])).to.be.revertedWith(revertMessages.ExistingToken);
        });

        it('reverts if sent by non-minter', async function () {
          await expect(this.token.connect(owner).deliver([owner.address], [1])).to.be.revertedWith(revertMessages.NotMinter);
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
