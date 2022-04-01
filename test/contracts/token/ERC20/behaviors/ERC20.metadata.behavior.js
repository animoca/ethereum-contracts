const {loadFixture} = require('../../../../helpers/fixtures');
const {shouldSupportInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC20Metadata(implementation) {
  const {tokenURI, deploy, features, revertMessages} = implementation;

  describe('like an ERC20 Metadata', function () {
    let deployer, other;

    before(async function () {
      [deployer, other] = await ethers.getSigners();
    });

    const fixture = async function () {
      this.token = await deploy([], [], deployer);
      await this.token.setTokenURI(tokenURI);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('tokenURI()', function () {
      it('returns the token URI', async function () {
        expect(await this.token.tokenURI()).to.equal(tokenURI);
      });
    });

    describe('setTokenURI()', function () {
      const newTokenURI = 'test';
      it('reverts if not called by the contract owner', async function () {
        await expect(this.token.connect(other).setTokenURI(newTokenURI)).to.be.revertedWith(revertMessages.NotContractOwner);
      });
      it('updates the token URI', async function () {
        await this.token.setTokenURI(newTokenURI);
        expect(await this.token.tokenURI()).to.equal(newTokenURI);
      });
    });

    if (features.ERC165) {
      shouldSupportInterfaces(['IERC20Metadata']);
    }
  });
}

module.exports = {
  behavesLikeERC20Metadata,
};
