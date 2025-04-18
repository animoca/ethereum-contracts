const {ethers} = require('hardhat');
const {expect} = require('chai');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');

const preRevealTokenMetadataURI = 'preReveal/0';
const postRevealBaseMetadataURI = 'postReveal/';
const tokenSupply = 1000;

describe('TokenMetadataResolverRandomizedReveal', function () {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.linkToken = await deployContract(
      'ERC677Mock',
      '',
      '',
      18,
      [deployer.address, other.address],
      [ethers.parseEther('1000000'), ethers.parseEther('1000000')],
      await getForwarderRegistryAddress(),
    );
    this.vrfV2Wrapper = await deployContract('VRFV2WrapperMock');

    this.resolver = await deployContract('TokenMetadataResolverRandomizedReveal', this.linkToken.getAddress(), this.vrfV2Wrapper.getAddress());
    this.token = await deployContract('ERC721Full', '', '', this.resolver.getAddress(), ethers.ZeroAddress, await getForwarderRegistryAddress());
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('constructor(address,address)', function () {
    it('sets the Chainlink LINK token address', async function () {
      expect(await this.resolver.CHAINLINK_LINK_TOKEN()).to.equal(await this.linkToken.getAddress());
    });

    it('sets the Chainlink VRF Wrapper address', async function () {
      expect(await this.resolver.CHAINLINK_VRF_WRAPPER()).to.equal(await this.vrfV2Wrapper.getAddress());
    });
  });

  describe('setTokenData(address,string,string,uint256)', function () {
    it('reverts if not called by the token contract owner', async function () {
      await expect(
        this.resolver.connect(other).setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply),
      )
        .to.be.revertedWithCustomError(this.resolver, 'NotTargetContractOwner')
        .withArgs(await this.token.getAddress(), other.address);
    });

    it('reverts if the pre-reveal token metadata URI is an empty string', async function () {
      await expect(this.resolver.setTokenData(this.token.getAddress(), '', postRevealBaseMetadataURI, tokenSupply))
        .to.be.revertedWithCustomError(this.resolver, 'EmptyPreRevealTokenMetadataURI')
        .withArgs(await this.token.getAddress());
    });

    it('reverts if the post-reveal base metadata URI is an empty string', async function () {
      await expect(this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, '', tokenSupply))
        .to.be.revertedWithCustomError(this.resolver, 'EmptyPostRevealBaseMetadataURI')
        .withArgs(await this.token.getAddress());
    });

    it('reverts if the token supply is zero', async function () {
      await expect(this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, 0))
        .to.be.revertedWithCustomError(this.resolver, 'ZeroTokenSupply')
        .withArgs(await this.token.getAddress());
    });

    it('reverts if the reveal has already been requested', async function () {
      await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
      await this.linkToken.approve(this.resolver.getAddress(), ethers.MaxUint256);
      await this.resolver.requestReveal(this.token.getAddress(), 0, 0);
      await expect(this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply))
        .to.be.revertedWithCustomError(this.resolver, 'RevealAlreadyRequested')
        .withArgs(await this.token.getAddress());
    });

    it('reverts if the reveal has already been fulfilled', async function () {
      await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
      await this.linkToken.approve(this.resolver.getAddress(), ethers.MaxUint256);
      await this.resolver.requestReveal(this.token.getAddress(), 0, 0);
      await this.vrfV2Wrapper.fulfillRandomnessRequest(await this.vrfV2Wrapper.lastRequestId());
      await expect(this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply))
        .to.be.revertedWithCustomError(this.resolver, 'RevealAlreadyRequested')
        .withArgs(await this.token.getAddress());
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
      });

      it('updates the pre-reveal token metadata URI', async function () {
        expect(await this.resolver.preRevealTokenMetadataURI(this.token.getAddress())).to.equal(preRevealTokenMetadataURI);
      });

      it('updates the post-reveal token metadata URI', async function () {
        expect(await this.resolver.postRevealBaseMetadataURI(this.token.getAddress())).to.equal(postRevealBaseMetadataURI);
      });

      it('updates the token supply', async function () {
        expect(await this.resolver.tokenSupply(this.token.getAddress())).to.equal(tokenSupply);
      });

      it('updates the value returned by tokenMetadata', async function () {
        expect(await this.resolver.tokenMetadataURI(this.token.getAddress(), 1)).to.equal(preRevealTokenMetadataURI);
      });

      it('emits a TokenDataSet event', async function () {
        await expect(this.receipt)
          .to.emit(this.resolver, 'TokenDataSet')
          .withArgs(await this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
      });
    });
  });

  describe('requestReveal(address,uint32,uint16)', function () {
    it('reverts if not called by the token contract owner', async function () {
      await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
      await this.linkToken.connect(other).approve(this.resolver.getAddress(), ethers.MaxUint256);
      await expect(this.resolver.connect(other).requestReveal(this.token.getAddress(), 0, 0))
        .to.be.revertedWithCustomError(this.resolver, 'NotTargetContractOwner')
        .withArgs(await this.token.getAddress(), other.address);
    });

    it('reverts if the token data has not been set yet', async function () {
      await this.linkToken.approve(this.resolver.getAddress(), ethers.MaxUint256);
      await expect(this.resolver.requestReveal(this.token.getAddress(), 0, 0))
        .to.be.revertedWithCustomError(this.resolver, 'TokenDataNotSet')
        .withArgs(await this.token.getAddress());
    });

    it('reverts if the tokens have already been revealed', async function () {
      await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
      await this.linkToken.approve(this.resolver.getAddress(), ethers.MaxUint256);
      await this.resolver.requestReveal(this.token.getAddress(), 0, 0);
      await this.vrfV2Wrapper.fulfillRandomnessRequest(await this.vrfV2Wrapper.lastRequestId());
      await expect(this.resolver.requestReveal(this.token.getAddress(), 0, 0))
        .to.be.revertedWithCustomError(this.resolver, 'TokensAlreadyRevealed')
        .withArgs(await this.token.getAddress());
    });

    context('when successful', function () {
      beforeEach(async function () {
        await this.vrfV2Wrapper.estimateRequestPrice(0, 0); // for coverage
        await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
        await this.linkToken.approve(this.resolver.getAddress(), ethers.MaxUint256);
        this.receipt = await this.resolver.requestReveal(this.token.getAddress(), 0, 0);
      });

      it('updates the reveal status', async function () {
        expect(await this.resolver.revealStatus(this.token.getAddress())).to.equal(1);
      });

      it('updates the request id', async function () {
        expect(await this.resolver.requestIdToTokenContract(await this.vrfV2Wrapper.lastRequestId())).to.equal(await this.token.getAddress());
      });

      it('emits a RevealRequested event', async function () {
        await expect(this.receipt)
          .to.emit(this.resolver, 'RevealRequested')
          .withArgs(await this.token.getAddress(), await this.vrfV2Wrapper.lastRequestId());
      });
    });
  });

  describe('fulfillRandomWords(uint256,uint256[])', function () {
    it('reverts if the request id is unknown', async function () {
      await expect(this.vrfV2Wrapper.fulfillRandomWords(this.resolver.getAddress(), 0, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
        .to.be.revertedWithCustomError(this.resolver, 'UnknownRequestId')
        .withArgs(0);
    });

    it('reverts if the tokens have already been revealed', async function () {
      await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
      await this.linkToken.approve(this.resolver.getAddress(), ethers.MaxUint256);
      await this.resolver.requestReveal(this.token.getAddress(), 0, 0);
      const requestId1 = await this.vrfV2Wrapper.lastRequestId();
      await this.resolver.requestReveal(this.token.getAddress(), 0, 0);
      const requestId2 = await this.vrfV2Wrapper.lastRequestId();
      await this.vrfV2Wrapper.fulfillRandomnessRequest(requestId1);
      await expect(this.vrfV2Wrapper.fulfillRandomnessRequest(requestId2))
        .to.be.revertedWithCustomError(this.resolver, 'TokensAlreadyRevealed')
        .withArgs(await this.token.getAddress());
    });

    context('when successful', function () {
      beforeEach(async function () {
        await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
        await this.linkToken.approve(this.resolver.getAddress(), ethers.MaxUint256);
        await this.resolver.requestReveal(this.token.getAddress(), 0, 0);
        this.receipt = await this.vrfV2Wrapper.fulfillRandomnessRequest(await this.vrfV2Wrapper.lastRequestId());
      });

      it('updates the reveal status', async function () {
        expect(await this.resolver.revealStatus(this.token.getAddress())).to.equal(2);
      });

      it('updates the metadata offset', async function () {
        expect(await this.resolver.metadataOffset(this.token.getAddress())).to.equal(123);
      });

      it('unsets the request id', async function () {
        expect(await this.resolver.requestIdToTokenContract(await this.vrfV2Wrapper.lastRequestId())).to.equal(ethers.ZeroAddress);
      });

      it('emits a TokensRevealed event', async function () {
        await expect(this.receipt)
          .to.emit(this.resolver, 'TokensRevealed')
          .withArgs(await this.token.getAddress(), await this.vrfV2Wrapper.lastRequestId(), 123);
      });
    });
  });

  describe('tokenMetadataURI(address,uint256)', function () {
    it('returns an empty string if the token URI has not been set', async function () {
      expect(await this.resolver.tokenMetadataURI(this.token.getAddress(), 1)).to.equal('');
    });

    it('returns the pre-reveal token metadata URI before the reveal', async function () {
      await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
      expect(await this.resolver.tokenMetadataURI(this.token.getAddress(), 1)).to.equal(preRevealTokenMetadataURI);
    });

    it('returns the pre-reveal token metadata URI when reveal requested but not fulfilled', async function () {
      await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
      await this.linkToken.approve(this.resolver.getAddress(), ethers.MaxUint256);
      await this.resolver.requestReveal(this.token.getAddress(), 0, 0);
      expect(await this.resolver.tokenMetadataURI(this.token.getAddress(), 1)).to.equal(preRevealTokenMetadataURI);
    });

    it('returns the post-reveal concatenated metadata URI when tokens have been revealed', async function () {
      await this.resolver.setTokenData(this.token.getAddress(), preRevealTokenMetadataURI, postRevealBaseMetadataURI, tokenSupply);
      await this.linkToken.approve(this.resolver.getAddress(), ethers.MaxUint256);
      await this.resolver.requestReveal(this.token.getAddress(), 0, 0);
      await this.vrfV2Wrapper.fulfillRandomnessRequest(await this.vrfV2Wrapper.lastRequestId());
      expect(await this.resolver.tokenMetadataURI(this.token.getAddress(), 1)).to.equal(`${postRevealBaseMetadataURI}${1 + 123}`);
    });
  });
});
