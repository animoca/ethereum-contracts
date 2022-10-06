const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

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

    describe('setTokenURI()', function () {
      it('reverts if not called by the contract owner', async function () {
        await expect(this.token.connect(other).setTokenURI(tokenURI)).to.be.revertedWith(revertMessages.NotContractOwner);
      });
      it('sets the token URI', async function () {
        await this.token.setTokenURI(tokenURI);
        expect(await this.token.tokenURI()).to.equal(tokenURI);
      });
    });

    if (features.ERC165) {
      supportsInterfaces(['IERC20Metadata']);
    }
  });
}

module.exports = {
  behavesLikeERC20Metadata,
};
