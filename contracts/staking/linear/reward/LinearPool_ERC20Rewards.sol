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

    /// @dev Emits a {RewardHolderSet} event with the initial reward holder address.
    /// @param rewardToken The ERC20 token used for rewards.
    /// @param rewardHolder_ The address that holds the rewards.
    constructor(IERC20 rewardToken, address rewardHolder_) {
        REWARD_TOKEN = rewardToken;
        rewardHolder = rewardHolder_;
        emit RewardHolderSet(rewardHolder_);
    }

    /// @notice Sets the reward holder address.
    /// @dev Reverts with {NotContractOwner} if the sender is not the contract owner.
    /// @dev Emits a {RewardHolderSet} event if the reward holder address is changed.
    /// @param rewardHolder_ The address of the reward holder.
    function setRewardHolder(address rewardHolder_) external {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        if (rewardHolder_ != rewardHolder) {
            rewardHolder = rewardHolder_;
            emit RewardHolderSet(rewardHolder_);
        }
    }

    /// @notice Transfers `reward` amount of REWARD_TOKEN from the reward holder to the staker.
    /// @param staker The address of the staker.
    /// @param reward The amount of REWARD_TOKEN to be transferred.
    /// @return claimData The data to be used for claiming the reward, encoded as (uint256 reward).
    function _computeClaim(address staker, uint256 reward) internal virtual returns (bytes memory claimData) {
        claimData = abi.encode(reward);
        REWARD_TOKEN.safeTransferFrom(rewardHolder, staker, reward);
    }

    /// @notice Computes the reward for a staker.
    /// @dev This function is empty since the rewards do not need to be transferred to this contract.
    function _computeAddReward(address, uint256, uint256) internal virtual {}
}
