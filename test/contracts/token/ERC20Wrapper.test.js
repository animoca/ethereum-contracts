const {artifacts} = require('hardhat');
const {expectRevert} = require('@openzeppelin/test-helpers');

const {createFixtureLoader} = require('../../utils/fixture');

const [account] = require('../../.accounts');

const fixtureLoader = createFixtureLoader();

describe('ERC20Wrapper', function () {
  const fixture = async function () {
    this.contract = await artifacts.require('ERC20WrapperMock').new();
  };

  beforeEach(async function () {
    await fixtureLoader(fixture, this);
  });

  context('with a standard ERC20 implementation', function () {
    it('should not revert when calling transfer', async function () {
      await this.contract.standardTransfer(account, '0');
    });

    it('should not revert when calling transferFrom', async function () {
      await this.contract.standardTransferFrom(account, account, '0');
    });

    it('should not revert when calling approve', async function () {
      await this.contract.standardApprove(account, '0');
    });
  });

  context('with a non-standard ERC20 implementation', function () {
    it('should not revert when calling transfer', async function () {
      await this.contract.nonStandardTransfer(account, '0');
    });

    it('should not revert when calling transferFrom', async function () {
      await this.contract.nonStandardTransferFrom(account, account, '0');
    });

    it('should not revert when calling approve', async function () {
      await this.contract.nonStandardApprove(account, '0');
    });
  });

  context('with a failing ERC20 implementation', function () {
    it('should revert when calling transfer', async function () {
      await expectRevert(this.contract.failingTransfer(account, '0'), 'ERC20Wrapper: operation failed');
    });

    it('should revert when calling transferFrom', async function () {
      await expectRevert(this.contract.failingTransferFrom(account, account, '0'), 'ERC20Wrapper: operation failed');
    });

    it('should revert when calling approve', async function () {
      await expectRevert(this.contract.failingApprove(account, '0'), 'ERC20Wrapper: operation failed');
    });
  });

  context('with a reverting ERC20 implementation', function () {
    it('should revert when calling transfer', async function () {
      await expectRevert(this.contract.revertingTransfer(account, '0'), 'ERC20Wrapper: operation failed');
    });

    it('should revert when calling transferFrom', async function () {
      await expectRevert(this.contract.revertingTransferFrom(account, account, '0'), 'ERC20Wrapper: operation failed');
    });

    it('should revert when calling approve', async function () {
      await expectRevert(this.contract.revertingApprove(account, '0'), 'ERC20Wrapper: operation failed');
    });
  });

  context('with a reverting with message ERC20 implementation', function () {
    it('should revert when calling transfer', async function () {
      await expectRevert(this.contract.revertingWithMessageTransfer(account, '0'), 'reverted');
    });

    it('should revert when calling transferFrom', async function () {
      await expectRevert(this.contract.revertingWithMessageTransferFrom(account, account, '0'), 'reverted');
    });

    it('should revert when calling approve', async function () {
      await expectRevert(this.contract.revertingWithMessageApprove(account, '0'), 'reverted');
    });
  });

  context('with a non-contract ERC20', function () {
    it('should revert when calling transfer', async function () {
      await expectRevert(this.contract.nonContractTransfer(account, '0'), 'ERC20Wrapper: non-contract');
    });

    it('should revert when calling transferFrom', async function () {
      await expectRevert(this.contract.nonContractTransferFrom(account, account, '0'), 'ERC20Wrapper: non-contract');
    });

    it('should revert when calling approve', async function () {
      await expectRevert(this.contract.nonContractApprove(account, '0'), 'ERC20Wrapper: non-contract');
    });
  });
});
