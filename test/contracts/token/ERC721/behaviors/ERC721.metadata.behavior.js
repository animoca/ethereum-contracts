const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
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
      it('does not revert when called on an existing token', async function () {
        await this.token.mint(deployer.address, 1);
        await this.token.tokenURI(1);
      });

      it('reverts if the token does not exist', async function () {
        await expect(this.token.tokenURI(1)).to.be.revertedWith(revertMessages.NonExistingToken);
      });
    });

    if (implementation.features.MetadataResolver) {
      describe('metadataResolver()', function () {
        it('returns a non-zero address', async function () {
          await expect(this.token.metadataResolver()).to.not.equal(ethers.constants.AddressZero);
        });
      });
    }

    supportsInterfaces(['IERC721Metadata']);
  });
}

module.exports = {
  behavesLikeERC721Metadata,
};
