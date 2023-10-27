const {ethers} = require('hardhat');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC1155MetadataURI({deploy, features}) {
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

    if (features && features.MetadataResolver) {
      describe('metadataResolver()', function () {
        it('returns a non-zero address', async function () {
          await expect(this.token.metadataResolver()).to.not.equal(ethers.ZeroAddress);
        });
      });

      describe('setTokenURI(uint256,string)', function () {
        it('reverts if not called by the metadata resolver', async function () {
          await expect(this.token.setTokenURI(1, 'uri')).to.be.revertedWithCustomError(this.token, 'NotMetadataResolver').withArgs(deployer.address);
        });

        it('emits a URI event', async function () {
          const contract = await deploy(deployer, {metadataResolver: deployer.address});
          await expect(contract.setTokenURI(1, 'uri')).to.emit(contract, 'URI').withArgs('uri', 1);
        });
      });

      describe('batchSetTokenURI(uint256[],string[])', function () {
        it('reverts if not called by the metadata resolver', async function () {
          await expect(this.token.batchSetTokenURI([1], ['uri']))
            .to.be.revertedWithCustomError(this.token, 'NotMetadataResolver')
            .withArgs(deployer.address);
        });

        it('reverts with inconsistent array lengths', async function () {
          const contract = await deploy(deployer, {metadataResolver: deployer.address});
          await expect(contract.batchSetTokenURI([1], [])).to.be.revertedWithCustomError(contract, 'InconsistentArrayLengths');
          await expect(contract.batchSetTokenURI([], ['uri'])).to.be.revertedWithCustomError(contract, 'InconsistentArrayLengths');
        });

        it('emits URI events', async function () {
          const contract = await deploy(deployer, {metadataResolver: deployer.address});
          await expect(await contract.batchSetTokenURI([1, 2], ['uri1', 'uri2']))
            .to.emit(contract, 'URI')
            .withArgs('uri1', 1)
            .to.emit(contract, 'URI')
            .withArgs('uri2', 2);
        });
      });
    }

    supportsInterfaces(['IERC1155MetadataURI']);
  });
}

module.exports = {
  behavesLikeERC1155MetadataURI,
};
