const {ZeroAddress} = require('../../../src/constants');
const {getForwarderRegistryAddress, runBehaviorTests} = require('../../helpers/run');
const {loadFixture} = require('../../helpers/fixtures');

const config = {
  immutable: {name: 'ForwarderRegistryReceiverMock', ctorArguments: ['forwarderRegistry']},
  diamond: {
    facets: [{name: 'ForwarderRegistryContextFacet', ctorArguments: ['forwarderRegistry']}],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
  },
};

runBehaviorTests('ForwarderRegistryContext', config, function (deployFn) {
  let deployer;

  before(async function () {
    [deployer] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.registryAddress = await getForwarderRegistryAddress();
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
    it('returns true for the ForwarderRegistry', async function () {
      expect(await this.contract.isTrustedForwarder(this.registryAddress)).to.be.true;
    });

    it('returns false for the any other address', async function () {
      expect(await this.contract.isTrustedForwarder(this.contract.address)).to.be.false;
      expect(await this.contract.isTrustedForwarder(deployer.address)).to.be.false;
      expect(await this.contract.isTrustedForwarder(ZeroAddress)).to.be.false;
    });
  });
});
