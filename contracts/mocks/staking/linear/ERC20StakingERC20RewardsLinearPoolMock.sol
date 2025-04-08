// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LinearPool} from "./../../../staking/linear/LinearPool.sol";
import {ERC20StakingLinearPool} from "./../../../staking/linear/stake/ERC20StakingLinearPool.sol";
import {LinearPool_ERC20Rewards} from "./../../../staking/linear/reward/LinearPool_ERC20Rewards.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";

contract ERC20StakingERC20RewardsLinearPoolMock is ERC20StakingLinearPool, LinearPool_ERC20Rewards {
    constructor(
        IERC20 stakingToken,
        IERC20 rewardToken,
        address rewardHolder,
        IForwarderRegistry forwarderRegistry
    ) ERC20StakingLinearPool(stakingToken, forwarderRegistry) LinearPool_ERC20Rewards(rewardToken, rewardHolder) {}

    function _computeClaim(
        address staker,
        uint256 reward
    ) internal virtual override(LinearPool, LinearPool_ERC20Rewards) returns (bytes memory claimData) {
        return LinearPool_ERC20Rewards._computeClaim(staker, reward);
    }

    function _computeAddReward(address rewarder, uint256 reward, uint256 dust) internal virtual override(LinearPool, LinearPool_ERC20Rewards) {
        LinearPool_ERC20Rewards._computeAddReward(rewarder, reward, dust);
    }

    /// @inheritdoc LinearPool
    function _msgSender() internal view virtual override(Context, LinearPool) returns (address) {
        return LinearPool._msgSender();
    }

    /// @inheritdoc LinearPool
    function _msgData() internal view virtual override(Context, LinearPool) returns (bytes calldata) {
        return LinearPool._msgData();
    }
}
