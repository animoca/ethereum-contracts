const {ethers} = require('hardhat');
const {expect} = require('chai');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');
const {time} = require('@nomicfoundation/hardhat-network-helpers');

describe('ERC20StakingLinearPool', function () {
  let _deployer, rewarder, holder, alice;

  before(async function () {
    [_deployer, rewarder, holder, alice] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.stakingToken = await deployContract('ERC20FixedSupply', '', '', 18, [alice.address], [1000n], await getForwarderRegistryAddress());
    this.rewardToken = await deployContract(
      'ERC20FixedSupply',
      '',
      '',
      18,
      [holder.address],
      [ethers.MaxUint256],
      await getForwarderRegistryAddress(),
    );
    this.contract = await deployContract(
      'ERC20StakingERC20RewardsLinearPoolMock',
      await this.stakingToken.getAddress(),
      await this.rewardToken.getAddress(),
      holder.address,
      await getForwarderRegistryAddress(),
    );
    this.rewarderRole = await this.contract.REWARDER_ROLE();
    await this.contract.grantRole(this.rewarderRole, rewarder.address);
    await this.rewardToken.connect(holder).approve(await this.contract.getAddress(), ethers.MaxUint256);
    await this.stakingToken.connect(alice).approve(await this.contract.getAddress(), ethers.MaxUint256);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('stake(bytes)', function () {
    context('when successful', function () {
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        this.receipt = await this.contract.connect(alice).stake(stakeData);
      });

      it('transfers the stake amount to the pool', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'Transfer')
          .withArgs(alice.address, await this.contract.getAddress(), amount);
      });

      it('emits a Staked event', async function () {
        const requiresTransfer = true;
        const modifiedStakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'bytes'], [requiresTransfer, stakeData]);
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, modifiedStakeData, amount);
      });
    });
  });

  describe('onERC20Received(address,address,uint256,bytes)', function () {
    it('reverts if called by another address than the staking token contract', async function () {
      await expect(this.contract.onERC20Received(alice.address, alice.address, 1n, '0x')).to.be.revertedWithCustomError(
        this.contract,
        'InvalidToken',
      );
    });

    context('when successful', function () {
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        this.receipt = await this.stakingToken.connect(alice).safeTransfer(await this.contract.getAddress(), amount, '0x');
      });

      it('transfers the stake amount to the pool', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'Transfer')
          .withArgs(alice.address, await this.contract.getAddress(), amount);
      });

      it('emits a Staked event', async function () {
        const requiresTransfer = false;
        const modifiedStakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'bytes'], [requiresTransfer, stakeData]);
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, modifiedStakeData, amount);
      });
    });
  });

  describe('withdraw(bytes)', function () {
    context('when successful', function () {
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);

      beforeEach(async function () {
        await this.contract.connect(alice).stake(stakeData);
        this.receipt = await this.contract.connect(alice).withdraw(withdrawData);
      });

      it('transfers the stake amount to the staker', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'Transfer')
          .withArgs(await this.contract.getAddress(), alice.address, amount);
      });

      it('emits a Withdrawn event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Withdrawn').withArgs(alice.address, withdrawData, amount);
      });
    });
  });

  describe('claim()', function () {
    context('when successful', function () {
      const amount = 1n;
      const reward = 100000n;
      const duration = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);
      const claimData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [reward]);

      beforeEach(async function () {
        await this.contract.connect(alice).stake(stakeData);
        await this.contract.connect(rewarder).addReward(reward, duration);
        await time.increase(duration);
        this.receipt = await this.contract.connect(alice).claim();
      });

      it('transfers the reward to the staker', async function () {
        await expect(this.receipt).to.emit(this.rewardToken, 'Transfer').withArgs(holder.address, alice.address, reward);
      });

      it('emits a Claimed event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Claimed').withArgs(alice.address, claimData, reward);
      });
    });
  });

  describe('setRewardHolder(address)', function () {
    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(alice).setRewardHolder(holder.address))
        .to.be.revertedWithCustomError(this.contract, 'NotContractOwner')
        .withArgs(alice.address);
    });

    context('when successful, reward holder not updated', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.setRewardHolder(holder.address);
      });

      it('sets the reward holder address', async function () {
        expect(await this.contract.rewardHolder()).to.equal(holder.address);
      });

      it('emits a RewardHolderUpdated event', async function () {
        await expect(this.receipt).to.not.emit(this.contract, 'RewardHolderSet');
      });
    });

    context('when successful, reward holder updated', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.setRewardHolder(alice.address);
      });

      it('sets the reward holder address', async function () {
        expect(await this.contract.rewardHolder()).to.equal(alice.address);
      });

      it('emits a RewardHolderSet event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'RewardHolderSet').withArgs(alice.address);
      });
    });
  });

  describe('recoverERC20s(address[],IERC20[],uint256[])', function () {
    it('reverts with inconsistent array lengths', async function () {
      await expect(this.contract.recoverERC20s([], [], [1n])).to.be.revertedWithCustomError(this.contract, 'InconsistentArrayLengths');
    });

    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(alice).recoverERC20s([], [], []))
        .to.be.revertedWithCustomError(this.contract, 'NotContractOwner')
        .withArgs(alice.address);
    });

    it('reverts if trying to recover staking tokens which were staked', async function () {
      const amount = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);
      const recoveryAmount = 1n;
      await this.contract.connect(alice).stake(stakeData);
      await this.stakingToken.connect(alice).transfer(await this.contract.getAddress(), recoveryAmount);
      await expect(this.contract.recoverERC20s([alice.address], [await this.stakingToken.getAddress()], [recoveryAmount + 1n]))
        .to.be.revertedWithCustomError(this.contract, 'InvalidRecoveryAmount')
        .withArgs(recoveryAmount + 1n, recoveryAmount);
    });

    context('when successful', function () {
      const recoveryAmount = 2n;

      beforeEach(async function () {
        const amount = 100n;
        const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [amount]);
        await this.contract.connect(alice).stake(stakeData);
        await this.stakingToken.connect(alice).transfer(await this.contract.getAddress(), recoveryAmount);
        this.receipt = await this.contract.recoverERC20s(
          [alice.address, alice.address],
          [await this.stakingToken.getAddress(), await this.rewardToken.getAddress()],
          [recoveryAmount, 0n],
        );
      });

      it('recovers the tokens', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'Transfer')
          .withArgs(await this.contract.getAddress(), alice.address, recoveryAmount);

        await expect(this.receipt)
          .to.emit(this.rewardToken, 'Transfer')
          .withArgs(await this.contract.getAddress(), alice.address, 0n);
      });
    });
  });

  describe('__msgData()', function () {
    it('returns the msg.data', async function () {
      await this.contract.__msgData();
    });
  });
});
