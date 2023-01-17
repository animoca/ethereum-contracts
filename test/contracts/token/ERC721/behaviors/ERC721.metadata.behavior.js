const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {behavesLikeTokenMetadataPerToken} = require('../../metadata/behaviors/TokenMetadata.pertoken.behavior');
const {behavesLikeTokenMetadataWithBaseURI} = require('../../metadata/behaviors/TokenMetadata.withbaseuri.behavior');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721Metadata(implementation) {
  const {name, symbol, deploy, features, revertMessages} = implementation;

  describe('like an ERC721 Metadata', function () {
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

    describe('name()', function () {
      it('returns the correct value', async function () {
        expect(await this.token.name()).to.equal(name);
      });
    });

    describe('symbol()', function () {
      it('returns the correct value', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
      });
    });

    describe('tokenURI(uint256)', function () {
      it('reverts if the token does not exist', async function () {
        await expect(this.token.tokenURI(1)).to.be.revertedWith(revertMessages.NonExistingToken);
      });
    });

    supportsInterfaces(['IERC721Metadata']);
  });

  if (features.BaseMetadataURI) {
    behavesLikeTokenMetadataWithBaseURI(implementation);
  } else if (features.MetadataPerToken) {
    behavesLikeTokenMetadataPerToken(implementation);
  }
}

module.exports = {
  behavesLikeERC721Metadata,
};
