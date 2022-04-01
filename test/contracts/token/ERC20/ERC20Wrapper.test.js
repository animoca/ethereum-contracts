const {loadFixture} = require('../../../helpers/fixtures');

describe('ERC20Wrapper', function () {
  let deployer;

  before(async function () {
    [deployer] = await ethers.getSigners();
  });

  const fixture = async function () {
    const ERC20Wrapper = await ethers.getContractFactory('ERC20WrapperMock');
    this.contract = await ERC20Wrapper.deploy();
    await this.contract.deployed();
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  context('with a standard ERC20 implementation', function () {
    it('should not revert when calling transfer', async function () {
      await this.contract.standardTransfer(deployer.address, '0');
    });

    it('should not revert when calling transferFrom', async function () {
      await this.contract.standardTransferFrom(deployer.address, deployer.address, '0');
    });

    it('should not revert when calling approve', async function () {
      await this.contract.standardApprove(deployer.address, '0');
    });
  });

  context('with a non-standard ERC20 implementation', function () {
    it('should not revert when calling transfer', async function () {
      await this.contract.nonStandardTransfer(deployer.address, '0');
    });

    it('should not revert when calling transferFrom', async function () {
      await this.contract.nonStandardTransferFrom(deployer.address, deployer.address, '0');
    });

    it('should not revert when calling approve', async function () {
      await this.contract.nonStandardApprove(deployer.address, '0');
    });
  });

  context('with a failing ERC20 implementation', function () {
    it('should revert when calling transfer', async function () {
      await expect(this.contract.failingTransfer(deployer.address, '0')).to.be.revertedWith('ERC20Wrapper: operation failed');
    });

    it('should revert when calling transferFrom', async function () {
      await expect(this.contract.failingTransferFrom(deployer.address, deployer.address, '0')).to.be.revertedWith('ERC20Wrapper: operation failed');
    });

    it('should revert when calling approve', async function () {
      await expect(this.contract.failingApprove(deployer.address, '0')).to.be.revertedWith('ERC20Wrapper: operation failed');
    });
  });

  context('with a reverting ERC20 implementation', function () {
    it('should revert when calling transfer', async function () {
      await expect(this.contract.revertingTransfer(deployer.address, '0')).to.be.revertedWith('ERC20Wrapper: low-level call failed');
    });

    it('should revert when calling transferFrom', async function () {
      await expect(this.contract.revertingTransferFrom(deployer.address, deployer.address, '0')).to.be.revertedWith(
        'ERC20Wrapper: low-level call failed'
      );
    });

    it('should revert when calling approve', async function () {
      await expect(this.contract.revertingApprove(deployer.address, '0')).to.be.revertedWith('ERC20Wrapper: low-level call failed');
    });
  });

  context('with a reverting with message ERC20 implementation', function () {
    it('should revert when calling transfer', async function () {
      await expect(this.contract.revertingWithMessageTransfer(deployer.address, '0')).to.be.revertedWith('reverted');
    });

    it('should revert when calling transferFrom', async function () {
      await expect(this.contract.revertingWithMessageTransferFrom(deployer.address, deployer.address, '0')).to.be.revertedWith('reverted');
    });

    it('should revert when calling approve', async function () {
      await expect(this.contract.revertingWithMessageApprove(deployer.address, '0')).to.be.revertedWith('reverted');
    });
  });

  context('with a non-contract ERC20', function () {
    it('should revert when calling transfer', async function () {
      await expect(this.contract.nonContractTransfer(deployer.address, '0')).to.be.revertedWith('Address: call to non-contract');
    });

    it('should revert when calling transferFrom', async function () {
      await expect(this.contract.nonContractTransferFrom(deployer.address, deployer.address, '0')).to.be.revertedWith(
        'Address: call to non-contract'
      );
    });

    it('should revert when calling approve', async function () {
      await expect(this.contract.nonContractApprove(deployer.address, '0')).to.be.revertedWith('Address: call to non-contract');
    });
  });
});
