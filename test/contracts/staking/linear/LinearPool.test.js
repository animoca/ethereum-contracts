const {ethers} = require('hardhat');
const {expect} = require('chai');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {time} = require('@nomicfoundation/hardhat-network-helpers');

const {getForwarderRegistryAddress} = require('../../../helpers/registries');

const almostEqualDiv1e18 = function (expectedOrig, actualOrig) {
  const _1e18 = 10n ** 18n;
  const expected = expectedOrig / _1e18;
  const actual = actualOrig / _1e18;
  this.assert(
    expected == actual || expected + 1n == actual || expected + 2n == actual || actual + 1n == expected || actual + 2n == expected,
    'expected #{act} to be almost equal #{exp}',
    'expected #{act} to be different from #{exp}',
    expectedOrig.toString(),
    actualOrig.toString(),
  );
};

require('chai').use(function (chai) {
  chai.Assertion.overwriteMethod('almostEqualDiv1e18', function () {
    return function (value) {
      almostEqualDiv1e18.apply(this, [BigInt(value), BigInt(this._obj)]);
    };
  });
});

describe('LinearPool', function () {
  let _deployer, rewarder, alice, bob, other;

  before(async function () {
    [_deployer, rewarder, alice, bob, other] = await ethers.getSigners();
  });

  const scalingFactorDecimals = 36n;
  const scalingFactor = 10n ** scalingFactorDecimals;

  const otherScalingFactorDecimals = 64n;
  const otherScalingFactor = 10n ** otherScalingFactorDecimals;

  const fixture = async function () {
    this.attacker = await deployContract('LinearPoolReentrancyAttacker');
    this.contract = await deployContract(
      'LinearPoolMock',
      await this.attacker.getAddress(),
      scalingFactorDecimals,
      await getForwarderRegistryAddress(),
    );
    this.claimRemainderContract = await deployContract(
      'LinearPoolClaimRemainderMock',
      otherScalingFactorDecimals,
      await getForwarderRegistryAddress(),
    );
    this.rewarderRole = await this.contract.REWARDER_ROLE();
    await this.contract.grantRole(this.rewarderRole, rewarder.address);
    await this.claimRemainderContract.grantRole(this.rewarderRole, rewarder.address);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('constructor', function () {
    it('reverts if the scaling factor decimals are out of bounds', async function () {
      await expect(
        deployContract('LinearPoolMock', await this.attacker.getAddress(), 77n, await getForwarderRegistryAddress()),
      ).to.be.revertedWithCustomError(this.contract, 'ScalingFactorOutOfBounds');
    });

    it('sets the scaling factor based on the provided decimals', async function () {
      expect(await this.contract.SCALING_FACTOR()).to.equal(scalingFactor);
    });
  });

  describe('addReward(uint256,uint256)', function () {
    it('reverts if called by a non-rewarder', async function () {
      await expect(this.contract.connect(other).addReward(100, 1))
        .to.be.revertedWithCustomError(this.contract, 'NotRoleHolder')
        .withArgs(this.rewarderRole, other.address);
    });

    it('reverts with a 0 reward amount', async function () {
      await expect(this.contract.connect(rewarder).addReward(0, 1)).to.be.revertedWithCustomError(this.contract, 'InvalidRewardAmount');
    });

    it('reverts with a 0 duration', async function () {
      await expect(this.contract.connect(rewarder).addReward(100, 0)).to.be.revertedWithCustomError(this.contract, 'InvalidDuration');
    });

    it('reverts if the reward overflows when multiplied by the scaling factor', async function () {
      await expect(this.contract.connect(rewarder).addReward(ethers.MaxUint256, 10000)).to.be.revertedWithCustomError(
        this.contract,
        'RewardOverflow',
      );
    });

    it('reverts when there is already a reward being distributed and the additional reward rate causes overflow', async function () {
      await this.contract.connect(rewarder).addReward(ethers.MaxUint256 / (await this.contract.SCALING_FACTOR()), 1000);
      await expect(
        this.contract.connect(rewarder).addReward(ethers.MaxUint256 / (await this.contract.SCALING_FACTOR()), 1000),
      ).to.be.revertedWithCustomError(this.contract, 'RewardOverflow');
    });

    // it('reverts if there is no current distribution and reward rate is 0', async function () {
    //   await expect(this.contract.connect(rewarder).addReward(99, 100))
    //     .to.be.revertedWithCustomError(this.contract, 'RewardTooSmallForDuration')
    //     .withArgs(99, 100);
    // });

    // it('reverts if new distribution ends before current distribution and additional reward rate is 0', async function () {
    //   await this.contract.connect(rewarder).addReward(100, 100);
    //   await expect(this.contract.connect(rewarder).addReward(50, 50))
    //     .to.be.revertedWithCustomError(this.contract, 'RewardTooSmallForDuration')
    //     .withArgs(50, 100 - 1 /* 1 block */);
    // });

    // it('reverts if new distribution ends after current distribution and reward rate is 0', async function () {
    //   await this.contract.connect(rewarder).addReward(100, 100);
    //   await expect(this.contract.connect(rewarder).addReward(50, 150))
    //     .to.be.revertedWithCustomError(this.contract, 'RewardTooSmallForDuration')
    //     .withArgs(50, 150);
    // });

    it('reverts if new distribution ends after current distribution and rewards get diluted', async function () {
      const initialReward = 100n;
      const initialDuration = 10n;
      const initialRewardRate = (initialReward * scalingFactor) / initialDuration;
      const newRewardRate = 7n * scalingFactor; // lower than initialRewardRate / 2

      await this.contract.connect(rewarder).addReward(100, 10);
      await expect(this.contract.connect(rewarder).addReward(15, 15))
        .to.be.revertedWithCustomError(this.contract, 'RewardDilution')
        .withArgs(initialRewardRate, newRewardRate);
    });

    context('when successful, no current distribution', function () {
      const reward = 101n;
      const duration = 10n;
      const rewardRate = (reward * scalingFactor) / duration;

      beforeEach(async function () {
        this.receipt = await this.contract.connect(rewarder).addReward(reward, duration);
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
      });

      it('sets the reward rate', async function () {
        expect(await this.contract.rewardRate()).to.equal(rewardRate);
      });

      it('sets the reward end of distribution timestamp', async function () {
        expect(await this.contract.distributionEnd()).to.equal(BigInt(this.currentTimestamp) + duration);
      });

      it('sets the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(this.currentTimestamp);
      });

      it('calls the _computeAddReward function', async function () {
        await expect(this.receipt).to.emit(this.contract, 'ComputeAddRewardCalled').withArgs(rewarder.address, reward);
      });

      it('does not update the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('emits a RewardAdded event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'RewardAdded').withArgs(rewarder.address, reward, duration);
      });
    });

    context('when successful, new distribution ends before current distribution', function () {
      const firstReward = 1001n;
      const firstDuration = 100n;
      const firstRewardRate = (firstReward * scalingFactor) / firstDuration;

      const reward = 500n;
      const duration = 50n;
      const newDuration = 99n; // (firstDuration - 1 /* 1 block */)
      const additionalRewardRate = (reward * scalingFactor) / newDuration;
      const rewardRate = firstRewardRate + additionalRewardRate;

      beforeEach(async function () {
        await this.contract.connect(rewarder).addReward(firstReward, firstDuration);
        this.receipt = await this.contract.connect(rewarder).addReward(reward, duration);
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
      });

      it('sets the reward rate', async function () {
        expect(await this.contract.rewardRate()).to.equal(rewardRate);
      });

      it('sets the reward end of distribution timestamp', async function () {
        expect(await this.contract.distributionEnd()).to.equal(BigInt(this.currentTimestamp) + newDuration);
      });

      it('sets the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(this.currentTimestamp);
      });

      it('calls the _computeAddReward function', async function () {
        await expect(this.receipt).to.emit(this.contract, 'ComputeAddRewardCalled').withArgs(rewarder.address, reward);
      });

      it('does not update the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('emits a RewardAdded event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'RewardAdded').withArgs(rewarder.address, reward, newDuration);
      });
    });

    context('when successful, new distribution ends after current distribution', function () {
      const firstReward = 1001n;
      const firstDuration = 100n;
      const firstRewardRate = (firstReward * scalingFactor) / firstDuration;

      const reward = 5000n;
      const duration = 500n;
      const remainingDuration = 99n; // (firstDuration - 1 /* 1 block */)
      const remainingReward = firstRewardRate * remainingDuration;
      const totalReward = reward * scalingFactor + remainingReward;
      const rewardRate = totalReward / duration;

      beforeEach(async function () {
        await this.contract.connect(rewarder).addReward(firstReward, firstDuration);
        this.receipt = await this.contract.connect(rewarder).addReward(reward, duration);
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
      });

      it('sets the reward rate', async function () {
        expect(await this.contract.rewardRate()).to.equal(rewardRate);
      });

      it('sets the reward end of distribution timestamp', async function () {
        expect(await this.contract.distributionEnd()).to.equal(BigInt(this.currentTimestamp) + duration);
      });

      it('sets the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(this.currentTimestamp);
      });

      it('calls the _computeAddReward function', async function () {
        await expect(this.receipt).to.emit(this.contract, 'ComputeAddRewardCalled').withArgs(rewarder.address, reward);
      });

      it('does not update the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('emits a RewardAdded event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'RewardAdded').withArgs(rewarder.address, reward, duration);
      });
    });
  });

  describe('stake(bytes)', function () {
    it('reverts with a 0 amount', async function () {
      await expect(this.contract.stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [0]))).to.be.revertedWithCustomError(
        this.contract,
        'InvalidStakeAmount',
      );
    });

    it('reverts if _computeStake() tries to re-enter the function', async function () {
      await this.attacker.setTarget(await this.contract.getAddress());
      await expect(this.contract.stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [0]))).to.be.revertedWithCustomError(
        this.contract,
        'ReentrancyGuardReentrantCall',
      );
    });

    context('when successful, before adding rewards', function () {
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        this.receipt = await this.contract.connect(alice).stake(stakeData);
      });

      it('increases the total staked amount', async function () {
        expect(await this.contract.totalStaked()).to.equal(amount);
      });

      it('increases the staker amount', async function () {
        expect(await this.contract.staked(alice.address)).to.equal(amount);
      });

      it('does not set the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('does not set the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(0);
      });

      it('does not set a reward for the stakers', async function () {
        expect(await this.contract.rewards(alice.address)).to.equal(0);
      });

      it('does not set the reward per stake point paid for the staker', async function () {
        expect(await this.contract.rewardPerStakePointPaid(alice.address)).to.equal(0);
      });

      it('calls the _computeStake function', async function () {
        await expect(this.receipt).to.emit(this.contract, 'ComputeStakeCalled').withArgs(alice.address, stakeData);
      });

      it('emits a Staked event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, stakeData, amount);
      });
    });

    context('when successful, first stake after adding rewards', function () {
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        await this.contract.connect(rewarder).addReward(1000, 100);
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.receipt = await this.contract.connect(alice).stake(stakeData);
      });

      it('increases the total staked amount', async function () {
        expect(await this.contract.totalStaked()).to.equal(amount);
      });

      it('increases the staker amount', async function () {
        expect(await this.contract.staked(alice.address)).to.equal(amount);
      });

      it('does not set the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('does not set the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(this.currentTimestamp);
      });

      it('does not set a reward for the stakers', async function () {
        expect(await this.contract.rewards(alice.address)).to.equal(0);
      });

      it('does not set the reward per stake point paid for the staker', async function () {
        expect(await this.contract.rewardPerStakePointPaid(alice.address)).to.equal(0);
      });

      it('calls the _computeStake function', async function () {
        await expect(this.receipt).to.emit(this.contract, 'ComputeStakeCalled').withArgs(alice.address, stakeData);
      });

      it('emits a Staked event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, stakeData, amount);
      });
    });

    context('when successful, second stake after adding rewards', function () {
      const firstAmount = 50n;
      const firstStakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [firstAmount]);
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        const reward = 1000n;
        const duration = 100n;
        await this.contract.connect(rewarder).addReward(reward, duration);
        const rewardRate = (reward * scalingFactor) / duration;
        this.distributionStart = (await ethers.provider.getBlock('latest')).timestamp;
        await this.contract.connect(bob).stake(firstStakeData);
        this.receipt = await this.contract.connect(alice).stake(stakeData);
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.rewardPerStakePointStored = (BigInt(this.currentTimestamp - this.distributionStart) * rewardRate) / firstAmount;
      });

      it('increases the total staked amount', async function () {
        expect(await this.contract.totalStaked()).to.equal(firstAmount + amount);
      });

      it('increases the staker amount', async function () {
        expect(await this.contract.staked(bob.address)).to.equal(firstStakeData);
        expect(await this.contract.staked(alice.address)).to.equal(amount);
      });

      it('sets the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(this.rewardPerStakePointStored);
      });

      it('updates the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(this.currentTimestamp);
      });

      it('does not set a reward for the staker', async function () {
        expect(await this.contract.rewards(alice.address)).to.equal(0);
      });

      it('sets the reward per stake point paid for the staker', async function () {
        expect(await this.contract.rewardPerStakePointPaid(alice.address)).to.equal(this.rewardPerStakePointStored);
      });

      it('calls the _computeStake function', async function () {
        await expect(this.receipt).to.emit(this.contract, 'ComputeStakeCalled').withArgs(alice.address, stakeData);
      });

      it('emits a Staked event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, stakeData, amount);
      });
    });
  });

  describe('withdraw(bytes)', function () {
    it('reverts with a 0 amount', async function () {
      await expect(this.contract.connect(alice).withdraw(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [0]))).to.be.revertedWithCustomError(
        this.contract,
        'InvalidWithdrawAmount',
      );
    });

    it('reverts if withdrawing more than the staker staked amount', async function () {
      await expect(this.contract.connect(alice).withdraw(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1])))
        .to.be.revertedWithCustomError(this.contract, 'NotEnoughStake')
        .withArgs(alice.address, 0, 1);
    });

    it('reverts if _computeWithdraw() tries to re-enter the function', async function () {
      await this.contract.connect(alice).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1]));
      await this.attacker.setTarget(await this.contract.getAddress());
      await expect(this.contract.connect(alice).withdraw(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1]))).to.be.revertedWithCustomError(
        this.contract,
        'ReentrancyGuardReentrantCall',
      );
    });

    context('when successful, before adding rewards', function () {
      const amount = 100n;
      const amount2 = 10n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);
      const stakeData2 = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount2]);
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        await this.contract.connect(alice).stake(stakeData);
        await this.contract.connect(bob).stake(stakeData2);
        this.receipt = await this.contract.connect(alice).withdraw(withdrawData);
      });

      it('decreases the total staked amount', async function () {
        expect(await this.contract.totalStaked()).to.equal(amount2);
      });

      it('decreases the staker amount', async function () {
        expect(await this.contract.staked(alice.address)).to.equal(0);
        expect(await this.contract.staked(bob.address)).to.equal(amount2);
      });

      it('does not set the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('does not set the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(0);
      });

      it('does not set a reward for the stakers', async function () {
        expect(await this.contract.rewards(alice.address)).to.equal(0);
      });

      it('does not set the reward per stake point paid for the staker', async function () {
        expect(await this.contract.rewardPerStakePointPaid(alice.address)).to.equal(0);
      });

      it('calls the _computeWithdraw function', async function () {
        await expect(this.receipt).to.emit(this.contract, 'ComputeWithdrawCalled').withArgs(alice.address, withdrawData);
      });

      it('emits a Withdrawn event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Withdrawn').withArgs(alice.address, withdrawData, amount);
      });
    });

    context('when successful, after adding rewards', function () {
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        const reward = 1000n;
        const duration = 100n;
        await this.contract.connect(rewarder).addReward(reward, duration);
        const rewardRate = (reward * scalingFactor) / duration;
        this.distributionStart = (await ethers.provider.getBlock('latest')).timestamp;
        await this.contract.connect(alice).stake(stakeData);
        this.receipt = await this.contract.connect(alice).withdraw(withdrawData);
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.rewardPerStakePointStored = (BigInt(this.currentTimestamp - this.distributionStart) * rewardRate) / amount;
        this.reward = rewardRate * BigInt(this.currentTimestamp - this.distributionStart);
      });

      it('decreases the total staked amount', async function () {
        expect(await this.contract.totalStaked()).to.equal(0);
      });

      it('decreases the staker amount', async function () {
        expect(await this.contract.staked(alice.address)).to.equal(0);
      });

      it('sets the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(this.rewardPerStakePointStored);
      });

      it('does not set the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(this.currentTimestamp);
      });

      it('sets a reward for the staker', async function () {
        expect(await this.contract.rewards(alice.address)).to.equal(this.reward);
      });

      it('sets the reward per stake point paid for the staker', async function () {
        expect(await this.contract.rewardPerStakePointPaid(alice.address)).to.equal(this.rewardPerStakePointStored);
      });

      it('calls the _computeWithdraw function', async function () {
        await expect(this.receipt).to.emit(this.contract, 'ComputeWithdrawCalled').withArgs(alice.address, withdrawData);
      });

      it('emits a Withdrawn event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Withdrawn').withArgs(alice.address, withdrawData, amount);
      });
    });
  });

  describe('claim()', function () {
    it('reverts if trying to re-enter the function', async function () {
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);
      await this.contract.connect(rewarder).addReward(1000, 100);
      this.distributionStart = (await ethers.provider.getBlock('latest')).timestamp;
      await this.contract.connect(alice).stake(stakeData);
      await this.attacker.setTarget(await this.contract.getAddress());
      await expect(this.contract.connect(alice).claim('0x')).to.be.revertedWithCustomError(this.contract, 'ReentrancyGuardReentrantCall');
    });

    it('reverts if _computeClaim() miscalculates claimed and unclaimed rewards', async function () {
      const invalidClaimSumContract = await deployContract(
        'LinearPoolInvalidClaimSumMock',
        scalingFactorDecimals,
        await getForwarderRegistryAddress(),
      );
      await invalidClaimSumContract.grantRole(this.rewarderRole, rewarder.address);
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);
      await invalidClaimSumContract.connect(rewarder).addReward(1000n, 100n);
      this.distributionStart = (await ethers.provider.getBlock('latest')).timestamp;
      await invalidClaimSumContract.connect(alice).stake(stakeData);
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1n]);
      await invalidClaimSumContract.connect(alice).withdraw(withdrawData); // for coverage
      await expect(invalidClaimSumContract.connect(alice).claim('0x'))
        .to.be.revertedWithCustomError(invalidClaimSumContract, 'InvalidClaimSum')
        .withArgs(29, 29, 1);
    });

    context('when successful, no stake, no rewards', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.connect(alice).claim('0x');
      });

      it('does not set the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('does not set the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(0);
      });

      it('does not set a reward for the staker', async function () {
        expect(await this.contract.rewards(alice.address)).to.equal(0);
      });

      it('sets the reward per stake point paid for the staker', async function () {
        expect(await this.contract.rewardPerStakePointPaid(alice.address)).to.equal(0);
      });

      it('does not call the _computeClaim function', async function () {
        await expect(this.receipt).to.not.emit(this.contract, 'ComputeClaimCalled');
      });

      it('does not emit a Claimed event', async function () {
        await expect(this.receipt).to.not.emit(this.contract, 'Claimed');
      });
    });

    context('when successful, no stake, with rewards', function () {
      beforeEach(async function () {
        const reward = 1000n;
        const duration = 100n;
        await this.contract.connect(rewarder).addReward(reward, duration);
        this.rewardAddedTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.receipt = await this.contract.connect(alice).claim('0x');
      });

      it('does not set the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('does not set the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(this.rewardAddedTimestamp);
      });

      it('does not set a reward for the staker', async function () {
        expect(await this.contract.rewards(alice.address)).to.equal(0);
      });

      it('sets the reward per stake point paid for the staker', async function () {
        expect(await this.contract.rewardPerStakePointPaid(alice.address)).to.equal(0);
      });

      it('does not call the _computeClaim function', async function () {
        await expect(this.receipt).to.not.emit(this.contract, 'ComputeClaimCalled');
      });

      it('does not emit a Claimed event', async function () {
        await expect(this.receipt).to.not.emit(this.contract, 'Claimed');
      });
    });

    context('when successful, with stake, no rewards', function () {
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        await this.contract.connect(alice).stake(stakeData);
        this.receipt = await this.contract.connect(alice).claim('0x');
      });

      it('does not set the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('does not set the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(0);
      });

      it('does not set a reward for the staker', async function () {
        expect(await this.contract.rewards(alice.address)).to.equal(0);
      });

      it('sets the reward per stake point paid for the staker', async function () {
        expect(await this.contract.rewardPerStakePointPaid(alice.address)).to.equal(0);
      });

      it('does not call the _computeClaim function', async function () {
        await expect(this.receipt).to.not.emit(this.contract, 'ComputeClaimCalled');
      });

      it('does not emit a Claimed event', async function () {
        await expect(this.receipt).to.not.emit(this.contract, 'Claimed');
      });
    });

    context('when successful, with stake, with rewards', function () {
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        const reward = 1000n;
        const duration = 100n;
        await this.contract.connect(rewarder).addReward(reward, duration);
        const rewardRate = (reward * scalingFactor) / duration;
        this.distributionStart = (await ethers.provider.getBlock('latest')).timestamp;
        await this.contract.connect(alice).stake(stakeData);
        this.receipt = await this.contract.connect(alice).claim('0x');
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.rewardPerStakePointStored = (BigInt(this.currentTimestamp - this.distributionStart) * rewardRate) / amount;
        this.reward = rewardRate * BigInt(this.currentTimestamp - this.distributionStart);
      });

      it('sets the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(this.rewardPerStakePointStored);
      });

      it('sets the last updated timestamp', async function () {
        expect(await this.contract.lastUpdated()).to.equal(this.currentTimestamp);
      });

      it('unsets the reward for the staker', async function () {
        expect(await this.contract.rewards(alice.address)).to.equal(0);
      });

      it('sets the reward per stake point paid for the staker', async function () {
        expect(await this.contract.rewardPerStakePointPaid(alice.address)).to.equal(this.rewardPerStakePointStored);
      });

      it('calls the _computeClaim function', async function () {
        await expect(this.receipt)
          .to.emit(this.contract, 'ComputeClaimCalled')
          .withArgs(alice.address, this.reward / scalingFactor, '0x');
      });

      it('emits a Claimed event', async function () {
        const claimed = this.reward / scalingFactor;
        const remainder = 0n;
        await expect(this.receipt).to.emit(this.contract, 'Claimed').withArgs(alice.address, '0x', claimed, remainder);
      });
    });
  });

  describe('claim() with remainder', function () {
    context('when successful, no stake, no rewards', function () {
      beforeEach(async function () {
        this.receipt = await this.claimRemainderContract.connect(alice).claim('0x');
      });

      it('does not set the reward per stake point stored', async function () {
        expect(await this.claimRemainderContract.rewardPerStakePointStored()).to.equal(0);
      });

      it('does not set the last updated timestamp', async function () {
        expect(await this.claimRemainderContract.lastUpdated()).to.equal(0);
      });

      it('does not set a reward for the staker', async function () {
        expect(await this.claimRemainderContract.rewards(alice.address)).to.equal(0);
      });

      it('sets the reward per stake point paid for the staker', async function () {
        expect(await this.claimRemainderContract.rewardPerStakePointPaid(alice.address)).to.equal(0);
      });

      it('does not emit a Claimed event', async function () {
        await expect(this.receipt).to.not.emit(this.claimRemainderContract, 'Claimed');
      });
    });

    context('when successful, no stake, with rewards', function () {
      beforeEach(async function () {
        await this.claimRemainderContract.connect(rewarder).addReward(300000000n, 7776000n);
        this.rewardAddedTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.receipt = await this.claimRemainderContract.connect(alice).claim('0x');
      });

      it('does not set the reward per stake point stored', async function () {
        expect(await this.claimRemainderContract.rewardPerStakePointStored()).to.equal(0);
      });

      it('does not set the last updated timestamp', async function () {
        expect(await this.claimRemainderContract.lastUpdated()).to.equal(this.rewardAddedTimestamp);
      });

      it('does not set a reward for the staker', async function () {
        expect(await this.claimRemainderContract.rewards(alice.address)).to.equal(0);
      });

      it('sets the reward per stake point paid for the staker', async function () {
        expect(await this.claimRemainderContract.rewardPerStakePointPaid(alice.address)).to.equal(0);
      });

      it('does not emit a Claimed event', async function () {
        await expect(this.receipt).to.not.emit(this.claimRemainderContract, 'Claimed');
      });
    });

    context('when successful, with stake, no rewards', function () {
      const amount = ethers.parseEther('1000');
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        await this.claimRemainderContract.connect(alice).stake(stakeData);
        this.receipt = await this.claimRemainderContract.connect(alice).claim('0x');
      });

      it('does not set the reward per stake point stored', async function () {
        expect(await this.claimRemainderContract.rewardPerStakePointStored()).to.equal(0);
      });

      it('does not set the last updated timestamp', async function () {
        expect(await this.claimRemainderContract.lastUpdated()).to.equal(0);
      });

      it('does not set a reward for the staker', async function () {
        expect(await this.claimRemainderContract.rewards(alice.address)).to.equal(0);
      });

      it('sets the reward per stake point paid for the staker', async function () {
        expect(await this.claimRemainderContract.rewardPerStakePointPaid(alice.address)).to.equal(0);
      });

      it('does not emit a Claimed event', async function () {
        await expect(this.receipt).to.not.emit(this.claimRemainderContract, 'Claimed');
      });

      it('coverage', async function () {
        const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1n]);
        await this.claimRemainderContract.connect(alice).withdraw(withdrawData);
      });
    });

    context('when successful, with stake, with rewards', function () {
      const amount = ethers.parseEther('10');
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);
      const reward = 300000000n;
      const duration = 7776000n;
      const rewardRate = (reward * otherScalingFactor) / duration;

      beforeEach(async function () {
        await this.claimRemainderContract.connect(rewarder).addReward(reward, duration);
        this.distributionStart = (await ethers.provider.getBlock('latest')).timestamp;
        await this.claimRemainderContract.connect(alice).stake(stakeData);
        this.receipt = await this.claimRemainderContract.connect(alice).claim('0x');
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.rewardPerStakePointStored = (BigInt(this.currentTimestamp - this.distributionStart) * rewardRate) / amount;
        this.reward = rewardRate * BigInt(this.currentTimestamp - this.distributionStart);
      });

      it('sets the reward per stake point stored', async function () {
        expect(await this.claimRemainderContract.rewardPerStakePointStored()).to.equal(this.rewardPerStakePointStored);
      });

      it('sets the last updated timestamp', async function () {
        expect(await this.claimRemainderContract.lastUpdated()).to.equal(this.currentTimestamp);
      });

      it('sets the reward for the staker to unclaimed + dust', async function () {
        const unclaimed = 1n;
        const dust = this.reward % otherScalingFactor;
        expect(await this.claimRemainderContract.rewards(alice.address)).to.almostEqualDiv1e18(unclaimed * otherScalingFactor + dust);
      });

      it('sets the reward per stake point paid for the staker', async function () {
        expect(await this.claimRemainderContract.rewardPerStakePointPaid(alice.address)).to.equal(this.rewardPerStakePointStored);
      });

      it('emits a Claimed event', async function () {
        const unclaimed = 1n;
        const claimed = this.reward / otherScalingFactor - unclaimed;
        await expect(this.receipt).to.emit(this.claimRemainderContract, 'Claimed').withArgs(alice.address, '0x', claimed, unclaimed);
      });
    });
  });

  describe('__msgData()', function () {
    it('returns the msg.data', async function () {
      await this.contract.__msgData();
    });
  });

  describe('Scenarios', function () {
    it('two equal stakers stake before distribution and wait until end of duration', async function () {
      const duration = time.duration.weeks(2);
      const stake = 1n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [stake]);
      await this.contract.connect(alice).stake(stakeData);
      await this.contract.connect(bob).stake(stakeData);
      await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
      await time.increase(duration);
      expect((await this.contract.rewardPerStakePoint()) / (await this.contract.SCALING_FACTOR())).to.almostEqualDiv1e18(ethers.parseEther('25000'));
      expect(await this.contract.earned(alice.address)).to.almostEqualDiv1e18(ethers.parseEther('25000') * scalingFactor);
      expect(await this.contract.earned(bob.address)).to.almostEqualDiv1e18(ethers.parseEther('25000') * scalingFactor);
    });

    it('two stakers with stake 1:3 stake before distribution and wait until end of duration', async function () {
      const duration = time.duration.weeks(2);
      await this.contract.connect(alice).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1n]));
      await this.contract.connect(bob).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [3n]));
      await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
      await time.increase(duration);
      expect((await this.contract.rewardPerStakePoint()) / (await this.contract.SCALING_FACTOR())).to.almostEqualDiv1e18(ethers.parseEther('12500'));
      expect(await this.contract.earned(alice.address)).to.almostEqualDiv1e18(ethers.parseEther('12500') * scalingFactor);
      expect(await this.contract.earned(bob.address)).to.almostEqualDiv1e18(ethers.parseEther('37500') * scalingFactor);
    });

    it('two stakers with stake 1:3, multiple distributions', async function () {
      const duration = time.duration.weeks(1);
      await this.contract.connect(alice).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1n]));
      await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
      await time.increase(duration);
      expect((await this.contract.rewardPerStakePoint()) / (await this.contract.SCALING_FACTOR())).to.almostEqualDiv1e18(ethers.parseEther('50000'));
      expect(await this.contract.earned(alice.address)).to.almostEqualDiv1e18(ethers.parseEther('50000') * scalingFactor);
      expect(await this.contract.earned(bob.address)).to.almostEqualDiv1e18(0);

      await this.contract.connect(bob).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [3n]));
      for (let i = 0; i < 3; i++) {
        await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
        await time.increase(duration);
      }

      expect((await this.contract.rewardPerStakePoint()) / (await this.contract.SCALING_FACTOR())).to.almostEqualDiv1e18(ethers.parseEther('87500'));
      expect(await this.contract.earned(alice.address)).to.almostEqualDiv1e18(ethers.parseEther('87500') * scalingFactor);
      expect(await this.contract.earned(bob.address)).to.almostEqualDiv1e18(ethers.parseEther('112500') * scalingFactor);
    });

    it('One staker on 2 durations with gap', async function () {
      const duration = time.duration.weeks(2);
      await this.contract.connect(alice).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1n]));
      await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
      await time.increase(duration * 2);
      await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
      await time.increase(duration);

      expect((await this.contract.rewardPerStakePoint()) / (await this.contract.SCALING_FACTOR())).to.almostEqualDiv1e18(ethers.parseEther('100000'));
      expect(await this.contract.earned(alice.address)).to.almostEqualDiv1e18(ethers.parseEther('100000') * scalingFactor);
    });
  });
});
