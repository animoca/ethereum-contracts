const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {ZeroAddress} = require('../../../src/constants');

const {runBehaviorTests} = require('../../utils/run');
const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

const {shouldSupportInterfaces} = require('../introspection/behaviors/SupportsInterface.behavior');

const [deployer, other] = require('../../.accounts');

const config = {
  immutable: {name: 'OwnableMock', ctorArguments: ['initialOwner']},
  diamond: {
    facetDependencies: [
      {
        name: 'ProxyAdminFacet',
        initMethod: 'initProxyAdminStorage',
        initArguments: ['initialAdmin'],
      },
      {name: 'DiamondCutFacet', initMethod: 'initDiamondCutStorage'},
      {name: 'ERC165Facet', initMethod: 'initInterfaceDetectionStorage'},
    ],
    mainFacet: {
      name: 'OwnableFacetMock',
      initMethod: 'initOwnershipStorage',
      initArguments: ['initialOwner'],
    },
  },
  defaultArguments: {initialAdmin: deployer, initialOwner: deployer},
  abiExtensions: ['LibAccessControl'],
};

runBehaviorTests('Ownable', config, function (deployFn) {
  const fixtureWithOwner = async function () {
    const deployment = await deployFn({initialOwner: deployer});
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };

  const fixtureWithoutOwner = async function () {
    const deployment = await deployFn({initialOwner: ZeroAddress});
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };

  describe('constructor(address)', function () {
    context('with the zero address as initial owner', function () {
      beforeEach(async function () {
        await fixtureLoader(fixtureWithoutOwner, this);
      });

      it('does not set the initial owner', async function () {
        (await this.contract.owner()).should.be.equal(ZeroAddress);
      });

      it('does not emit an OwnershipTransferred event', async function () {
        await expectEvent.notEmitted.inTransaction(this.tx, this.contract, 'OwnershipTransferred');
      });
    });

    context('with a non-zero address as initial owner', function () {
      beforeEach(async function () {
        await fixtureLoader(fixtureWithOwner, this);
      });

      it('sets the initial owner', async function () {
        (await this.contract.owner()).should.be.equal(deployer);
      });

      it('emits an OwnershipTransferred event', async function () {
        await expectEvent.inTransaction(this.tx, this.contract, 'OwnershipTransferred', {
          previousOwner: ZeroAddress,
          newOwner: deployer,
        });
      });
    });
  });

  describe('functions', function () {
    beforeEach(async function () {
      await fixtureLoader(fixtureWithOwner, this);
    });

    describe('transferOwnership(address)', function () {
      it('reverts if the caller is not the contract owner', async function () {
        await expectRevert(this.contract.transferOwnership(other, {from: other}), 'Ownership: not the owner');
      });

      context('when successful', function () {
        context('with the zero address as new owner', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.transferOwnership(ZeroAddress, {
              from: deployer,
            });
          });
          it('unsets the owner', async function () {
            (await this.contract.owner()).should.be.equal(ZeroAddress);
          });
          it('emits an OwnershipTransferred event', async function () {
            expectEvent(this.receipt, 'OwnershipTransferred', {
              previousOwner: deployer,
              newOwner: ZeroAddress,
            });
          });
        });

        context('with a non-zero address as new owner', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.transferOwnership(other, {
              from: deployer,
            });
          });

          it('updates the owner', async function () {
            (await this.contract.owner()).should.be.equal(other);
          });

          it('emits an OwnershipTransferred event', async function () {
            expectEvent(this.receipt, 'OwnershipTransferred', {
              previousOwner: deployer,
              newOwner: other,
            });
          });
        });

        context('with the current owner address as new owner', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.transferOwnership(deployer, {
              from: deployer,
            });
          });

          it('does not update the owner', async function () {
            (await this.contract.owner()).should.be.equal(deployer);
          });

          it('does not emit an OwnershipTransferred event', async function () {
            expectEvent.notEmitted(this.receipt, 'OwnershipTransferred');
          });
        });
      });
    });

    describe('LibOwnership.enforceIsContractOwner(address)', function () {
      it('reverts with a non-owner account', async function () {
        await expectRevert(this.contract.enforceIsContractOwner(other), 'Ownership: not the owner');
      });

      it('does not revert with the owner account', async function () {
        await this.contract.enforceIsContractOwner(deployer);
      });
    });

    shouldSupportInterfaces(['contracts/introspection/interfaces/IERC165.sol:IERC165', 'IERC173']);
  });
});
