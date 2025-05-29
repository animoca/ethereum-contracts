// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ContractOwnership} from "./../../../access/ContractOwnership.sol";
import {ContractOwnershipStorage} from "./../../../access/libraries/ContractOwnershipStorage.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title LinearPool_ERC20Rewards
/// @notice A linear pool that allows for ERC20 rewards distribution.
// solhint-disable-next-line contract-name-capwords
abstract contract LinearPool_ERC20Rewards is ContractOwnership {
    using SafeERC20 for IERC20;
    using ContractOwnershipStorage for ContractOwnershipStorage.Layout;

    IERC20 public immutable REWARD_TOKEN;

    address public rewardHolder;

    event RewardHolderSet(address indexed rewardHolder);

    constructor(IERC20 rewardToken, address rewardHolder_) {
        REWARD_TOKEN = rewardToken;
        rewardHolder = rewardHolder_;
        emit RewardHolderSet(rewardHolder_);
    }

    /// @notice Sets the reward holder address.
    /// @dev Reverts with {NotContractOwner} if the sender is not the contract owner.
    /// @param rewardHolder_ The address of the reward holder.
    /// @dev Emits a {RewardHolderSet} event if the reward holder address is changed.
    function setRewardHolder(address rewardHolder_) external {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        if (rewardHolder_ != rewardHolder) {
            rewardHolder = rewardHolder_;
            emit RewardHolderSet(rewardHolder_);
        }
    }

    /// @notice Computes the claim data for a staker.
    function _computeClaim(address staker, uint256 reward) internal virtual returns (bytes memory claimData) {
        claimData = abi.encode(reward);
        REWARD_TOKEN.safeTransferFrom(rewardHolder, staker, reward);
    }

    function _computeAddReward(address rewarder, uint256 reward, uint256 dust) internal virtual {}
}
