const {loadFixture} = require('../../../../helpers/fixtures');
const {expect} = require('chai');
const {ethers} = require('hardhat');
const {shouldSupportInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721Metadata({name, symbol, features, deploy, revertMessages}) {
  describe('like a ERC721Metadata', function () {
    let accounts, deployer, owner, other;
    const nft1 = 1;
    const nft2 = 2;
    const nft3 = 3;

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, other] = accounts;
    });

    const fixture = async function () {
      this.token = await deploy(deployer);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
      await this.token.mint(owner.address, nft1);
    });

    describe('Contract Metadata', function () {
      it('has a name', async function () {
        expect(await this.token.name()).to.equal(name);
      });

      it('has a symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
      });
    });

    describe('TokenMetadata', function () {
      if (features.BaseMetadataURI) {
        describe('[TokenMetadataWithBaseURI] tokenURI(uint256)', function () {
          it('reverts if the NFT does not exist', async function () {
            await expect(this.token.tokenURI(nft2)).to.be.revertedWith(revertMessages.NonExistingNFT);
          });
          it('does not revert if the NFT exists', async function () {
            await this.token.tokenURI(nft1);
          });
        });
        describe('setBaseMetadataURI(string)', function () {
          const newBaseMetadataURI = 'test/';
          it('reverts if not called by the contract owner', async function () {
            // account 'owner' is the token owner, not contract owner.
            await expect(this.token.connect(owner).setBaseMetadataURI(newBaseMetadataURI)).to.be.revertedWith(revertMessages.NotContractOwner);
          });
          it('updates the base token URI for a token', async function () {
            await this.token.setBaseMetadataURI(newBaseMetadataURI); // doesn't revert
            expect(await this.token.tokenURI(nft1)).to.equal(newBaseMetadataURI + nft1.toString());
          });
          it('emits the BaseMetadataURISet event', async function () {
            let receipt = await this.token.setBaseMetadataURI(newBaseMetadataURI);
            await expect(receipt).to.emit(this.token, 'BaseMetadataURISet');
          });
          it('updates the base URI returned from the baseMetadataURI method', async function () {
            await this.token.setBaseMetadataURI(newBaseMetadataURI);
            expect(await this.token.baseMetadataURI()).to.equal(newBaseMetadataURI);
          });
        });
      } else {
        describe('[TokenMetadata] tokenURI(uint256)', function () {
          it('returns tokenURI if NFT exists and uri set', async function () {
            await this.token.setTokenURI(nft1, 'uri1');
            await this.token.tokenURI(nft1);
          });
          it("reverts if NFT doesn't exist", async function () {
            await expect(this.token.tokenURI(nft2)).to.be.revertedWith(revertMessages.NonExistingNFT);
          });
          it("reverts if NFT exists but uri isn't set", async function () {
            await expect(this.token.tokenURI(nft1)).to.be.revertedWith(revertMessages.NonExistingNFT);
          });
          it('the correct uri is returned', async function () {
            await this.token.batchMint(owner.address, [nft2, nft3]);
            await this.token.connect(deployer).batchSetTokenURI([nft2, nft3], ['uri2', 'uri3']);
            expect(await this.token.tokenURI(nft2)).to.equal('uri2');
            expect(await this.token.tokenURI(nft3)).to.equal('uri3');
          });
        });
        describe('setTokenURI(uint256,string)', function () {
          it('does not revert if set by contract owner', async function () {
            await this.token.connect(deployer).setTokenURI(nft1, 'uri');
          });
          it('reverts when set by other than contract owner', async function () {
            await expect(this.token.connect(other).setTokenURI(nft1, 'uri')).to.be.revertedWith(revertMessages.NotContractOwner);
          });
        });
        describe('batchSetTokenURI(uint256[],string[])', function () {
          it('does not revert if batch set by contract owner', async function () {
            await this.token.connect(deployer).batchSetTokenURI([nft1, nft2], ['uri1', 'uri2']);
          });
          it('reverts when batch set by other than contract owner', async function () {
            await expect(this.token.connect(other).batchSetTokenURI([nft1, nft2], ['uri1', 'uri2'])).to.be.revertedWith(
              revertMessages.NotContractOwner
            );
          });
          it('reverts when tokenIds and tokenURIs arrays have different length', async function () {
            await expect(this.token.batchSetTokenURI([nft1, nft2], ['uri1'])).to.be.revertedWith(revertMessages.InconsistentArrays);
          });
        });
      }
    });
    shouldSupportInterfaces(['contracts/token/ERC721/interfaces/IERC721Metadata.sol:IERC721Metadata']);
  });
}

module.exports = {
  behavesLikeERC721Metadata,
};
