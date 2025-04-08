// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ContractOwnership} from "./../../../access/ContractOwnership.sol";
import {ContractOwnershipStorage} from "./../../../access/libraries/ContractOwnershipStorage.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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

    function setRewardHolder(address rewardHolder_) external {
        ContractOwnershipStorage.layout().enforceIsContractOwner(_msgSender());
        if (rewardHolder_ != rewardHolder) {
            rewardHolder = rewardHolder_;
            emit RewardHolderSet(rewardHolder_);
        }
    }

    function _computeClaim(address staker, uint256 reward) internal virtual returns (bytes memory claimData) {
        claimData = abi.encode(reward);
        REWARD_TOKEN.safeTransferFrom(rewardHolder, staker, reward);
    }

    function _computeAddReward(address rewarder, uint256 reward, uint256 dust) internal virtual {}
}
