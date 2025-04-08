// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LinearPool} from "./../../../staking/linear/LinearPool.sol";
import {ERC1155StakingLinearPool} from "./../../../staking/linear/stake/ERC1155StakingLinearPool.sol";
import {LinearPool_ERC20Rewards} from "./../../../staking/linear/reward/LinearPool_ERC20Rewards.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IERC1155} from "./../../../token/ERC1155/interfaces/IERC1155.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";

contract ERC1155StakingERC20RewardsLinearPool is ERC1155StakingLinearPool, LinearPool_ERC20Rewards {
    constructor(
        IERC1155 stakingToken,
        IERC20 rewardToken,
        address rewardHolder,
        IForwarderRegistry forwarderRegistry
    ) ERC1155StakingLinearPool(stakingToken, forwarderRegistry) LinearPool_ERC20Rewards(rewardToken, rewardHolder) {}

    function _computeClaim(
        address staker,
        uint256 reward
    ) internal virtual override(LinearPool, LinearPool_ERC20Rewards) returns (bytes memory claimData) {
        return LinearPool_ERC20Rewards._computeClaim(staker, reward);
    }

    function _computeAddReward(address rewarder, uint256 reward, uint256 dust) internal virtual override(LinearPool, LinearPool_ERC20Rewards) {
        LinearPool_ERC20Rewards._computeAddReward(rewarder, reward, dust);
    }

    function _tokenValue(uint256, uint256 amount) internal view virtual override returns (uint256) {
        return amount;
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
