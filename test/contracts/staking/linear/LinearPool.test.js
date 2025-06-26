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

  const fixture = async function () {
    this.attacker = await deployContract('LinearPoolReentrancyAttacker');
    this.contract = await deployContract('LinearPoolMock', await this.attacker.getAddress(), await getForwarderRegistryAddress());
    this.rewarderRole = await this.contract.REWARDER_ROLE();
    await this.contract.grantRole(this.rewarderRole, rewarder.address);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
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

    it('reverts if there is no current distribution and reward rate is 0', async function () {
      await expect(this.contract.connect(rewarder).addReward(99, 100))
        .to.be.revertedWithCustomError(this.contract, 'RewardTooSmallForDuration')
        .withArgs(99, 100);
    });

    it('reverts if new distribution ends before current distribution and additional reward rate is 0', async function () {
      await this.contract.connect(rewarder).addReward(100, 100);
      await expect(this.contract.connect(rewarder).addReward(50, 50))
        .to.be.revertedWithCustomError(this.contract, 'RewardTooSmallForDuration')
        .withArgs(50, 100 - 1 /* 1 block */);
    });

    it('reverts if new distribution ends after current distribution and reward rate is 0', async function () {
      await this.contract.connect(rewarder).addReward(100, 100);
      await expect(this.contract.connect(rewarder).addReward(50, 150))
        .to.be.revertedWithCustomError(this.contract, 'RewardTooSmallForDuration')
        .withArgs(50, 150);
    });

    it('reverts if new distribution ends after current distribution and rewards get diluted', async function () {
      await this.contract.connect(rewarder).addReward(100, 10);
      await expect(this.contract.connect(rewarder).addReward(15, 15)).to.be.revertedWithCustomError(this.contract, 'RewardDilution').withArgs(10, 7);
    });

    context('when successful, no current distribution', function () {
      const reward = 101n;
      const duration = 10n;
      const rewardRate = 10n; // reward / duration
      const dust = 1n; // reward % duration

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
        await expect(this.receipt).to.emit(this.contract, 'ComputeAddRewardCalled').withArgs(rewarder.address, reward, dust);
      });

      it('does not update the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('emits a RewardAdded event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'RewardAdded').withArgs(rewarder.address, reward, duration, dust);
      });
    });

    context('when successful, new distribution ends before current distribution', function () {
      const firstReward = 1001n;
      const firstDuration = 100n;
      // const firstRewardRate = 10n; // firstReward / firstDuration
      // const firstDust = 1n; // firstReward % firstDuration

      const reward = 500;
      const duration = 50n;
      const newDuration = 99n; // (firstDuration - 1 /* 1 block */)
      // const additionalRewardRate = 5n; // reward / newDuration;
      const dust = 5n; // reward % newDuration;
      const rewardRate = 15n; // firstRewardRate + additionalRewardRate

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
        await expect(this.receipt).to.emit(this.contract, 'ComputeAddRewardCalled').withArgs(rewarder.address, reward, dust);
      });

      it('does not update the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('emits a RewardAdded event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'RewardAdded').withArgs(rewarder.address, reward, newDuration, dust);
      });
    });

    context('when successful, new distribution ends after current distribution', function () {
      const firstReward = 1001n;
      const firstDuration = 100n;
      // const firstRewardRate = 10n; // firstReward / firstDuration
      // const firstDust = 1n; // firstReward % firstDuration

      const reward = 5000;
      const duration = 500n;
      // const remainingDuration = 99n; // (firstDuration - 1 /* 1 block */)
      // const remainingReward = 990n; // firstRewardRate * remainingDuration
      // const totalReward = 5990n; // reward + remainingReward
      const dust = 490n; // totalReward % duration;
      const rewardRate = 11n; // totalReward / duration

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
        await expect(this.receipt).to.emit(this.contract, 'ComputeAddRewardCalled').withArgs(rewarder.address, reward, dust);
      });

      it('does not update the reward per stake point stored', async function () {
        expect(await this.contract.rewardPerStakePointStored()).to.equal(0);
      });

      it('emits a RewardAdded event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'RewardAdded').withArgs(rewarder.address, reward, duration, dust);
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
        await this.contract.connect(rewarder).addReward(1000, 100);
        this.distributionStart = (await ethers.provider.getBlock('latest')).timestamp;
        await this.contract.connect(bob).stake(firstStakeData);
        this.receipt = await this.contract.connect(alice).stake(stakeData);
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.rewardPerStakePointStored =
          (BigInt(this.currentTimestamp - this.distributionStart) * (await this.contract.rewardRate()) * (await this.contract.SCALING_FACTOR())) /
          firstAmount; // the total staked before the new stake is added
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
        await this.contract.connect(rewarder).addReward(1000, 100);
        this.distributionStart = (await ethers.provider.getBlock('latest')).timestamp;
        await this.contract.connect(alice).stake(stakeData);
        this.receipt = await this.contract.connect(alice).withdraw(withdrawData);
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.rewardPerStakePointStored =
          (BigInt(this.currentTimestamp - this.distributionStart) * (await this.contract.rewardRate()) * (await this.contract.SCALING_FACTOR())) /
          amount;
        this.reward = (await this.contract.rewardRate()) * BigInt(this.currentTimestamp - this.distributionStart);
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
    context('when successful, no stake, no rewards', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.connect(alice).claim();
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
        await this.contract.connect(rewarder).addReward(1000, 100);
        this.rewardAddedTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.receipt = await this.contract.connect(alice).claim();
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
        this.receipt = await this.contract.connect(alice).claim();
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
        await this.contract.connect(rewarder).addReward(1000, 100);
        this.distributionStart = (await ethers.provider.getBlock('latest')).timestamp;
        await this.contract.connect(alice).stake(stakeData);
        this.receipt = await this.contract.connect(alice).claim();
        this.currentTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        this.rewardPerStakePointStored =
          (BigInt(this.currentTimestamp - this.distributionStart) * (await this.contract.rewardRate()) * (await this.contract.SCALING_FACTOR())) /
          amount;
        this.reward = (await this.contract.rewardRate()) * BigInt(this.currentTimestamp - this.distributionStart);
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
        await expect(this.receipt).to.emit(this.contract, 'ComputeClaimCalled').withArgs(alice.address, this.reward);
      });

      it('emits a Claimed event', async function () {
        const claimData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [this.reward]);
        await expect(this.receipt).to.emit(this.contract, 'Claimed').withArgs(alice.address, claimData, this.reward);
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
      expect(await this.contract.earned(alice.address)).to.almostEqualDiv1e18(ethers.parseEther('25000'));
      expect(await this.contract.earned(bob.address)).to.almostEqualDiv1e18(ethers.parseEther('25000'));
    });

    it('two stakers with stake 1:3 stake before distribution and wait until end of duration', async function () {
      const duration = time.duration.weeks(2);
      await this.contract.connect(alice).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1n]));
      await this.contract.connect(bob).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [3n]));
      await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
      await time.increase(duration);
      expect((await this.contract.rewardPerStakePoint()) / (await this.contract.SCALING_FACTOR())).to.almostEqualDiv1e18(ethers.parseEther('12500'));
      expect(await this.contract.earned(alice.address)).to.almostEqualDiv1e18(ethers.parseEther('12500'));
      expect(await this.contract.earned(bob.address)).to.almostEqualDiv1e18(ethers.parseEther('37500'));
    });

    it('two stakers with stake 1:3, multiple distributions', async function () {
      const duration = time.duration.weeks(1);
      await this.contract.connect(alice).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1n]));
      await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
      await time.increase(duration);
      expect((await this.contract.rewardPerStakePoint()) / (await this.contract.SCALING_FACTOR())).to.almostEqualDiv1e18(ethers.parseEther('50000'));
      expect(await this.contract.earned(alice.address)).to.almostEqualDiv1e18(ethers.parseEther('50000'));
      expect(await this.contract.earned(bob.address)).to.almostEqualDiv1e18(0);

      await this.contract.connect(bob).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [3n]));
      for (let i = 0; i < 3; i++) {
        await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
        await time.increase(duration);
      }

      expect((await this.contract.rewardPerStakePoint()) / (await this.contract.SCALING_FACTOR())).to.almostEqualDiv1e18(ethers.parseEther('87500'));
      expect(await this.contract.earned(alice.address)).to.almostEqualDiv1e18(ethers.parseEther('87500'));
      expect(await this.contract.earned(bob.address)).to.almostEqualDiv1e18(ethers.parseEther('112500'));
    });

    it('One staker on 2 durations with gap', async function () {
      const duration = time.duration.weeks(2);
      await this.contract.connect(alice).stake(ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [1n]));
      await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
      await time.increase(duration * 2);
      await this.contract.connect(rewarder).addReward(ethers.parseEther('50000'), duration);
      await time.increase(duration);

      expect((await this.contract.rewardPerStakePoint()) / (await this.contract.SCALING_FACTOR())).to.almostEqualDiv1e18(ethers.parseEther('100000'));
      expect(await this.contract.earned(alice.address)).to.almostEqualDiv1e18(ethers.parseEther('100000'));
    });
  });
});
