// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ContractOwnership} from "./../../access/ContractOwnership.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {TokenRecovery} from "./../../security/TokenRecovery.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/base/ForwarderRegistryContextBase.sol";
import {ForwarderRegistryContext} from "./../../metatx/ForwarderRegistryContext.sol";
import {AccessControlStorage} from "./../../access/libraries/AccessControlStorage.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILinearPool} from "./interfaces/ILinearPool.sol";
import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";

// design inspired from https://github.com/k06a/Unipool/blob/master/contracts/Unipool.sol

/// @title Linear rewards distribution staking pool.
/// @notice Implements the base logic for linear reward pools, while the nature of the staking and rewards is left to the deriving contracts.
/// @notice Stakes, whether fungible or non-fungible, map to an amount of "stake points", then used to compute the user rewards share.
/// @notice NB: This contract inherits TokenRecovery functions. In the likely event that the deriving contract does keep tokens in stake,
/// @notice the corresponding functions must be overriden to prevent recovering tokens legitimately staked in the contract.
abstract contract LinearPool is ILinearPool, AccessControl, ReentrancyGuard, TokenRecovery, ForwarderRegistryContext {
    using AccessControlStorage for AccessControlStorage.Layout;
    using SafeERC20 for IERC20;

    bytes32 public constant REWARDER_ROLE = "rewarder";
    uint256 public constant SCALING_FACTOR = 1e18;

    uint256 public totalStaked;
    uint256 public lastUpdated;
    uint256 public rewardRate;
    uint256 public rewardPerStakePointStored;
    uint256 public distributionEnd;

    mapping(address staker => uint256 stakePoints) public staked;
    mapping(address staker => uint256 reward) public rewards;
    mapping(address staker => uint256 paid) public rewardPerStakePointPaid;

    event Staked(address indexed staker, bytes stakeData, uint256 stakePoints);
    event Withdrawn(address indexed staker, bytes withdrawData, uint256 stakePoints);
    event Claimed(address indexed staker, bytes claimData, uint256 reward);
    event RewardAdded(address indexed rewarder, uint256 reward, uint256 duration, uint256 dust);

    error InvalidStakeAmount();
    error InvalidWithdrawAmount();
    error NotEnoughStake(address staker, uint256 stake, uint256 withdraw);
    error InvalidRewardAmount();
    error InvalidDuration();
    error RewardTooSmallForDuration(uint256 reward, uint256 duration);
    error RewardDilution(uint256 currentRewardRate, uint256 newRewardRate);

    constructor(IForwarderRegistry forwarderRegistry) ContractOwnership(msg.sender) ForwarderRegistryContext(forwarderRegistry) {}

    function _updateReward(address account) internal {
        rewardPerStakePointStored = rewardPerStakePoint();
        if (block.timestamp >= distributionEnd || totalStaked != 0) {
            // ensure rewards before the first staker do not get lost
            lastUpdated = lastTimeRewardApplicable();
        }
        if (account != address(0)) {
            rewards[account] = earned(account);
            rewardPerStakePointPaid[account] = rewardPerStakePointStored;
        }
    }

    /// @notice Returns the last time rewards are applicable.
    /// @return The minimum of the current block timestamp and the distribution end.
    function lastTimeRewardApplicable() public view returns (uint256) {
        uint256 currentDistributionEnd = distributionEnd;
        return block.timestamp < currentDistributionEnd ? block.timestamp : currentDistributionEnd;
    }

    /// @notice Returns the current reward per stake point.
    /// @return The sum of the last stored value and the new rewards since the last update
    function rewardPerStakePoint() public view returns (uint256) {
        uint256 currentTotalStaked = totalStaked;
        if (currentTotalStaked == 0) {
            return rewardPerStakePointStored;
        }
        return rewardPerStakePointStored + (((lastTimeRewardApplicable() - lastUpdated) * rewardRate * SCALING_FACTOR) / currentTotalStaked);
    }

    /// @notice Returns the amount of rewards earned by the account.
    /// @return The account's stake points times the difference between the current reward per stake point and the last paid reward per stake point.
    /// @param account The address of the account to check.
    function earned(address account) public view returns (uint256) {
        return (staked[account] * (rewardPerStakePoint() - rewardPerStakePointPaid[account])) / SCALING_FACTOR + rewards[account];
    }

    /// @notice Stakes to the pool.
    /// @dev Reverts with {ReentrancyGuardReentrantCall} if the function is re-entered.
    /// @dev Reverts with {InvalidStakeAmount} if the stake amount is 0.
    /// @dev Emits a {Staked} event with the staker address, stakeData and stake points.
    /// @dev The stakeData is passed to the _computeStake function, which must be implemented in the deriving contract.
    /// @param stakeData The data to be used for the stake (encoding freely determined by the deriving contracts).
    function stake(bytes calldata stakeData) public payable virtual {
        _stake(_msgSender(), stakeData);
    }

    /// @notice Stakes to the pool.
    /// NB: If a reward is ongoing while there are no stakers, the accumulated rewards so far will go to the first staker.
    /// @dev Reverts with {ReentrancyGuardReentrantCall} if the function is re-entered.
    /// @dev Reverts with {InvalidStakeAmount} if the stake amount is 0.
    /// @dev Emits a {Staked} event with the staker address, stakeData and stake points.
    /// @dev The stakeData is passed to the _computeStake function, which must be implemented in the deriving contract.
    /// @param staker The address of the staker.
    /// @param stakeData The data to be used for the stake (encoding freely determined by the deriving contracts).
    function _stake(address staker, bytes memory stakeData) internal virtual nonReentrant {
        _updateReward(staker);
        uint256 stakePoints = _computeStake(staker, stakeData);
        require(stakePoints != 0, InvalidStakeAmount());
        totalStaked += stakePoints;
        staked[staker] += stakePoints;
        emit Staked(staker, stakeData, stakePoints);
    }

    /// @notice Withdraws from the pool.
    /// @dev Reverts with {ReentrancyGuardReentrantCall} if the function is re-entered.
    /// @dev Reverts with {InvalidWithdrawAmount} if the withdraw amount is 0.
    /// @dev Reverts with {NotEnoughStake} if the staker does not have enough stake points to withdraw.
    /// @dev Emits a {Withdrawn} event with the staker address, withdrawData and stake points.
    /// @dev The withdrawData is passed to the _computeWithdraw function, which must be implemented in the deriving contract.
    /// @param withdrawData The data to be used for the withdraw (encoding freely determined by the deriving contracts).
    function withdraw(bytes calldata withdrawData) public virtual {
        _withdraw(_msgSender(), withdrawData);
    }

    /// @notice Withdraws from the pool.
    /// @dev Reverts with {ReentrancyGuardReentrantCall} if the function is re-entered.
    /// @dev Reverts with {InvalidWithdrawAmount} if the withdraw amount is 0.
    /// @dev Reverts with {NotEnoughStake} if the staker does not have enough stake points to withdraw.
    /// @dev Emits a {Withdrawn} event with the staker address, withdrawData and stake points.
    /// @dev The withdrawData is passed to the _computeWithdraw function, which must be implemented in the deriving contract.
    /// @param staker The address of the staker.
    /// @param withdrawData The data to be used for the withdraw (encoding freely determined by the deriving contracts).
    function _withdraw(address staker, bytes memory withdrawData) internal virtual nonReentrant {
        _updateReward(staker);
        uint256 stakePoints = _computeWithdraw(staker, withdrawData);
        require(stakePoints != 0, InvalidWithdrawAmount());
        uint256 currentStaked = staked[staker];
        require(currentStaked >= stakePoints, NotEnoughStake(staker, currentStaked, stakePoints));
        unchecked {
            // no underflow possible
            staked[staker] = currentStaked - stakePoints;
            totalStaked -= stakePoints;
        }
        emit Withdrawn(staker, withdrawData, stakePoints);
    }

    /// @notice Claims the rewards for the sender.
    /// @dev Emits a {Claimed} event with the staker address, claimData and reward.
    /// @dev The claimData is generated by the _computeClaim function, which must be implemented in the deriving contract.
    function claim() public virtual {
        address staker = _msgSender();
        _updateReward(staker);
        uint256 reward = earned(staker);
        if (reward != 0) {
            rewards[staker] = 0;
            bytes memory claimData = _computeClaim(staker, reward);
            emit Claimed(staker, claimData, reward);
        }
    }

    /// @notice Adds rewards to the pool.
    /// @notice If there is an ongoing distribution, the new rewards are added to the current distribution:
    /// @notice - If the new distribution ends before the current one, the new rewards are added to the current distribution.
    /// @notice - If the new distribution ends after the current one, the remaining rewards are added to the new distribution.
    /// @notice NB: Any dust (remainder of the division of the reward by the duration) will not be distributed.
    /// @dev Reverts with {NotRoleHolder} if the sender does not have the REWARDER_ROLE.
    /// @dev Reverts with {InvalidRewardAmount} if the reward amount is 0.
    /// @dev Reverts with {InvalidDuration} if the duration is 0.
    /// @dev Reverts with {RewardTooSmallForDuration} if the reward is too small for the duration.
    /// @dev Reverts with {RewardDilution} if the new reward rate is lower than the current one.
    /// @dev Emits a {RewardAdded} event with the rewarder address, reward amount, duration and dust.
    /// @param reward The amount of rewards to be added.
    /// @param duration The duration of the rewards distribution.
    function addReward(uint256 reward, uint256 duration) public payable virtual {
        address rewarder = _msgSender();
        AccessControlStorage.layout().enforceHasRole(REWARDER_ROLE, rewarder);

        require(reward != 0, InvalidRewardAmount());
        require(duration != 0, InvalidDuration());

        _updateReward(address(0));

        uint256 dust;
        uint256 currentDistributionEnd = distributionEnd;
        uint256 newDisrtibutionEnd = block.timestamp + duration;

        if (block.timestamp >= currentDistributionEnd) {
            // No current distribution
            uint256 newRewardRate = reward / duration;
            require(newRewardRate != 0, RewardTooSmallForDuration(reward, duration));
            rewardRate = newRewardRate;
            dust = reward % duration;
            distributionEnd = newDisrtibutionEnd;
        } else {
            if (newDisrtibutionEnd <= currentDistributionEnd) {
                // New distribution ends before current distribution
                duration = currentDistributionEnd - block.timestamp;
                uint256 additionalRewardRate = reward / duration;
                require(additionalRewardRate != 0, RewardTooSmallForDuration(reward, duration));
                rewardRate += additionalRewardRate;
                dust = reward % duration;
            } else {
                // New distribution ends after current distribution
                require(reward / duration != 0, RewardTooSmallForDuration(reward, duration));
                uint256 currentRewardRate = rewardRate;
                uint256 remainingReward = currentRewardRate * (currentDistributionEnd - block.timestamp);
                uint256 totalReward = remainingReward + reward;
                uint256 newRewardRate = totalReward / duration;
                require(newRewardRate >= currentRewardRate, RewardDilution(currentRewardRate, newRewardRate));
                rewardRate = newRewardRate;
                distributionEnd = newDisrtibutionEnd;
                dust = totalReward % duration;
            }
        }
        lastUpdated = block.timestamp;

        _computeAddReward(rewarder, reward, dust);

        emit RewardAdded(rewarder, reward, duration, dust);
    }

    /// @notice Performs a stake (deposit some asset in the pool), for example by transferring staking tokens to this contract.
    /// @notice Computes the amount of stake points for the sender based on the stakeData.
    /// @param sender The address of the sender.
    /// @param stakeData The data to be used for the stake (encoding freely determined by the deriving contracts).
    /// @return stakePoints The amount of stake points computed from the stakeData.
    function _computeStake(address sender, bytes memory stakeData) internal virtual returns (uint256 stakePoints);

    /// @notice Performs a withdrawal (remove some asset from the pool), for example by transferring taking tokens from this contract.
    /// @notice Computes the amount of stake points for the sender based on the withdrawData.
    /// @param sender The address of the sender.
    /// @param withdrawData The data to be used for the withdraw (encoding freely determined by the deriving contracts).
    /// @return stakePoints The amount of stake points computed from the withdrawData.
    function _computeWithdraw(address sender, bytes memory withdrawData) internal virtual returns (uint256 stakePoints);

    /// @notice Performs a claim, for examples by transferring reward tokens to the sender.
    /// @param sender The address of the sender.
    /// @param reward The amount of rewards to be claimed.
    /// @return claimData The data used in the claim process (encoding freely determined by the deriving contracts).
    function _computeClaim(address sender, uint256 reward) internal virtual returns (bytes memory claimData);

    /// @notice Performs addition of rewards to the pool, for example by transferring rewards tokens to this contract.
    /// @param sender The address of the sender.
    /// @param reward The amount of rewards to be added.
    /// @param dust The amount of dust (remainder of the division of the reward by the duration).
    function _computeAddReward(address sender, uint256 reward, uint256 dust) internal virtual;

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgSender() internal view virtual override(Context, ForwarderRegistryContextBase) returns (address) {
        return ForwarderRegistryContextBase._msgSender();
    }

    /// @inheritdoc ForwarderRegistryContextBase
    function _msgData() internal view virtual override(Context, ForwarderRegistryContextBase) returns (bytes calldata) {
        return ForwarderRegistryContextBase._msgData();
    }
}
