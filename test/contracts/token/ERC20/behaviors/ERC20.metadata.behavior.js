const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC20Metadata(implementation) {
  const {tokenURI, deploy, features, errors} = implementation;

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
        await expectRevert(this.token.connect(other).setTokenURI(tokenURI), this.token, errors.NotContractOwner, {
          account: other.address,
        });
      });
      it('sets the token URI', async function () {
        await this.token.setTokenURI(tokenURI);
        expect(await this.token.tokenURI()).to.equal(tokenURI);
      });
    });

    if (features && features.ERC165) {
      supportsInterfaces(['IERC20Metadata']);
    }
  });
}

module.exports = {
  behavesLikeERC20Metadata,
};
