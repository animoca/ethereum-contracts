const {ethers} = require('hardhat');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC1155MetadataURI({deploy, features}) {
  describe('like an ERC1155 Metadata', function () {
    let accounts, deployer, owner, other;

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, other] = accounts;
    });

    const fixture = async function () {
      this.token = await deploy(deployer);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('uri(uint256)', function () {
      it('does not revert if the token does not exist', async function () {
        await this.token.uri(1);
      });
    });

    if (features && features.MetadataResolver) {
      describe('metadataResolver()', function () {
        it('returns a non-zero address', async function () {
          await expect(this.token.metadataResolver()).to.not.equal(ethers.constants.AddressZero);
        });
      });
    }

    supportsInterfaces(['IERC1155MetadataURI']);
  });
}

module.exports = {
  behavesLikeERC1155MetadataURI,
};
