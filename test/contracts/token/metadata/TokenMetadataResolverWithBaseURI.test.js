const {ethers} = require('hardhat');
const {constants} = ethers;
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');

describe('TokenMetadataResolverPerToken', function () {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.resolver = await deployContract('TokenMetadataResolverWithBaseURI');
    this.token = await deployContract('ERC721Full', '', '', this.resolver.address, constants.AddressZero, await getForwarderRegistryAddress());
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('setBaseMetadataURI(address, string)', function () {
    const baseMetadataURI = 'uri';

    it('reverts if not called by the token contract owner', async function () {
      await expect(this.resolver.connect(other).setBaseMetadataURI(this.token.address, baseMetadataURI))
        .to.be.revertedWithCustomError(this.resolver, 'NotTargetContractOwner')
        .withArgs(this.token.address, other.address);
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.resolver.setBaseMetadataURI(this.token.address, baseMetadataURI);
      });

      it('updates the base metadata URI', async function () {
        expect(await this.resolver.baseMetadataURI(this.token.address)).to.equal(baseMetadataURI);
      });

      it('updates the value returned by tokenMetadata', async function () {
        expect(await this.resolver.tokenMetadataURI(this.token.address, 1)).to.equal(baseMetadataURI + '1');
      });

      it('emits a BaseMetadataURISet event', async function () {
        await expect(this.receipt).to.emit(this.resolver, 'BaseMetadataURISet').withArgs(this.token.address, baseMetadataURI);
      });
    });
  });
});
