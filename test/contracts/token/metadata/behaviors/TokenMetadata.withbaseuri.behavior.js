const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');

function behavesLikeTokenMetadataWithBaseURI({baseMetadataURI, deploy, mint, tokenMetadata, revertMessages}) {
  describe('like a Token Metadata With Base URI', function () {
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

    describe('[BaseMetadataURI] contructor', function () {
      it('emits a BaseMetadataURISet event', async function () {
        await expect(this.token.deployTransaction.hash).to.emit(this.token, 'BaseMetadataURISet').withArgs(baseMetadataURI);
      });

      it('sets the base metadata URI', async function () {
        expect(await this.token.baseMetadataURI()).to.equal(baseMetadataURI);
      });
    });

    describe('[BaseMetadataURI] tokenMetadata', function () {
      it('returns the concatenation of baseMetadataURI and tokenId', async function () {
        expect(await tokenMetadata(this.token, nft1)).to.equal(baseMetadataURI + nft1.toString());
      });
    });

    describe('[BaseMetadataURI] setBaseMetadataURI(string)', function () {
      const newBaseMetadataURI = 'new-uri';

      it('reverts if not called by the contract owner', async function () {
        await expect(this.token.connect(other).setBaseMetadataURI(newBaseMetadataURI)).to.be.revertedWith(revertMessages.NotContractOwner);
      });

      context('when successful', function () {
        beforeEach(async function () {
          this.receipt = await this.token.setBaseMetadataURI(newBaseMetadataURI);
        });
        it('updates the base metadata URI', async function () {
          expect(await this.token.baseMetadataURI()).to.equal(newBaseMetadataURI);
        });

        it('updates the value returned by tokenMetadata', async function () {
          expect(await tokenMetadata(this.token, nft1)).to.equal(newBaseMetadataURI + nft1.toString());
        });

        it('emits a BaseMetadataURISet event', async function () {
          await expect(this.receipt).to.emit(this.token, 'BaseMetadataURISet').withArgs(newBaseMetadataURI);
        });
      });
    });
  });
}

module.exports = {
  behavesLikeTokenMetadataWithBaseURI,
};
