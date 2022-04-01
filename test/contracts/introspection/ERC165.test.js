const {getDeployerAddress, runBehaviorTests} = require('../../helpers/run');
const {loadFixture} = require('../../helpers/fixtures');
const {makeInterfaceId, shouldSupportInterfaces} = require('./behaviors/SupportsInterface.behavior');

const config = {
  immutable: {name: 'ERC165Mock'},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacetMock', init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', init: {method: 'initDiamondCutStorage'}},
      {name: 'ERC165FacetMock', init: {method: 'initInterfaceDetectionStorage', adminProtected: true, versionProtected: true}},
    ],
  },
  defaultArguments: {initialAdmin: getDeployerAddress},
};

runBehaviorTests('ERC165', config, function (deployFn) {
  let deployer;

  before(async function () {
    [deployer] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployFn();
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  shouldSupportInterfaces(['contracts/introspection/interfaces/IERC165.sol:IERC165']);

  describe('setSupportedInterface(bytes4,bool)', function () {
    context('registering a new interface', function () {
      it('reverts with illegal value 0xffffffff', async function () {
        await expect(this.contract.setSupportedInterface('0xffffffff', true)).to.be.revertedWith('InterfaceDetection: wrong value');
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
        await expect(this.contract.setSupportedInterface('0xffffffff', false)).to.be.revertedWith('InterfaceDetection: wrong value');
      });

      context('when successful', function () {
        beforeEach(async function () {
          await this.contract.setSupportedInterface(makeInterfaceId('contracts/introspection/interfaces/IERC165.sol:IERC165'), false);
        });

        it('does not support the interface any more', async function () {
          expect(await this.contract.supportsInterface(makeInterfaceId('contracts/introspection/interfaces/IERC165.sol:IERC165'))).to.be.false;
        });
      });
    });
  });
});
