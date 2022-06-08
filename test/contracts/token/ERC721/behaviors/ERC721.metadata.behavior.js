const {loadFixture} = require('../../../../helpers/fixtures');
const {expect} = require('chai');
const {ethers} = require('hardhat');
const {shouldSupportInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');
const {deployTestHelperContractWithTxReceipt, getForwarderRegistryAddress} = require('../../../../helpers/run');
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

    async function getObjectsForTestingConstructorEventEmission() {
      const forwarderRegistryAddress = await getForwarderRegistryAddress();
      const [contract, txReceipt] = await deployTestHelperContractWithTxReceipt('ERC721BurnableMock', [
        'ERC721BurnableMock',
        'ERC721BurnableMock',
        'uri',
        forwarderRegistryAddress,
      ]);
      return [contract, txReceipt];
    }

    const fixture = async function () {
      this.token = await deploy(deployer);
      // We deploy a mock contract to get access to the creation tx receipt, to test constructor events.
      const [contract, txReceipt] = await getObjectsForTestingConstructorEventEmission();
      this.contractWithBaseMetadataURIEventInConstructor = contract;
      this.creationTxReceipt = txReceipt;
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
      await this.token.mint(owner.address, nft1);
    });

    describe('ERC721Metadata', function () {
      it('has a name', async function () {
        expect(await this.token.name()).to.equal(name);
      });

      it('has a symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
      });

      it('reverts if the NFT does not exist', async function () {
        await expect(this.token.tokenURI(nft2)).to.be.revertedWith(revertMessages.NonExistingNFT);
      });
    });

    describe('TokenMetadata', function () {
      if (features.BaseMetadataURI) {
        const originalBaseMetadataURI = 'uri';
        const newBaseMetadataURI = 'new-uri';
        describe('[TokenMetadataWithBaseURI] tokenURI(uint256)', function () {
          it('does not revert if the NFT exists', async function () {
            await this.token.tokenURI(nft1);
          });
          it('includes the base token URI', async function () {
            await this.token.setBaseMetadataURI(newBaseMetadataURI);
            expect(await this.token.tokenURI(nft1)).to.equal(newBaseMetadataURI + nft1.toString());
          });
        });
        describe('contructor(string,string,string,address)', function () {
          it(' emits BaseMetadataURISet event on contract creation', async function () {
            await expect(this.creationTxReceipt).to.emit(this.contractWithBaseMetadataURIEventInConstructor, 'BaseMetadataURISet').withArgs('uri');
          });
          it('baseMetadataURI() returns base uri after contract creation, but before calling setBaseMetadataURI', async function () {
            expect(await this.token.baseMetadataURI()).to.equal(originalBaseMetadataURI);
          });
        });
        describe('setBaseMetadataURI(string)', function () {
          it('reverts if not called by the contract owner', async function () {
            await expect(this.token.connect(other).setBaseMetadataURI(newBaseMetadataURI)).to.be.revertedWith(revertMessages.NotContractOwner);
          });
          it('does not revert when set by owner', async function () {
            await this.token.setBaseMetadataURI(newBaseMetadataURI);
          });
          it('emits the BaseMetadataURISet event', async function () {
            let receipt = await this.token.setBaseMetadataURI(newBaseMetadataURI);
            await expect(receipt).to.emit(this.token, 'BaseMetadataURISet').withArgs(newBaseMetadataURI);
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
