const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721Metadata({name, symbol, deploy, errors, features}) {
  describe('like an ERC721 Metadata', function () {
    let deployer;

    before(async function () {
      [deployer] = await ethers.getSigners();
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
        await expectRevert(this.token.tokenURI(1), this.token, errors.NonExistingToken, {
          tokenId: 1,
        });
      });
    });

    if (features && features.MetadataResolver) {
      describe('metadataResolver()', function () {
        it('returns a non-zero address', async function () {
          await expect(this.token.metadataResolver()).to.not.equal(ethers.ZeroAddress);
        });
      });
    }

    supportsInterfaces(['IERC721Metadata']);
  });
}

module.exports = {
  behavesLikeERC721Metadata,
};
