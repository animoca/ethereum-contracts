const {ethers} = require('hardhat');
const {expect} = require('chai');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');
const {loadFixture} = require('../../../helpers/fixtures');
const {ZeroAddress} = require('../../../../src/constants');
const {supportsInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

const config = {
  immutable: {name: 'ERC2981Mock', ctorArguments: ['forwarderRegistry'], testMsgData: true},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {name: 'InterfaceDetectionFacet'},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {
        name: 'ERC2981FacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'init', adminProtected: true},
        testMsgData: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
  },
};

runBehaviorTests('ERC2981', config, function (deployFn) {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployFn();
  };
  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('setRoyaltyReceiver(address)', function () {
    it('reverts when not sent by the contract owner', async function () {
      await expect(this.contract.connect(other).setRoyaltyReceiver(ZeroAddress)).to.be.revertedWith('Ownership: not the owner');
    });

    it('reverts when trying to set the zero address', async function () {
      await expect(this.contract.setRoyaltyReceiver(ZeroAddress)).to.be.revertedWithCustomError(this.contract, 'IncorrectRoyaltyReceiver');
    });

    it('sets the royalty receiver to the new value', async function () {
      await this.contract.setRoyaltyReceiver(deployer.address);
      const royaltyInfo = await this.contract.royaltyInfo(0, 0);
      expect(royaltyInfo.receiver).to.equal(deployer.address);
    });
  });

  describe('setRoyaltyPercentage(uint256)', function () {
    it('reverts when not sent by the contract owner', async function () {
      await expect(this.contract.connect(other).setRoyaltyPercentage(ZeroAddress)).to.be.revertedWith('Ownership: not the owner');
    });

    it('reverts when trying to set the a percentage above 100%', async function () {
      const percentageArg = (await this.contract.ROYALTY_FEE_DENOMINATOR()).add(1);
      await expect(this.contract.setRoyaltyPercentage(percentageArg)).to.be.revertedWithCustomError(
        this.contract,
        'IncorrectRoyaltyPercentage',
        percentageArg
      );
    });

    it('sets the royalty percentage to the new value', async function () {
      const percentage = 50;
      const percentageArg = (await this.contract.ROYALTY_FEE_DENOMINATOR()).mul(percentage).div(100);
      await this.contract.setRoyaltyPercentage(percentageArg);
      const saleAmount = 100;
      const royaltyInfo = await this.contract.royaltyInfo(0, saleAmount);
      const royaltyAmount = (saleAmount * percentage) / 100;
      expect(royaltyInfo.royaltyAmount).to.equal(royaltyAmount);
    });
  });

  describe('royaltyInfo(uint256,uint256)', function () {
    it('returns 0 before setting info', async function () {
      const royaltyInfo = await this.contract.royaltyInfo(0, 1000000);
      expect(royaltyInfo.receiver).to.equal(ZeroAddress);
      expect(royaltyInfo.royaltyAmount).to.equal(0);
    });

    it('returns a correct small value', async function () {
      await this.contract.setRoyaltyReceiver(deployer.address);
      await this.contract.setRoyaltyPercentage((await this.contract.ROYALTY_FEE_DENOMINATOR()).div(100).mul(50));
      const royaltyInfo = await this.contract.royaltyInfo(0, 100);
      expect(royaltyInfo.receiver).to.equal(deployer.address);
      expect(royaltyInfo.royaltyAmount).to.equal(50);
    });

    it('returns a correct big value', async function () {
      const percentage = 10;
      const percentageArg = (await this.contract.ROYALTY_FEE_DENOMINATOR()).mul(percentage).div(100);
      await this.contract.setRoyaltyPercentage(percentageArg);
      const tokenValue = 10000000;
      const royaltyInfo = await this.contract.royaltyInfo(0, tokenValue);
      const royaltyAmount = (tokenValue * percentage) / 100;
      expect(royaltyInfo.royaltyAmount).to.equal(royaltyAmount);
    });
  });

  supportsInterfaces(['IERC2981']);
});
