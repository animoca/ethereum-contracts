const {ethers} = require('hardhat');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
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
        await this.token.uri(1);
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
