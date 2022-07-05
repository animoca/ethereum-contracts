const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {behavesLikeTokenMetadataPerToken} = require('../../metadata/behaviors/TokenMetadata.pertoken.behavior');
const {behavesLikeTokenMetadataWithBaseURI} = require('../../metadata/behaviors/TokenMetadata.withbaseuri.behavior');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC1155MetadataURI(implementation) {
  const {deploy} = implementation;

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
        await expect(this.token.uri(1)).not.to.be.reverted;
      });
    });

    supportsInterfaces(['IERC1155MetadataURI']);
  });

  if (implementation.features.BaseMetadataURI) {
    behavesLikeTokenMetadataWithBaseURI(implementation);
  } else if (implementation.features.MetadataPerToken) {
    behavesLikeTokenMetadataPerToken(implementation);
  }
}

module.exports = {
  behavesLikeERC1155MetadataURI,
};
