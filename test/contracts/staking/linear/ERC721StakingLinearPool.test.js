const {ethers} = require('hardhat');
const {expect} = require('chai');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');
const {time} = require('@nomicfoundation/hardhat-network-helpers');

describe('ERC721StakingLinearPool', function () {
  let deployer, rewarder, holder, alice;

  before(async function () {
    [deployer, rewarder, holder, alice] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.stakingToken = await deployContract('ERC721Full', '', '', ethers.ZeroAddress, ethers.ZeroAddress, await getForwarderRegistryAddress());
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
      'ERC721StakingERC20RewardsLinearPoolMock',
      await this.stakingToken.getAddress(),
      await this.rewardToken.getAddress(),
      holder.address,
      await getForwarderRegistryAddress(),
    );
    this.rewarderRole = await this.contract.REWARDER_ROLE();
    await this.contract.grantRole(this.rewarderRole, rewarder.address);
    await this.rewardToken.connect(holder).approve(await this.contract.getAddress(), ethers.MaxUint256);
    await this.stakingToken.grantRole(await this.stakingToken.MINTER_ROLE(), deployer.address);
    await this.stakingToken.batchMint(alice.address, [1, 2, 3]);
    await this.stakingToken.connect(alice).setApprovalForAll(await this.contract.getAddress(), true);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('stake(bytes)', function () {
    context('when successful, single token', function () {
      const batch = false;
      const tokenId = 1n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256'], [batch, tokenId]);
      const tokenValue = 1n;

      beforeEach(async function () {
        this.receipt = await this.contract.connect(alice).stake(stakeData);
      });

      it('transfers the token to the pool', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'Transfer')
          .withArgs(alice.address, await this.contract.getAddress(), tokenId);
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
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]'], [batch, tokenIds]);
      const tokenValue = 3n;

      beforeEach(async function () {
        this.receipt = await this.contract.connect(alice).stake(stakeData);
      });

      it('transfers the tokens to the pool', async function () {
        for (const tokenId of tokenIds) {
          await expect(this.receipt)
            .to.emit(this.stakingToken, 'Transfer')
            .withArgs(alice.address, await this.contract.getAddress(), tokenId);
        }
      });

      it('emits a Staked event', async function () {
        const requiresTransfer = true;
        const modifiedStakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'bytes'], [requiresTransfer, stakeData]);
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, modifiedStakeData, tokenValue);
      });
    });
  });

  describe('onERC721Received(address,address,uint256,bytes)', function () {
    it('reverts if called by another address than the staking token contract', async function () {
      await expect(this.contract.onERC721Received(alice.address, alice.address, 1n, '0x')).to.be.revertedWithCustomError(
        this.contract,
        'InvalidToken',
      );
    });
    context('when successful', function () {
      const batch = false;
      const tokenId = 1n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256'], [batch, tokenId]);
      const tokenValue = 1n;

      beforeEach(async function () {
        this.receipt = await this.stakingToken
          .connect(alice)
          ['safeTransferFrom(address,address,uint256,bytes)'](alice.address, await this.contract.getAddress(), tokenId, '0x');
      });

      it('transfers the token to the pool', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'Transfer')
          .withArgs(alice.address, await this.contract.getAddress(), tokenId);
      });

      it('emits a Staked event', async function () {
        const requiresTransfer = false;
        const modifiedStakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'bytes'], [requiresTransfer, stakeData]);
        await expect(this.receipt).to.emit(this.contract, 'Staked').withArgs(alice.address, modifiedStakeData, tokenValue);
      });
    });
  });

  describe('withdraw(bytes)', function () {
    it('reverts if the caller is not the token owner, single token', async function () {
      const batch = false;
      const tokenId = 1n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256'], [batch, tokenId]);
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256'], [batch, tokenId]);
      await this.contract.connect(alice).stake(stakeData);
      await expect(this.contract.connect(holder).withdraw(withdrawData))
        .to.be.revertedWithCustomError(this.contract, 'NotTheTokenOwner')
        .withArgs(holder.address, tokenId, alice.address);
    });

    it('reverts if the caller is not the token owner, batch of tokens', async function () {
      const batch = true;
      const tokenIds = [1n, 2n, 3n];
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]'], [batch, tokenIds]);
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]'], [batch, tokenIds]);
      await this.contract.connect(alice).stake(stakeData);
      await expect(this.contract.connect(holder).withdraw(withdrawData))
        .to.be.revertedWithCustomError(this.contract, 'NotTheTokenOwner')
        .withArgs(holder.address, tokenIds[0], alice.address);
    });

    context('when successful, single token', function () {
      const tokenId = 1n;
      const batch = false;
      const tokenValue = 1n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256'], [batch, tokenId]);
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256'], [batch, tokenId]);

      beforeEach(async function () {
        await this.contract.connect(alice).stake(stakeData);
        this.receipt = await this.contract.connect(alice).withdraw(withdrawData);
      });

      it('transfers the token to the staker', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'Transfer')
          .withArgs(await this.contract.getAddress(), alice.address, tokenId);
      });

      it('emits a Withdrawn event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Withdrawn').withArgs(alice.address, withdrawData, tokenValue);
      });
    });

    context('when successful, batch of tokens', function () {
      const tokenIds = [1n, 2n, 3n];
      const batch = true;
      const tokenValue = 3n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]'], [batch, tokenIds]);
      const withdrawData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256[]'], [batch, tokenIds]);

      beforeEach(async function () {
        await this.contract.connect(alice).stake(stakeData);
        this.receipt = await this.contract.connect(alice).withdraw(withdrawData);
      });

      it('transfers the tokens to the staker', async function () {
        for (const tokenId of tokenIds) {
          await expect(this.receipt)
            .to.emit(this.stakingToken, 'Transfer')
            .withArgs(await this.contract.getAddress(), alice.address, tokenId);
        }
      });

      it('emits a Withdrawn event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Withdrawn').withArgs(alice.address, withdrawData, tokenValue);
      });
    });
  });

  describe('claim()', function () {
    context('when successful', function () {
      const tokenId = 1n;
      const reward = 100000n;
      const duration = 100n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256'], [false, tokenId]);
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

  describe('recoverERC721s(address[],IERC721[],uint256[])', function () {
    it('reverts with inconsistent array lengths', async function () {
      await expect(this.contract.recoverERC721s([], [], [1n])).to.be.revertedWithCustomError(this.contract, 'InconsistentArrayLengths');
    });

    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(alice).recoverERC721s([], [], []))
        .to.be.revertedWithCustomError(this.contract, 'NotContractOwner')
        .withArgs(alice.address);
    });

    it('reverts if trying to recover staking tokens which were staked', async function () {
      const tokenId = 1n;
      const stakeData = ethers.AbiCoder.defaultAbiCoder().encode(['bool', 'uint256'], [false, tokenId]);
      await this.contract.connect(alice).stake(stakeData);
      await expect(this.contract.recoverERC721s([alice.address], [await this.stakingToken.getAddress()], [tokenId]))
        .to.be.revertedWithCustomError(this.contract, 'InvalidRecoveryToken')
        .withArgs(tokenId);
    });

    context('when successful', function () {
      const tokenId = 1n;
      let otherToken;

      beforeEach(async function () {
        otherToken = await deployContract('ERC721Full', '', '', ethers.ZeroAddress, ethers.ZeroAddress, await getForwarderRegistryAddress());
        await otherToken.grantRole(await otherToken.MINTER_ROLE(), deployer.address);
        await otherToken.batchMint(alice.address, [tokenId]);

        await this.stakingToken.connect(alice).transferFrom(alice.address, await this.contract.getAddress(), tokenId);
        await otherToken.connect(alice).transferFrom(alice.address, await this.contract.getAddress(), tokenId);
        this.receipt = await this.contract.recoverERC721s(
          [alice.address, alice.address],
          [await this.stakingToken.getAddress(), await otherToken.getAddress()],
          [tokenId, tokenId],
        );
      });

      it('recovers the token', async function () {
        await expect(this.receipt)
          .to.emit(this.stakingToken, 'Transfer')
          .withArgs(await this.contract.getAddress(), alice.address, tokenId);

        await expect(this.receipt)
          .to.emit(otherToken, 'Transfer')
          .withArgs(await this.contract.getAddress(), alice.address, tokenId);
      });
    });
  });

  describe('__msgData()', function () {
    it('returns the msg.data', async function () {
      await this.contract.__msgData();
    });
  });
});
