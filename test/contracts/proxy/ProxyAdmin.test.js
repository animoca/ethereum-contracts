const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {ZeroAddress} = require('../../../src/constants');

const {runBehaviorTests} = require('../../utils/run');
const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

const [deployer, other] = require('../../.accounts');

const config = {
  immutable: {name: 'ProxyAdminMock', ctorArguments: ['initialAdmin']},
  diamond: {
    facetDependencies: [{name: 'DiamondCutFacet', initMethod: 'initDiamondCutStorage'}],
    mainFacet: {
      name: 'ProxyAdminFacetMock',
      initMethod: 'initProxyAdminStorage',
      initArguments: ['initialAdmin'],
    },
  },
  defaultArguments: {initialAdmin: deployer},
  abiExtensions: ['LibProxyAdmin'],
};

runBehaviorTests('ProxyAdmin', config, function (deployFn) {
  const fixtureWithAdmin = async function () {
    const deployment = await deployFn({initialAdmin: deployer}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };

  const fixtureWithoutAdmin = async function () {
    const deployment = await deployFn({initialAdmin: ZeroAddress}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };

  describe('constructor(address)', function () {
    context('with the zero address as initial admin', function () {
      beforeEach(async function () {
        await fixtureLoader(fixtureWithoutAdmin, this);
      });

      it('does not set the initial admin', async function () {
        (await this.contract.proxyAdmin()).should.be.equal(ZeroAddress);
      });

      it('does not emit an AdminChanged event', async function () {
        await expectEvent.notEmitted.inConstruction(this.contract, 'AdminChanged');
      });
    });

    context('with a non-zero address as initial admin', function () {
      it('sets the initial admin', async function () {
        await fixtureLoader(fixtureWithAdmin, this);
      });

      it('emits an AdminChanged event', async function () {
        await expectEvent.inConstruction(this.contract, 'AdminChanged', {
          previousAdmin: ZeroAddress,
          newAdmin: deployer,
        });
      });
    });
  });

  describe('functions', function () {
    beforeEach(async function () {
      await fixtureLoader(fixtureWithAdmin, this);
    });
    describe('changeProxyAdmin(address)', function () {
      it('reverts if the caller is not the contract admin', async function () {
        await expectRevert(this.contract.changeProxyAdmin(other, {from: other}), 'ProxyAdmin: not the admin');
      });

      context('when successful', function () {
        context('with the zero address as new admin', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.changeProxyAdmin(ZeroAddress, {
              from: deployer,
            });
          });
          it('unsets the admin', async function () {
            (await this.contract.proxyAdmin()).should.be.equal(ZeroAddress);
          });
          it('emits an AdminChanged event', async function () {
            expectEvent(this.receipt, 'AdminChanged', {
              previousAdmin: deployer,
              newAdmin: ZeroAddress,
            });
          });
        });

        context('with a non-zero address as new admin', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.changeProxyAdmin(other, {
              from: deployer,
            });
          });

          it('updates the admin', async function () {
            (await this.contract.proxyAdmin()).should.be.equal(other);
          });

          it('emits an AdminChanged event', async function () {
            expectEvent(this.receipt, 'AdminChanged', {
              previousAdmin: deployer,
              newAdmin: other,
            });
          });
        });

        context('with the current admin address as new admin', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.changeProxyAdmin(deployer, {
              from: deployer,
            });
          });

          it('does not update the admin', async function () {
            (await this.contract.proxyAdmin()).should.be.equal(deployer);
          });

          it('does not emit an AdminChanged event', async function () {
            expectEvent.notEmitted(this.receipt, 'AdminChanged');
          });
        });
      });
    });

    describe('LibProxyAdmin.enforceIsProxyAdmin(address)', function () {
      it('reverts with a non-admin account', async function () {
        await expectRevert(this.contract.enforceIsProxyAdmin(other), 'ProxyAdmin: not the admin');
      });

      it('does not revert with the admin account', async function () {
        await this.contract.enforceIsProxyAdmin(deployer);
      });
    });
  });
});
