const {expectRevert} = require('@openzeppelin/test-helpers');

const {runBehaviorTests} = require('../../utils/run');
const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

const {makeInterfaceId, shouldSupportInterfaces} = require('./behaviors/SupportsInterface.behavior');

const [deployer] = require('../../.accounts');

const config = {
  immutable: {name: 'ERC165Mock'},
  diamond: {
    facetDependencies: [
      {
        name: 'ProxyAdminFacet',
        initMethod: 'initProxyAdminStorage',
        initArguments: ['initialAdmin'],
      },
      {name: 'DiamondCutFacet', initMethod: 'initDiamondCutStorage'},
    ],
    mainFacet: {
      name: 'ERC165FacetMock',
      initMethod: 'initInterfaceDetectionStorage',
    },
  },
  defaultArguments: {initialAdmin: deployer},
  abiExtensions: ['LibPayoutWallet'],
};

runBehaviorTests('ERC165', config, function (deployFn) {
  const fixture = async function () {
    const deployment = await deployFn({}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };

  beforeEach(async function () {
    await fixtureLoader(fixture, this);
  });

  shouldSupportInterfaces(['contracts/introspection/interfaces/IERC165.sol:IERC165']);

  describe('setSupportedInterface(bytes4,bool)', function () {
    context('registering a new interface', function () {
      it('reverts with illegal value 0xffffffff', async function () {
        await expectRevert(this.contract.setSupportedInterface('0xffffffff', true), 'InterfaceDetection: wrong value');
      });

      context('when successful', function () {
        beforeEach(async function () {
          await this.contract.setSupportedInterface(makeInterfaceId('IERC173'), true);
        });

        shouldSupportInterfaces(['IERC173']);
      });
    });

    context('unregistering an existing interface', function () {
      it('reverts with illegal value 0xffffffff', async function () {
        await expectRevert(this.contract.setSupportedInterface('0xffffffff', false), 'InterfaceDetection: wrong value');
      });

      context('when successful', function () {
        beforeEach(async function () {
          await this.contract.setSupportedInterface(makeInterfaceId('contracts/introspection/interfaces/IERC165.sol:IERC165'), false);
        });

        it('does not support the interface any more', async function () {
          (await this.contract.supportsInterface(makeInterfaceId('contracts/introspection/interfaces/IERC165.sol:IERC165'))).should.be.false;
        });
      });
    });
  });
});
