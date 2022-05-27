const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../helpers/run');
const {loadFixture} = require('../../helpers/fixtures');

const config = {
  immutable: {name: 'PauseMock', ctorArguments: ['paused', 'forwarderRegistry'], metaTxSupport: true},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {
        name: 'PauseFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initPauseStorage', arguments: ['paused'], adminProtected: true, versionProtected: true},
        metaTxSupport: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
    paused: true,
  },
};

runBehaviorTests('Pause', config, function (deployFn) {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixturePaused = async function () {
    this.contract = await deployFn({paused: true});
  };
  const fixtureUnpaused = async function () {
    this.contract = await deployFn({paused: false});
  };

  describe('constructor(bool)', function () {
    context('with paused set to false', function () {
      beforeEach(async function () {
        await loadFixture(fixtureUnpaused, this);
      });
      it('starts with an unpaused state', async function () {
        expect(await this.contract.paused()).to.be.false;
      });
    });
    context('with paused set to true', function () {
      beforeEach(async function () {
        await loadFixture(fixturePaused, this);
      });
      it('starts with a paused state', async function () {
        expect(await this.contract.paused()).to.be.true;
      });
      it('emits a Paused event', async function () {
        await expect(this.contract.deployTransaction.hash).to.emit(this.contract, 'Paused');
      });
    });
  });

  describe('pause()', function () {
    beforeEach(async function () {
      await loadFixture(fixtureUnpaused, this);
    });

    it('reverts if not sent by the contract owner', async function () {
      await expect(this.contract.connect(other).pause()).to.be.revertedWith('Ownership: not the owner');
    });

    it('reverts if the contract is already paused', async function () {
      await this.contract.pause();
      await expect(this.contract.pause()).to.be.revertedWith('Pause: paused');
    });
    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.pause();
      });

      it('sets the paused state to true', async function () {
        expect(await this.contract.paused()).to.be.true;
      });

      it('emits a Paused event', async function () {
        expect(this.receipt).to.emit(this.contract, 'Paused');
      });

      it('PauseStorage.enforceIsPaused() does not revert', async function () {
        await this.contract.enforceIsPaused();
      });

      it('PauseStorage.enforceIsNotPaused() reverts', async function () {
        await expect(this.contract.enforceIsNotPaused()).to.be.revertedWith('Pause: paused');
      });
    });
  });

  describe('unpause()', function () {
    beforeEach(async function () {
      await loadFixture(fixturePaused, this);
    });

    it('reverts if not sent by the contract owner', async function () {
      await expect(this.contract.connect(other).unpause()).to.be.revertedWith('Ownership: not the owner');
    });

    it('reverts if the contract is already unpaused', async function () {
      await this.contract.unpause();
      await expect(this.contract.unpause()).to.be.revertedWith('Pause: not paused');
    });
    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.unpause();
      });

      it('sets the paused state to false', async function () {
        expect(await this.contract.paused()).to.be.false;
      });

      it('emits an Unpaused event', async function () {
        expect(this.receipt).to.emit(this.contract, 'Unpaused');
      });

      it('PauseStorage.enforceIsPaused() reverts', async function () {
        await expect(this.contract.enforceIsPaused()).to.be.revertedWith('Pause: not paused');
      });

      it('PauseStorage.enforceIsNotPaused() does not revert', async function () {
        await this.contract.enforceIsNotPaused();
      });
    });
  });
});
