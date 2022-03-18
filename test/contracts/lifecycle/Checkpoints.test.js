const {utils, BigNumber} = require('ethers');
const {parseBytes32String} = utils;
const {expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers');

const {runBehaviorTests} = require('../../utils/run');
const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

const [deployer, other] = require('../../.accounts');

const config = {
  immutable: {
    name: 'CheckpointsMock',
    ctorArguments: ['checkpointIds', 'timestamps'],
  },
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
      name: 'CheckpointsFacetMock',
      initMethod: 'initCheckpointsStorage',
      initArguments: ['checkpointIds', 'timestamps'],
    },
  },
  defaultArguments: {
    initialAdmin: deployer,
    initialOwner: deployer,
    checkpointIds: [],
    timestamps: [],
  },
  abiExtensions: ['LibCheckpoints'],
};

runBehaviorTests('Checkpoints', config, function (deployFn) {
  const fixtureTimeUnset = async function () {
    const tempContract = await deployFn({}, deployer);
    this.checkpointId = await tempContract.contract.START_CHECKPOINTID();
    this.startTime = '0';
    const deployment = await deployFn({checkpointIds: [this.checkpointId], timestamps: [this.startTime]}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };
  const fixtureTimeSetInPast = async function () {
    const tempContract = await deployFn({}, deployer);
    this.checkpointId = await tempContract.contract.START_CHECKPOINTID();
    this.startTime = BigNumber.from((await time.latest()).toString());
    const deployment = await deployFn({checkpointIds: [this.checkpointId], timestamps: [this.startTime]}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };
  const fixtureTimeSetInFuture = async function () {
    const tempContract = await deployFn({}, deployer);
    this.checkpointId = await tempContract.contract.START_CHECKPOINTID();
    this.startTime = BigNumber.from((await time.latest()).toString()).add('1000');
    const deployment = await deployFn({checkpointIds: [this.checkpointId], timestamps: [this.startTime]}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };

  describe('constructor(bytes32[],uint256[])', function () {
    it('reverts with inconsistent array lengths', async function () {
      await expectRevert(deployFn({checkpointIds: [], timestamps: ['0']}, deployer), 'Checkpoints: wrong array length');
    });
    context('with a zero start time', function () {
      beforeEach(async function () {
        await fixtureLoader(fixtureTimeUnset, this);
      });
      it('leaves the checkpoint unset', async function () {
        (await this.contract.checkpoint(this.checkpointId)).should.be.bignumber.equal(this.startTime);
      });
      it('does not emit a {CheckpointSet} event', async function () {
        await expectEvent.notEmitted.inTransaction(this.tx, this.contract, 'CheckpointSet');
      });
    });
    context('with a non-zero start time', function () {
      beforeEach(async function () {
        await fixtureLoader(fixtureTimeSetInPast, this);
      });
      it('sets the checkpoint', async function () {
        (await this.contract.checkpoint(this.checkpointId)).should.be.bignumber.equal(this.startTime.toString());
      });
      it('emits a {CheckpointSet} event', async function () {
        await expectEvent.inTransaction(this.tx, this.contract, 'CheckpointSet', {
          checkpointId: this.checkpointId,
          timestamp: this.startTime.toString(),
        });
      });
    });
  });

  describe('checkpoint reaching conditions', function () {
    context('checkpoint is unset (zero)', function () {
      beforeEach(async function () {
        await fixtureLoader(fixtureTimeUnset, this);
      });

      it('checkpointReached(bytes32) returns false', async function () {
        (await this.contract.checkpointReached(this.checkpointId)).should.be.false;
      });

      it('LibCheckpoints.enforceCheckpointReached(bytes32) reverts', async function () {
        await expectRevert(
          this.contract.enforceCheckpointReached(this.checkpointId),
          `Checkpoints: checkpoint '${parseBytes32String(this.checkpointId)}' not reached yet`
        );
      });

      it('LibCheckpoints.enforceCheckpointNotReached(bytes32) does not revert', async function () {
        await this.contract.enforceCheckpointNotReached(this.checkpointId);
      });
    });

    context('checkpoint is set (non-zero) and time is not reached yet', function () {
      beforeEach(async function () {
        await fixtureLoader(fixtureTimeSetInFuture, this);
      });

      it('checkpointReached(bytes32) returns false', async function () {
        (await this.contract.checkpointReached(this.checkpointId)).should.be.false;
      });

      it('LibCheckpoints.enforceCheckpointReached(bytes32) reverts', async function () {
        await expectRevert(
          this.contract.enforceCheckpointReached(this.checkpointId),
          `Checkpoints: checkpoint '${parseBytes32String(this.checkpointId)}' not reached yet`
        );
      });

      it('LibCheckpoints.enforceCheckpointNotReached(bytes32) does not revert', async function () {
        await this.contract.enforceCheckpointNotReached(this.checkpointId);
      });
    });

    context('checkpoint is set (non-zero) and time is reached', function () {
      beforeEach(async function () {
        await fixtureLoader(fixtureTimeSetInPast, this);
      });

      it('checkpointReached(bytes32) returns true', async function () {
        (await this.contract.checkpointReached(this.checkpointId)).should.be.true;
      });

      it('LibCheckpoints.enforceCheckpointReached(bytes32) does not revert', async function () {
        await this.contract.enforceCheckpointReached(this.checkpointId);
      });

      it('LibCheckpoints.enforceCheckpointNotReached(bytes32) reverts', async function () {
        await expectRevert(
          this.contract.enforceCheckpointNotReached(this.checkpointId),
          `Checkpoints: checkpoint '${parseBytes32String(this.checkpointId)}' already reached`
        );
      });
    });
  });

  context('setCheckpoint(bytes32,uint256)', function () {
    beforeEach(async function () {
      await fixtureLoader(fixtureTimeUnset, this);
      this.startTime = '1';
    });

    it('reverts if not called by the contract owner', async function () {
      await expectRevert(
        this.contract.setCheckpoint(this.checkpointId, this.startTime, {
          from: other,
        }),
        'Ownership: not the owner'
      );
    });

    it('reverts if the checkpoint is already set', async function () {
      await this.contract.setCheckpoint(this.checkpointId, this.startTime, {
        from: deployer,
      });
      await expectRevert(
        this.contract.setCheckpoint(this.checkpointId, this.startTime, {
          from: deployer,
        }),
        `Checkpoints: checkpoint '${parseBytes32String(this.checkpointId)}' already set`
      );
    });

    context('when successful (zero timestamp value)', function () {
      beforeEach(async function () {
        this.startTime = '0';
        this.receipt = await this.contract.setCheckpoint(this.checkpointId, this.startTime, {from: deployer});
      });

      it('leaves the checkpoint unset', async function () {
        (await this.contract.checkpoint(this.checkpointId)).should.be.bignumber.equal(this.startTime);
      });

      it('does not emit a {CheckpointSet} event', async function () {
        await expectEvent.notEmitted(this.receipt, 'CheckpointSet');
      });
    });

    context('when successful (non-zero timestamp value)', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.setCheckpoint(this.checkpointId, this.startTime, {from: deployer});
      });

      it('sets the checkpoint', async function () {
        (await this.contract.checkpoint(this.checkpointId)).should.be.bignumber.equal(this.startTime);
      });

      it('emits a {CheckpointSet} event', async function () {
        expectEvent(this.receipt, 'CheckpointSet', {
          checkpointId: this.checkpointId,
          timestamp: this.startTime,
        });
      });
    });
  });

  context('triggerCheckpoint(bytes32)', function () {
    beforeEach(async function () {
      await fixtureLoader(fixtureTimeUnset, this);
    });

    it('reverts if not called by the contract owner', async function () {
      await expectRevert(this.contract.triggerCheckpoint(this.checkpointId, {from: other}), 'Ownership: not the owner');
    });

    it('reverts if the checkpoint is already reached', async function () {
      await this.contract.triggerCheckpoint(this.checkpointId, {
        from: deployer,
      });
      await expectRevert(
        this.contract.triggerCheckpoint(this.checkpointId, {from: deployer}),
        `Checkpoints: checkpoint '${parseBytes32String(this.checkpointId)}' already reached`
      );
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.triggerCheckpoint(this.checkpointId, {from: deployer});
        const block = await hre.ethers.provider.getBlock(this.receipt.receipt.blockNumber);
        this.startTime = BigNumber.from(block.timestamp).toString();
      });

      it('sets the checkpoint to the current timestamp', async function () {
        (await this.contract.checkpoint(this.checkpointId)).should.be.bignumber.equal(this.startTime);
      });

      it('emits a {CheckpointSet} event', async function () {
        expectEvent(this.receipt, 'CheckpointSet', {
          checkpointId: this.checkpointId,
          timestamp: this.startTime,
        });
      });
    });
  });
});
