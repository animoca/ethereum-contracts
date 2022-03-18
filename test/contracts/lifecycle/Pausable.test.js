const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers');

const {runBehaviorTests} = require('../../utils/run');
const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

const [deployer, other] = require('../../.accounts');

const config = {
  immutable: {name: 'PausableMock', ctorArguments: ['paused']},
  diamond: {
    facetDependencies: [
      {
        name: 'ProxyAdminFacet',
        initMethod: 'initProxyAdminStorage',
        initArguments: ['initialAdmin'],
      },
      {name: 'DiamondCutFacet', initMethod: 'initDiamondCutStorage'},
      {
        name: 'OwnableFacet',
        initMethod: 'initOwnershipStorage',
        initArguments: ['initialOwner'],
      },
    ],
    mainFacet: {
      name: 'PausableFacetMock',
      initMethod: 'initPauseStorage',
      initArguments: ['paused'],
    },
  },
  defaultArguments: {
    initialAdmin: deployer,
    initialOwner: deployer,
    paused: true,
  },
  abiExtensions: ['LibPause'],
};

runBehaviorTests('Pausable', config, function (deployFn) {
  const fixturePaused = async function () {
    const deployment = await deployFn({paused: true}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };
  const fixtureUnpaused = async function () {
    const deployment = await deployFn({paused: false}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };

  describe('constructor(bool)', function () {
    context('with paused set to false', function () {
      beforeEach(async function () {
        await fixtureLoader(fixtureUnpaused, this);
      });
      it('starts with an unpaused state', async function () {
        (await this.contract.paused()).should.be.false;
      });
    });
    context('with paused set to true', function () {
      beforeEach(async function () {
        await fixtureLoader(fixturePaused, this);
      });
      it('starts with a paused state', async function () {
        (await this.contract.paused()).should.be.true;
      });
      it('emits a Paused event', async function () {
        await expectEvent.inTransaction(this.tx, this.contract, 'Paused', {});
      });
    });
  });

  describe('pause()', function () {
    beforeEach(async function () {
      await fixtureLoader(fixtureUnpaused, this);
    });

    it('reverts if not sent by the contract owner', async function () {
      await expectRevert(this.contract.pause({from: other}), 'Ownership: not the owner');
    });

    it('reverts if the contract is already paused', async function () {
      await this.contract.pause({from: deployer});
      await expectRevert(this.contract.pause({from: deployer}), 'Pause: paused');
    });
    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.pause({from: deployer});
      });

      it('sets the paused state to true', async function () {
        (await this.contract.paused()).should.be.true;
      });

      it('emits a Paused event', async function () {
        expectEvent(this.receipt, 'Paused', {});
      });

      it('LibPause.enforceIsPaused() does not revert', async function () {
        await this.contract.enforceIsPaused();
      });

      it('LibPause.enforceIsNotPaused() reverts', async function () {
        await expectRevert(this.contract.enforceIsNotPaused(), 'Pause: paused');
      });
    });
  });

  describe('unpause()', function () {
    beforeEach(async function () {
      await fixtureLoader(fixturePaused, this);
    });

    it('reverts if not sent by the contract owner', async function () {
      await expectRevert(this.contract.unpause({from: other}), 'Ownership: not the owner');
    });

    it('reverts if the contract is already unpaused', async function () {
      await this.contract.unpause({from: deployer});
      await expectRevert(this.contract.unpause({from: deployer}), 'Pause: not paused');
    });
    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.unpause({from: deployer});
      });

      it('sets the paused state to false', async function () {
        (await this.contract.paused()).should.be.false;
      });

      it('emits an Unpaused event', async function () {
        expectEvent(this.receipt, 'Unpaused', {});
      });

      it('LibPause.enforceIsPaused() reverts', async function () {
        await expectRevert(this.contract.enforceIsPaused(), 'Pause: not paused');
      });

      it('LibPause.enforceIsNotPaused() does not revert', async function () {
        await this.contract.enforceIsNotPaused();
      });
    });
  });
});
