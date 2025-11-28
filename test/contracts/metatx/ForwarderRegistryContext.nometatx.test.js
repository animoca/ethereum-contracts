const {ethers} = require('hardhat');
const {expect} = require('chai');
const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');

const config = {
  immutable: {name: 'ForwarderRegistryReceiverMock', ctorArguments: ['forwarderRegistry']},
  diamond: {
    facets: [{name: 'ForwarderRegistryContextFacet', ctorArguments: ['forwarderRegistry']}],
  },
  defaultArguments: {
    forwarderRegistry: ethers.ZeroAddress,
  },
};

runBehaviorTests('ForwarderRegistryContext (no meta-tx)', config, function (deployFn) {
  let deployer;

  before(async function () {
    [deployer] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.registryAddress = ethers.ZeroAddress;
    this.contract = await deployFn();
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('forwarderRegistry()', function () {
    it('returns the address of the ForwarderRegistry', async function () {
      expect(await this.contract.forwarderRegistry()).to.equal(this.registryAddress);
    });
  });

  describe('isTrustedForwarder(address)', function () {
    it('returns false for the ForwarderRegistry', async function () {
      expect(await this.contract.isTrustedForwarder(this.registryAddress)).to.be.false;
    });

    it('returns false for the any other address', async function () {
      expect(await this.contract.isTrustedForwarder(this.contract.getAddress())).to.be.false;
      expect(await this.contract.isTrustedForwarder(deployer.address)).to.be.false;
      expect(await this.contract.isTrustedForwarder(ethers.ZeroAddress)).to.be.false;
    });
  });
});
