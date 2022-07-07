const {ethers} = require('hardhat');
const {expect} = require('chai');
const {ZeroAddress} = require('../../../src/constants');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../helpers/run');
const {loadFixture} = require('../../helpers/fixtures');
const {supportsInterfaces} = require('../introspection/behaviors/SupportsInterface.behavior');

const config = {
  immutable: {name: 'ContractOwnershipMock', ctorArguments: ['initialOwner', 'forwarderRegistry'], testMsgData: true},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {name: 'InterfaceDetectionFacet'},
      {
        name: 'ContractOwnershipFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner'], adminProtected: true, phaseProtected: true},
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

runBehaviorTests('ContractOwnership', config, function (deployFn) {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixtureWithOwner = async function () {
    this.contract = await deployFn({initialOwner: deployer.address});
  };

  const fixtureWithoutOwner = async function () {
    this.contract = await deployFn({initialOwner: ZeroAddress});
  };

  describe('constructor(address)', function () {
    context('with the zero address as initial owner', function () {
      beforeEach(async function () {
        await loadFixture(fixtureWithoutOwner, this);
      });

      it('does not set the initial owner', async function () {
        expect(await this.contract.owner()).to.equal(ZeroAddress);
      });

      it('does not emit an OwnershipTransferred event', async function () {
        await expect(this.contract.deployTransaction.hash).not.to.emit(this.contract, 'OwnershipTransferred');
      });
    });

    context('with a non-zero address as initial owner', function () {
      beforeEach(async function () {
        await loadFixture(fixtureWithOwner, this);
      });

      it('sets the initial owner', async function () {
        expect(await this.contract.owner()).to.equal(deployer.address);
      });

      it('emits an OwnershipTransferred event', async function () {
        await expect(this.contract.deployTransaction.hash).to.emit(this.contract, 'OwnershipTransferred').withArgs(ZeroAddress, deployer.address);
      });
    });
  });

  describe('functions', function () {
    beforeEach(async function () {
      await loadFixture(fixtureWithOwner, this);
    });

    describe('transferOwnership(address)', function () {
      it('reverts if the caller is not the contract owner', async function () {
        await expect(this.contract.connect(other).transferOwnership(other.address)).to.be.revertedWith('Ownership: not the owner');
      });

      context('when successful', function () {
        context('with the zero address as new owner', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.transferOwnership(ZeroAddress);
          });
          it('unsets the owner', async function () {
            expect(await this.contract.owner()).to.equal(ZeroAddress);
          });
          it('emits an OwnershipTransferred event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'OwnershipTransferred').withArgs(deployer.address, ZeroAddress);
          });
        });

        context('with a non-zero address as new owner', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.transferOwnership(other.address);
          });

          it('updates the owner', async function () {
            expect(await this.contract.owner()).to.equal(other.address);
          });

          it('emits an OwnershipTransferred event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'OwnershipTransferred').withArgs(deployer.address, other.address);
          });
        });

        context('with the current owner address as new owner', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.transferOwnership(deployer.address);
          });

          it('does not update the owner', async function () {
            expect(await this.contract.owner()).to.equal(deployer.address);
          });

          it('does not emit an OwnershipTransferred event', async function () {
            await expect(this.receipt).not.to.emit(this.contract, 'OwnershipTransferred');
          });
        });
      });
    });

    describe('ContractOwnershipStorage.enforceIsContractOwner(address)', function () {
      it('reverts with a non-owner account', async function () {
        await expect(this.contract.enforceIsContractOwner(other.address)).to.be.revertedWith('Ownership: not the owner');
      });

      it('does not revert with the owner account', async function () {
        await this.contract.enforceIsContractOwner(deployer.address);
      });
    });

    supportsInterfaces(['IERC165', 'IERC173']);
  });
});
