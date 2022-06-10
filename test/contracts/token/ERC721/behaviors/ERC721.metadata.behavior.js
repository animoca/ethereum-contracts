const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {shouldSupportInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721Metadata({name, symbol, baseMetadataURI, features, deploy, mint, revertMessages}) {
  describe('like an ERC721Metadata', function () {
    let accounts, deployer, owner, other;

    const nft1 = 1;
    const nft2 = 2;
    const nonExistingNFT = 3;

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, other] = accounts;
    });

    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, nft1);
      await mint(this.token, owner.address, nft2);
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
      it('reverts if the NFT does not exist', async function () {
        await expect(this.token.tokenURI(nonExistingNFT)).to.be.revertedWith(revertMessages.NonExistingNFT);
      });
    });

    if (features.BaseMetadataURI) {
      describe('[BaseMetadataURI] contructor(string,string,string,address)', function () {
        it('emits a BaseMetadataURISet event', async function () {
          await expect(this.token.deployTransaction.hash).to.emit(this.token, 'BaseMetadataURISet').withArgs(baseMetadataURI);
        });

        it('sets the base metadata URI', async function () {
          expect(await this.token.baseMetadataURI()).to.equal(baseMetadataURI);
        });
      });

      describe('[BaseMetadataURI] tokenURI(uint256)', function () {
        it('returns the concatenation of baseMetadataURI and tokenId', async function () {
          expect(await this.token.tokenURI(nft1)).to.equal(baseMetadataURI + nft1.toString());
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

          it('updates the value returned by tokenURI', async function () {
            expect(await this.token.tokenURI(nft1)).to.equal(newBaseMetadataURI + nft1.toString());
          });

          it('emits a BaseMetadataURISet event', async function () {
            await expect(this.receipt).to.emit(this.token, 'BaseMetadataURISet').withArgs(newBaseMetadataURI);
          });
        });
      });
    } else {
      describe('[IndividualTokenURIs] tokenURI(uint256)', function () {
        it('returns an empty string if the token URI has not been set', async function () {
          expect(await this.token.tokenURI(nft1)).to.equal('');
        });
      });

      describe('[IndividualTokenURIs] setTokenURI(uint256,string)', function () {
        it('reverts if not called by the contract owner', async function () {
          await expect(this.token.connect(other).setTokenURI(nft1, 'uri')).to.be.revertedWith(revertMessages.NotContractOwner);
        });

        it('sets the URI for the token', async function () {
          await this.token.setTokenURI(nft1, 'uri');
          expect(await this.token.tokenURI(nft1)).to.equal('uri');
        });
      });

      describe('[IndividualTokenURIs] batchSetTokenURI(uint256[],string[])', function () {
        it('reverts if not called by the contract owner', async function () {
          await expect(this.token.connect(other).batchSetTokenURI([nft1, nft2], ['uri1', 'uri2'])).to.be.revertedWith(
            revertMessages.NotContractOwner
          );
        });

        it('reverts when tokenIds and tokenURIs arrays have different length', async function () {
          await expect(this.token.batchSetTokenURI([nft1, nft2], ['uri1'])).to.be.revertedWith(revertMessages.MetadataInconsistentArrays);
        });

        it('sets the URIs for the tokens', async function () {
          await this.token.batchSetTokenURI([nft1, nft2], ['uri1', 'uri2']);
          expect(await this.token.tokenURI(nft1)).to.equal('uri1');
          expect(await this.token.tokenURI(nft2)).to.equal('uri2');
        });
      });
    }
    shouldSupportInterfaces(['contracts/token/ERC721/interfaces/IERC721Metadata.sol:IERC721Metadata']);
  });
}

module.exports = {
  behavesLikeERC721Metadata,
};
