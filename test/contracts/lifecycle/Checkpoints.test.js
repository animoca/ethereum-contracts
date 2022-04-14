const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../helpers/run');
const {loadFixture} = require('../../helpers/fixtures');
const {latest} = require('../../helpers/time');

const config = {
  immutable: {
    name: 'CheckpointsMock',
    ctorArguments: ['checkpointIds', 'timestamps', 'forwarderRegistry'],
    metaTxSupport: true,
  },
  diamond: {
    facets: [
      {name: 'ProxyAdminFacetMock', init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', init: {method: 'initDiamondCutStorage'}},
      {name: 'OwnableFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initOwnershipStorage', arguments: ['initialOwner']}},
      {
        name: 'CheckpointsFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initCheckpointsStorage', arguments: ['checkpointIds', 'timestamps'], adminProtected: true, versionProtected: true},
        metaTxSupport: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
    checkpointIds: [],
    timestamps: [],
  },
};

runBehaviorTests('Checkpoints', config, function (deployFn) {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
    const tempContract = await deployFn();
    this.checkpointId = await tempContract.START_CHECKPOINTID();
  });

  const fixtureTimeUnset = async function () {
    this.startTime = '0';
    this.contract = await deployFn({checkpointIds: [this.checkpointId], timestamps: [this.startTime]});
  };
  const fixtureTimeSetInPast = async function () {
    this.startTime = await latest();
    this.contract = await deployFn({checkpointIds: [this.checkpointId], timestamps: [this.startTime]});
  };
  const fixtureTimeSetInFuture = async function () {
    this.startTime = (await latest()).add('1000');
    this.contract = await deployFn({checkpointIds: [this.checkpointId], timestamps: [this.startTime]});
  };

  describe('constructor(bytes32[],uint256[])', function () {
    it('reverts with inconsistent array lengths', async function () {
      await expect(deployFn({checkpointIds: [], timestamps: ['0']})).to.be.revertedWith('Checkpoints: wrong array length');
    });
    context('with a zero start time', function () {
      beforeEach(async function () {
        await loadFixture(fixtureTimeUnset, this);
      });
      it('leaves the checkpoint unset', async function () {
        expect(await this.contract.checkpoint(this.checkpointId)).to.equal(this.startTime);
      });
      it('does not emit a {CheckpointSet} event', async function () {
        await expect(this.contract.deployTransaction.hash).not.to.emit(this.contract, 'CheckpointSet');
      });
    });
    context('with a non-zero start time', function () {
      beforeEach(async function () {
        await loadFixture(fixtureTimeSetInPast, this);
      });
      it('sets the checkpoint', async function () {
        expect(await this.contract.checkpoint(this.checkpointId)).to.equal(this.startTime);
      });
      it('emits a {CheckpointSet} event', async function () {
        await expect(this.contract.deployTransaction.hash).to.emit(this.contract, 'CheckpointSet').withArgs(this.checkpointId, this.startTime);
      });
    });
  });

  describe('checkpoint reaching conditions', function () {
    context('checkpoint is unset (zero)', function () {
      beforeEach(async function () {
        await loadFixture(fixtureTimeUnset, this);
      });

      it('checkpointReached(bytes32) returns false', async function () {
        expect(await this.contract.checkpointReached(this.checkpointId)).to.be.false;
      });

      it('CheckpointsStorage.enforceCheckpointReached(bytes32) reverts', async function () {
        await expect(this.contract.enforceCheckpointReached(this.checkpointId)).to.be.revertedWith(
          `Checkpoints: checkpoint '${ethers.utils.parseBytes32String(this.checkpointId)}' not reached yet`
        );
      });

      it('CheckpointsStorage.enforceCheckpointNotReached(bytes32) does not revert', async function () {
        await this.contract.enforceCheckpointNotReached(this.checkpointId);
      });
    });

    context('checkpoint is set (non-zero) and time is not reached yet', function () {
      beforeEach(async function () {
        await loadFixture(fixtureTimeSetInFuture, this);
      });

      it('checkpointReached(bytes32) returns false', async function () {
        expect(await this.contract.checkpointReached(this.checkpointId)).to.be.false;
      });

      it('CheckpointsStorage.enforceCheckpointReached(bytes32) reverts', async function () {
        await expect(this.contract.enforceCheckpointReached(this.checkpointId)).to.be.revertedWith(
          `Checkpoints: checkpoint '${ethers.utils.parseBytes32String(this.checkpointId)}' not reached yet`
        );
      });

      it('CheckpointsStorage.enforceCheckpointNotReached(bytes32) does not revert', async function () {
        await this.contract.enforceCheckpointNotReached(this.checkpointId);
      });
    });

    context('checkpoint is set (non-zero) and time is reached', function () {
      beforeEach(async function () {
        await loadFixture(fixtureTimeSetInPast, this);
      });

      it('checkpointReached(bytes32) returns true', async function () {
        expect(await this.contract.checkpointReached(this.checkpointId)).to.be.true;
      });

      it('CheckpointsStorage.enforceCheckpointReached(bytes32) does not revert', async function () {
        await this.contract.enforceCheckpointReached(this.checkpointId);
      });

      it('CheckpointsStorage.enforceCheckpointNotReached(bytes32) reverts', async function () {
        await expect(this.contract.enforceCheckpointNotReached(this.checkpointId)).to.be.revertedWith(
          `Checkpoints: checkpoint '${ethers.utils.parseBytes32String(this.checkpointId)}' already reached`
        );
      });
    });
  });

  context('setCheckpoint(bytes32,uint256)', function () {
    beforeEach(async function () {
      await loadFixture(fixtureTimeUnset, this);
      this.startTime = '1';
    });

    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(other).setCheckpoint(this.checkpointId, this.startTime)).to.be.revertedWith('Ownership: not the owner');
    });

    it('reverts if the checkpoint is already set', async function () {
      await this.contract.setCheckpoint(this.checkpointId, this.startTime);
      await expect(this.contract.setCheckpoint(this.checkpointId, this.startTime)).to.be.revertedWith(
        `Checkpoints: checkpoint '${ethers.utils.parseBytes32String(this.checkpointId)}' already set`
      );
    });

    context('when successful (zero timestamp value)', function () {
      beforeEach(async function () {
        this.startTime = '0';
        this.receipt = await this.contract.setCheckpoint(this.checkpointId, this.startTime);
      });

      it('leaves the checkpoint unset', async function () {
        expect(await this.contract.checkpoint(this.checkpointId)).to.equal(this.startTime);
      });

      it('does not emit a {CheckpointSet} event', async function () {
        await expect(this.receipt).not.to.emit(this.contract, 'CheckpointSet');
      });
    });

    context('when successful (non-zero timestamp value)', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.setCheckpoint(this.checkpointId, this.startTime);
      });

      it('sets the checkpoint', async function () {
        expect(await this.contract.checkpoint(this.checkpointId)).to.equal(this.startTime);
      });

      it('emits a {CheckpointSet} event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'CheckpointSet').withArgs(this.checkpointId, this.startTime);
      });
    });
  });

  context('triggerCheckpoint(bytes32)', function () {
    beforeEach(async function () {
      await loadFixture(fixtureTimeUnset, this);
    });

    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(other).triggerCheckpoint(this.checkpointId)).to.be.revertedWith('Ownership: not the owner');
    });

    it('reverts if the checkpoint is already reached', async function () {
      await this.contract.triggerCheckpoint(this.checkpointId);
      await expect(this.contract.triggerCheckpoint(this.checkpointId)).to.be.revertedWith(
        `Checkpoints: checkpoint '${ethers.utils.parseBytes32String(this.checkpointId)}' already reached`
      );
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.triggerCheckpoint(this.checkpointId);
        const block = await ethers.provider.getBlock(this.receipt.blockNumber);
        this.startTime = ethers.BigNumber.from(block.timestamp);
      });

      it('sets the checkpoint to the current timestamp', async function () {
        expect(await this.contract.checkpoint(this.checkpointId)).to.equal(this.startTime);
      });

      it('emits a {CheckpointSet} event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'CheckpointSet').withArgs(this.checkpointId, this.startTime);
      });
    });
  });
});
