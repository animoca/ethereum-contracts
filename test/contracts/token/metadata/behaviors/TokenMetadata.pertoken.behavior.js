const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');

function behavesLikeTokenMetadataPerToken({deploy, mint, tokenMetadata, revertMessages}) {
  describe('like a Token Metadata Per Token', function () {
    let accounts, deployer, owner, other;

    const nft1 = 1;
    const nft2 = 2;

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, other] = accounts;
    });

    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, nft1, 1);
      await mint(this.token, owner.address, nft2, 1);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('[MetadataPerToken] tokenMetadata', function () {
      it('returns an empty string if the token URI has not been set', async function () {
        expect(await tokenMetadata(this.token, nft1)).to.equal('');
      });
    });

    describe('[MetadataPerToken] setTokenURI(uint256,string)', function () {
      it('reverts if not called by a minter', async function () {
        await expect(this.token.connect(other).setTokenURI(nft1, 'uri')).to.be.revertedWith(revertMessages.NotMinter);
      });

      it('sets the URI for the token', async function () {
        await this.token.setTokenURI(nft1, 'uri');
        expect(await tokenMetadata(this.token, nft1)).to.equal('uri');
      });
    });

    describe('[MetadataPerToken] batchSetTokenURI(uint256[],string[])', function () {
      it('reverts if not called by a minter', async function () {
        await expect(this.token.connect(other).batchSetTokenURI([nft1, nft2], ['uri1', 'uri2'])).to.be.revertedWith(revertMessages.NotMinter);
      });

      it('reverts when tokenIds and tokenURIs arrays have different length', async function () {
        await expect(this.token.batchSetTokenURI([nft1, nft2], ['uri1'])).to.be.revertedWith(revertMessages.MetadataInconsistentArrays);
      });

      it('sets the URIs for the tokens', async function () {
        await this.token.batchSetTokenURI([nft1, nft2], ['uri1', 'uri2']);
        expect(await tokenMetadata(this.token, nft1)).to.equal('uri1');
        expect(await tokenMetadata(this.token, nft2)).to.equal('uri2');
      });
    });
  });
}

module.exports = {
  behavesLikeTokenMetadataPerToken,
};
