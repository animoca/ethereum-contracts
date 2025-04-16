// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ContractOwnership} from "./../../access/ContractOwnership.sol";
import {AccessControl} from "./../../access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ForwarderRegistryContextBase} from "./../../metatx/base/ForwarderRegistryContextBase.sol";
import {ForwarderRegistryContext} from "./../../metatx/ForwarderRegistryContext.sol";
import {AccessControlStorage} from "./../../access/libraries/AccessControlStorage.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILinearPool} from "./interfaces/ILinearPool.sol";
import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";

// design inspired from https://github.com/k06a/Unipool/blob/master/contracts/Unipool.sol

abstract contract LinearPool is ILinearPool, AccessControl, ReentrancyGuard, ForwarderRegistryContext {
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

    function lastTimeRewardApplicable() public view returns (uint256) {
        uint256 currentDistributionEnd = distributionEnd;
        return block.timestamp < currentDistributionEnd ? block.timestamp : currentDistributionEnd;
    }

    function rewardPerStakePoint() public view returns (uint256) {
        uint256 currentTotalStaked = totalStaked;
        if (currentTotalStaked == 0) {
            return rewardPerStakePointStored;
        }
        return rewardPerStakePointStored + (((lastTimeRewardApplicable() - lastUpdated) * rewardRate * SCALING_FACTOR) / currentTotalStaked);
    }

    function earned(address account) public view returns (uint256) {
        return (staked[account] * (rewardPerStakePoint() - rewardPerStakePointPaid[account])) / SCALING_FACTOR + rewards[account];
    }

    function stake(bytes calldata stakeData) public payable virtual nonReentrant {
        _stake(_msgSender(), stakeData);
    }

    function _stake(address staker, bytes memory stakeData) internal virtual {
        _updateReward(staker);
        uint256 stakePoints = _computeStake(staker, stakeData);
        require(stakePoints != 0, InvalidStakeAmount());
        totalStaked += stakePoints;
        staked[staker] += stakePoints;
        emit Staked(staker, stakeData, stakePoints);
    }

    function withdraw(bytes calldata withdrawData) public virtual nonReentrant {
        _withdraw(_msgSender(), withdrawData);
    }

    function _withdraw(address staker, bytes memory withdrawData) internal virtual {
        _updateReward(staker);
        uint256 stakePoints = _computeWithdraw(staker, withdrawData);
        require(stakePoints != 0, InvalidWithdrawAmount());
        uint256 currentStaked = staked[staker];
        require(currentStaked >= stakePoints, NotEnoughStake(staker, currentStaked, stakePoints));
        unchecked {
            // no underflow possible
            staked[staker] -= stakePoints;
            totalStaked = currentStaked - stakePoints;
        }
        emit Withdrawn(staker, withdrawData, stakePoints);
    }

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

    function addReward(uint256 reward, uint256 duration) public payable virtual {
        address rewarder = _msgSender();
        AccessControlStorage.layout().enforceHasRole(REWARDER_ROLE, rewarder);

        require(reward != 0, InvalidRewardAmount());
        require(duration != 0, InvalidDuration());

        _updateReward(address(0));

        uint256 dust;
        uint256 currentDistributionEnd = distributionEnd;
        uint256 newDisributionEnd = block.timestamp + duration;

        if (block.timestamp >= currentDistributionEnd) {
            // No current distribution
            uint256 newRewardRate = reward / duration;
            require(newRewardRate != 0, RewardTooSmallForDuration(reward, duration));
            rewardRate = newRewardRate;
            dust = reward % duration;
            distributionEnd = newDisributionEnd;
        } else {
            if (newDisributionEnd <= currentDistributionEnd) {
                // New distribution ends before current distribution
                duration = currentDistributionEnd - block.timestamp;
                uint256 additionalRewardRate = reward / duration;
                require(additionalRewardRate != 0, RewardTooSmallForDuration(reward, duration));
                rewardRate += additionalRewardRate;
                dust = reward % duration;
            } else {
                // New distribution ends after current distribution
                require(reward / duration != 0, RewardTooSmallForDuration(reward, duration));
                uint256 remainingReward = rewardRate * (currentDistributionEnd - block.timestamp);
                uint256 totalReward = remainingReward + reward;
                rewardRate = totalReward / duration;
                dust = totalReward % duration;
                distributionEnd = newDisributionEnd;
            }
        }
        lastUpdated = block.timestamp;

        _computeAddReward(rewarder, reward, dust);

        emit RewardAdded(rewarder, reward, duration, dust);
    }

    function _computeStake(address sender, bytes memory stakeData) internal virtual returns (uint256 stakePoints);

    function _computeWithdraw(address sender, bytes memory withdrawData) internal virtual returns (uint256 stakePoints);

    function _computeClaim(address sender, uint256 reward) internal virtual returns (bytes memory claimData);

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
