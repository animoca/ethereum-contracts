const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC20Detailed(implementation) {
  const {name, symbol, decimals, features, deploy} = implementation;

  describe('like an ERC20 Detailed', function () {
    let deployer;

    before(async function () {
      [deployer] = await ethers.getSigners();
    });

    const fixture = async function () {
      this.token = await deploy([], [], deployer);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('name()', function () {
      it('returns the correct name', async function () {
        expect(await this.token.name()).to.equal(name);
      });
    });

    describe('symbol()', function () {
      it('returns the correct symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
      });
    });

    describe('decimals()', function () {
      it('returns the correct amount of decimals', async function () {
        expect(await this.token.decimals()).to.equal(decimals);
      });
    });

    if (features.ERC165) {
      supportsInterfaces(['IERC20Detailed']);
    }
  });
}

module.exports = {
  behavesLikeERC20Detailed,
};
