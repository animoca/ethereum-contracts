const {ethers} = require('hardhat');
const {expect} = require('chai');
const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {makeInterfaceId, supportsInterfaces} = require('./behaviors/SupportsInterface.behavior');

const config = {
  immutable: {name: 'InterfaceDetectionMock'},
  diamond: {
    facets: [{name: 'InterfaceDetectionFacetMock'}],
  },
};

runBehaviorTests('InterfaceDetection', config, function (deployFn) {
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

  describe('supportsInterface(bytes4)', function () {
    it('returns false with illegal value 0xffffffff', async function () {
      expect(await this.contract.supportsInterface('0xffffffff')).to.be.false;
    });

    supportsInterfaces(['IERC165']);
  });

  describe('setSupportedInterface(bytes4,bool)', function () {
    context('registering a new interface', function () {
      it('reverts with illegal value 0xffffffff', async function () {
        await expect(this.contract.setSupportedInterface('0xffffffff', true)).to.be.revertedWith('InterfaceDetection: wrong value');
      });

      context('when successful', function () {
        beforeEach(async function () {
          await this.contract.setSupportedInterface(makeInterfaceId('IERC173'), true);
        });

        supportsInterfaces(['IERC173']);
      });
    });

    context('unregistering an existing interface', function () {
      it('reverts with illegal value 0xffffffff', async function () {
        await expect(this.contract.setSupportedInterface('0xffffffff', false)).to.be.revertedWith('InterfaceDetection: wrong value');
      });

      context('when successful', function () {
        beforeEach(async function () {
          await this.contract.setSupportedInterface(makeInterfaceId('IERC173'), true);
          await this.contract.setSupportedInterface(makeInterfaceId('IERC173'), false);
        });

        it('does not support the interface any more', async function () {
          expect(await this.contract.supportsInterface(makeInterfaceId('IERC173'))).to.be.false;
        });
      });
    });
  });
});
