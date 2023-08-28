const {ethers} = require('hardhat');
const {constants} = ethers;
const {expect} = require('chai');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');

describe('TokenMetadataResolverPerToken', function () {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.resolver = await deployContract('TokenMetadataResolverPerToken');
    this.token = await deployContract('ERC721Full', '', '', this.resolver.address, constants.AddressZero, await getForwarderRegistryAddress());
    await this.token.grantRole(await this.token.MINTER_ROLE(), deployer.address);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('tokenMetadataURI(address,uint256)', function () {
    it('returns an empty string if the token URI has not been set', async function () {
      expect(await this.resolver.tokenMetadataURI(this.token.address, 1)).to.equal('');
    });
  });

  describe('setTokenURI(address,uint256,string)', function () {
    it('reverts if not called by a minter', async function () {
      await expect(this.resolver.connect(other).setTokenURI(this.token.address, 1, 'uri'))
        .to.be.revertedWithCustomError(this.resolver, 'NotTargetContractRoleHolder')
        .withArgs(this.token.address, await this.token.MINTER_ROLE(), other.address);
    });

    it('sets the URI for the token', async function () {
      await this.resolver.setTokenURI(this.token.address, 1, 'uri');
      expect(await this.resolver.tokenMetadataURI(this.token.address, 1)).to.equal('uri');
    });
  });

  describe('batchSetTokenURI(address,uint256[],string[])', function () {
    it('reverts if not called by a minter', async function () {
      await expect(this.resolver.connect(other).batchSetTokenURI(this.token.address, [1, 2], ['uri1', 'uri2']))
        .to.be.revertedWithCustomError(this.resolver, 'NotTargetContractRoleHolder')
        .withArgs(this.token.address, await this.token.MINTER_ROLE(), other.address);
    });

    it('reverts when tokenIds and tokenURIs arrays have different length', async function () {
      await expect(this.resolver.batchSetTokenURI(this.token.address, [1, 2], ['uri1'])).to.be.revertedWithCustomError(
        this.resolver,
        'InconsistentArrayLengths'
      );
    });

    it('sets the URIs for the tokens', async function () {
      await this.resolver.batchSetTokenURI(this.token.address, [1, 2], ['uri1', 'uri2']);
      expect(await this.resolver.tokenMetadataURI(this.token.address, 1)).to.equal('uri1');
      expect(await this.resolver.tokenMetadataURI(this.token.address, 2)).to.equal('uri2');
    });
  });
});
