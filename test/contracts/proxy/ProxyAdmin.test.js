const {ethers} = require('hardhat');
const {expect} = require('chai');
const {ZeroAddress, ZeroBytes32} = require('../../../src/constants');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../helpers/run');
const {loadFixture} = require('../../helpers/fixtures');

const config = {
  immutable: {name: 'ProxyAdminMock', ctorArguments: ['initialAdmin', 'forwarderRegistry'], testMsgData: true},
  diamond: {
    facets: [
      {
        name: 'ProxyAdminFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin'], phaseProtected: true},
        testMsgData: true,
      },
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
  },
};
runBehaviorTests('ProxyAdmin', config, function (deployFn) {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployFn({initialAdmin: deployer.address});
  };

  describe('constructor(address)', function () {
    it('reverts with a zero-address initial admin', async function () {
      await expect(deployFn({initialAdmin: ZeroAddress})).to.be.revertedWith('ProxyAdmin: no initial admin');
    });

    context('with a non-zero address as initial admin', function () {
      beforeEach(async function () {
        await loadFixture(fixture, this);
      });

      it('sets the initial admin', async function () {
        expect(await this.contract.proxyAdmin()).to.equal(deployer.address);
      });

      it('updates the admin (direct storage access)', async function () {
        expect(
          await ethers.provider.getStorageAt(this.contract.address, '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103')
        ).to.equal('0x000000000000000000000000' + deployer.address.slice(2).toLowerCase());
      });

      it('emits an AdminChanged event', async function () {
        await expect(this.contract.deployTransaction.hash).to.emit(this.contract, 'AdminChanged').withArgs(ZeroAddress, deployer.address);
      });
    });
  });

  describe('functions', function () {
    beforeEach(async function () {
      await loadFixture(fixture, this);
    });
    describe('changeProxyAdmin(address)', function () {
      it('reverts if the caller is not the contract admin', async function () {
        await expect(this.contract.connect(other).changeProxyAdmin(other.address)).to.be.revertedWith('ProxyAdmin: not the admin');
      });

      context('when successful', function () {
        context('with the zero address as new admin', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.changeProxyAdmin(ZeroAddress);
          });
          it('unsets the admin', async function () {
            expect(await this.contract.proxyAdmin()).to.equal(ZeroAddress);
          });
          it('unsets the admin (direct storage access)', async function () {
            expect(
              await ethers.provider.getStorageAt(this.contract.address, '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103')
            ).to.equal(ZeroBytes32);
          });
          it('emits an AdminChanged event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'AdminChanged').withArgs(deployer.address, ZeroAddress);
          });
        });

        context('with a non-zero address as new admin', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.changeProxyAdmin(other.address);
          });

          it('updates the admin', async function () {
            expect(await this.contract.proxyAdmin()).to.equal(other.address);
          });

          it('updates the admin (direct storage access)', async function () {
            expect(
              await ethers.provider.getStorageAt(this.contract.address, '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103')
            ).to.equal('0x000000000000000000000000' + other.address.slice(2).toLowerCase());
          });

          it('emits an AdminChanged event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'AdminChanged').withArgs(deployer.address, other.address);
          });
        });

        context('with the current admin address as new admin', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.changeProxyAdmin(deployer.address);
          });

          it('does not update the admin', async function () {
            expect(await this.contract.proxyAdmin()).to.equal(deployer.address);
          });

          it('does not emit an AdminChanged event', async function () {
            await expect(this.receipt).not.to.emit(this.contract, 'AdminChanged');
          });
        });
      });
    });

    describe('ProxyAdminStorage.enforceIsProxyAdmin(address)', function () {
      it('reverts with a non-admin account', async function () {
        await expect(this.contract.enforceIsProxyAdmin(other.address)).to.be.revertedWith('ProxyAdmin: not the admin');
      });

      it('does not revert with the admin account', async function () {
        await this.contract.enforceIsProxyAdmin(deployer.address);
      });
    });
  });
});
