const {ethers} = require('hardhat');
const {expect} = require('chai');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');
const {time} = require('@nomicfoundation/hardhat-network-helpers');

describe('ERC1155StakingLinearPool', function () {
  let deployer, rewarder, holder, alice;

  before(async function () {
    [deployer, rewarder, holder, alice] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.stakingToken = await deployContract('ERC1155Full', '', '', ethers.ZeroAddress, ethers.ZeroAddress, await getForwarderRegistryAddress());
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
      'ERC1155StakingERC20RewardsLinearPoolMock',
      await this.stakingToken.getAddress(),
      await this.rewardToken.getAddress(),
      holder.address,
      await getForwarderRegistryAddress(),
    );
    this.rewarderRole = await this.contract.REWARDER_ROLE();
    await this.contract.grantRole(this.rewarderRole, rewarder.address);
    await this.rewardToken.connect(holder).approve(await this.contract.getAddress(), ethers.MaxUint256);
    await this.stakingToken.grantRole(await this.stakingToken.MINTER_ROLE(), deployer.address);
    await this.stakingToken.safeBatchMint(alice.address, [1, 2, 3], [10, 10, 10], '0x');
    await this.stakingToken.connect(alice).setApprovalForAll(await this.contract.getAddress(), true);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('stake(bytes)', function () {
    it('reverts with inconsistent array lengths for a batch', async function () {
      const batch = true;
      const tokenIds = [1n, 2n];
      const amounts = [10n, 10n, 10n];
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]', 'uint256[]'], [batch, tokenIds, amounts]);
      await expect(this.contract.connect(alice).stake(stakeData)).to.be.revertedWithCustomError(this.contract, 'InconsistentArrayLengths');
    });

    context('when successful, single token', function () {
      const batch = false;
      const tokenId = 1n;
      const amount = 10n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256', 'uint256'], [batch, tokenId, amount]);
      const tokenValue = 10n;

      beforeEach(async function () {
        this.receipt = await this.contract.connect(alice).stake(stakeData);
      });

      it('transfers the token to the pool', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'TransferSingle')
          .withArgs(await this.contract.getAddress(), alice.address, await this.contract.getAddress(), tokenId, amount);
      });

      it('emits a Staked event', async function () {
        const requiresTransfer = true;
        const modifiedStakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'bytes'], [requiresTransfer, stakeData]);
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, modifiedStakeData, tokenValue);
      });
    });

    context('when successful, batch of tokens', function () {
      const batch = true;
      const tokenIds = [1n, 2n, 3n];
      const amounts = [10n, 10n, 10n];
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]', 'uint256[]'], [batch, tokenIds, amounts]);
      const tokenValue = 30n;

      beforeEach(async function () {
        this.receipt = await this.contract.connect(alice).stake(stakeData);
      });

      it('transfers the tokens to the pool', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'TransferBatch')
          .withArgs(await this.contract.getAddress(), alice.address, await this.contract.getAddress(), tokenIds, amounts);
      });

      it('emits a Staked event', async function () {
        const requiresTransfer = true;
        const modifiedStakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'bytes'], [requiresTransfer, stakeData]);
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, modifiedStakeData, tokenValue);
      });
    });
  });

  describe('onERC1155Received(address,address,uint256,uint256,bytes)', function () {
    it('reverts if called by another address than the staking token contract', async function () {
      await expect(this.contract.onERC1155Received(alice.address, alice.address, 1n, 1n, '0x')).to.be.revertedWithCustomError(
        this.contract,
        'InvalidToken',
      );
    });

    context('when successful', function () {
      const batch = false;
      const tokenId = 1n;
      const amount = 10n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256', 'uint256'], [batch, tokenId, amount]);
      const tokenValue = 10n;

      beforeEach(async function () {
        this.receipt = await this.stakingToken
          .connect(alice)
          .safeTransferFrom(alice.address, await this.contract.getAddress(), tokenId, amount, '0x');
      });

      it('transfers the token to the pool', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'TransferSingle')
          .withArgs(alice.address, alice.address, await this.contract.getAddress(), tokenId, amount);
      });

      it('emits a Staked event', async function () {
        const requiresTransfer = false;
        const modifiedStakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'bytes'], [requiresTransfer, stakeData]);
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, modifiedStakeData, tokenValue);
      });
    });
  });

  describe('onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)', function () {
    it('reverts if called by another address than the staking token contract', async function () {
      await expect(this.contract.onERC1155BatchReceived(alice.address, alice.address, [1n], [1n], '0x')).to.be.revertedWithCustomError(
        this.contract,
        'InvalidToken',
      );
    });

    context('when successful', function () {
      const batch = true;
      const tokenIds = [1n, 2n, 3n];
      const amounts = [10n, 10n, 10n];
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]', 'uint256[]'], [batch, tokenIds, amounts]);
      const tokenValue = 30n;

      beforeEach(async function () {
        this.receipt = await this.stakingToken
          .connect(alice)
          .safeBatchTransferFrom(alice.address, await this.contract.getAddress(), tokenIds, amounts, '0x');
      });

      it('transfers the token to the pool', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'TransferBatch')
          .withArgs(alice.address, alice.address, await this.contract.getAddress(), tokenIds, amounts);
      });

      it('emits a Staked event', async function () {
        const requiresTransfer = false;
        const modifiedStakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'bytes'], [requiresTransfer, stakeData]);
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, modifiedStakeData, tokenValue);
      });
    });
  });

  describe('withdraw(bytes)', function () {
    it('reverts with inconsistent array lengths for a batch', async function () {
      const batch = true;
      const tokenIds = [1n, 2n];
      const amounts = [10n, 10n, 10n];
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]', 'uint256[]'], [batch, tokenIds, amounts]);
      await expect(this.contract.connect(alice).withdraw(withdrawData)).to.be.revertedWithCustomError(this.contract, 'InconsistentArrayLengths');
    });

    it('reverts if the stakers has an insufficient balance, single token', async function () {
      const batch = false;
      const tokenId = 1n;
      const amount = 10n;
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256', 'uint256'], [batch, tokenId, amount]);
      await expect(this.contract.connect(alice).withdraw(withdrawData))
        .to.be.revertedWithCustomError(this.contract, 'NotEnoughBalance')
        .withArgs(alice.address, tokenId, amount, 0n);
    });

    it('reverts if the stakers has an insufficient balance, batch of tokens', async function () {
      const batch = true;
      const tokenIds = [1n];
      const amounts = [10n];
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]', 'uint256[]'], [batch, tokenIds, amounts]);
      await expect(this.contract.connect(alice).withdraw(withdrawData))
        .to.be.revertedWithCustomError(this.contract, 'NotEnoughBalance')
        .withArgs(alice.address, tokenIds[0], amounts[0], 0n);
    });

    context('when successful, single token', function () {
      const tokenId = 1n;
      const amount = 10n;
      const batch = false;
      const tokenValue = 10n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256', 'uint256'], [batch, tokenId, amount]);
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256', 'uint256'], [batch, tokenId, amount]);

      beforeEach(async function () {
        await this.contract.connect(alice).stake(stakeData);
        this.receipt = await this.contract.connect(alice).withdraw(withdrawData);
      });

      it('transfers the token to the staker', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'TransferSingle')
          .withArgs(await this.contract.getAddress(), await this.contract.getAddress(), alice.address, tokenId, amount);
      });

      it('emits a Withdrawn event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Withdrawn').withArgs(alice.address, withdrawData, tokenValue);
      });
    });

    context('when successful, batch of tokens', function () {
      const tokenIds = [1n, 2n, 3n];
      const amounts = [10n, 10n, 10n];
      const batch = true;
      const tokenValue = 30n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]', 'uint256[]'], [batch, tokenIds, amounts]);
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]', 'uint256[]'], [batch, tokenIds, amounts]);

      beforeEach(async function () {
        await this.contract.connect(alice).stake(stakeData);
        this.receipt = await this.contract.connect(alice).withdraw(withdrawData);
      });

      it('transfers the tokens to the staker', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'TransferBatch')
          .withArgs(await this.contract.getAddress(), await this.contract.getAddress(), alice.address, tokenIds, amounts);
      });

      it('emits a Withdrawn event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Withdrawn').withArgs(alice.address, withdrawData, tokenValue);
      });
    });
  });

  describe('claim()', function () {
    context('when successful', function () {
      const tokenId = 1n;
      const amount = 10n;
      const reward = 100000n;
      const duration = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256', 'uint256'], [false, tokenId, amount]);
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

  describe('__msgData()', function () {
    it('returns the msg.data', async function () {
      await this.contract.__msgData();
    });
  });
});
