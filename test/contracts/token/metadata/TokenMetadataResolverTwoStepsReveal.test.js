const {ethers} = require('hardhat');
const {constants} = ethers;
const {expect} = require('chai');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');

const preRevealBaseMetadataURI = 'preReveal/';
const postRevealBaseMetadataURI = 'postReveal/';

describe('TokenMetadataResolverTwoStepsReveal', function () {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.resolver = await deployContract('TokenMetadataResolverTwoStepsReveal');
    this.token = await deployContract('ERC721Full', '', '', this.resolver.address, constants.AddressZero, await getForwarderRegistryAddress());
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('setBaseMetadataURIs(address,string,string)', function () {
    it('reverts if not called by the token contract owner', async function () {
      await expect(this.resolver.connect(other).setBaseMetadataURIs(this.token.address, preRevealBaseMetadataURI, postRevealBaseMetadataURI))
        .to.be.revertedWithCustomError(this.resolver, 'NotTargetContractOwner')
        .withArgs(this.token.address, other.address);
    });

    it('reverts if one of the URIs is an empty string', async function () {
      await expect(this.resolver.setBaseMetadataURIs(this.token.address, '', postRevealBaseMetadataURI))
        .to.be.revertedWithCustomError(this.resolver, 'EmptyBaseMetadataURIs')
        .withArgs(this.token.address, '', postRevealBaseMetadataURI);
      await expect(this.resolver.setBaseMetadataURIs(this.token.address, preRevealBaseMetadataURI, ''))
        .to.be.revertedWithCustomError(this.resolver, 'EmptyBaseMetadataURIs')
        .withArgs(this.token.address, preRevealBaseMetadataURI, '');
    });

    it('reverts if the URIs were already set', async function () {
      await this.resolver.setBaseMetadataURIs(this.token.address, preRevealBaseMetadataURI, postRevealBaseMetadataURI);
      await expect(this.resolver.setBaseMetadataURIs(this.token.address, preRevealBaseMetadataURI, postRevealBaseMetadataURI))
        .to.be.revertedWithCustomError(this.resolver, 'BaseMetadataURIsAlreadySet')
        .withArgs(this.token.address);
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.resolver.setBaseMetadataURIs(this.token.address, preRevealBaseMetadataURI, postRevealBaseMetadataURI);
      });

      it('updates the base metadata URIs', async function () {
        expect(await this.resolver.preRevealBaseMetadataURI(this.token.address)).to.equal(preRevealBaseMetadataURI);
        expect(await this.resolver.postRevealBaseMetadataURI(this.token.address)).to.equal(postRevealBaseMetadataURI);
      });

      it('updates the value returned by tokenMetadata', async function () {
        expect(await this.resolver.tokenMetadataURI(this.token.address, 1)).to.equal(preRevealBaseMetadataURI + '1');
      });

      it('emits a BaseMetadataURIsSet event', async function () {
        await expect(this.receipt)
          .to.emit(this.resolver, 'BaseMetadataURIsSet')
          .withArgs(this.token.address, preRevealBaseMetadataURI, postRevealBaseMetadataURI);
      });
    });
  });

  describe('revealTokens(address)', function () {
    it('reverts if not called by the token contract owner', async function () {
      await this.resolver.setBaseMetadataURIs(this.token.address, preRevealBaseMetadataURI, postRevealBaseMetadataURI);
      await expect(this.resolver.connect(other).revealTokens(this.token.address))
        .to.be.revertedWithCustomError(this.resolver, 'NotTargetContractOwner')
        .withArgs(this.token.address, other.address);
    });

    it('reverts if the URIs have not been set yet', async function () {
      await expect(this.resolver.revealTokens(this.token.address))
        .to.be.revertedWithCustomError(this.resolver, 'BaseMetadataURIsNotSet')
        .withArgs(this.token.address);
    });

    it('reverts if the function has already been called', async function () {
      await this.resolver.setBaseMetadataURIs(this.token.address, preRevealBaseMetadataURI, postRevealBaseMetadataURI);
      await this.resolver.revealTokens(this.token.address);
      await expect(this.resolver.revealTokens(this.token.address))
        .to.be.revertedWithCustomError(this.resolver, 'TokensAlreadyRevealed')
        .withArgs(this.token.address);
    });

    context('when successful', function () {
      beforeEach(async function () {
        await this.resolver.setBaseMetadataURIs(this.token.address, preRevealBaseMetadataURI, postRevealBaseMetadataURI);
        this.receipt = await this.resolver.revealTokens(this.token.address);
      });

      it('updates the reveal status', async function () {
        expect(await this.resolver.isTokenRevealed(this.token.address)).to.be.true;
      });

      it('updates the value returned by tokenMetadata to the post-reveal URI', async function () {
        expect(await this.resolver.tokenMetadataURI(this.token.address, 1)).to.equal(postRevealBaseMetadataURI + '1');
      });

      it('emits a TokensRevealed event', async function () {
        await expect(this.receipt).to.emit(this.resolver, 'TokensRevealed').withArgs(this.token.address);
      });
    });
  });
});
