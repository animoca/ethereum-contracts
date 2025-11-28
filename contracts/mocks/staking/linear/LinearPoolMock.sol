// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LinearPool} from "./../../../staking/linear/LinearPool.sol";
import {LinearPoolReentrancyAttacker} from "./LinearPoolReentrancyAttacker.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";

contract LinearPoolMock is LinearPool {
    LinearPoolReentrancyAttacker public immutable REENTRANCY_ATTACKER;

    event ComputeStakeCalled(address staker, bytes stakeData);
    event ComputeWithdrawCalled(address staker, bytes withdrawData);
    event ComputeClaimCalled(address staker, uint256 claimable, bytes claimData);
    event ComputeAddRewardCalled(address rewarder, uint256 reward);

    constructor(
        LinearPoolReentrancyAttacker reentrancyAttacker,
        uint8 scalingFactorDecimals,
        IForwarderRegistry forwarderRegistry
    ) LinearPool(scalingFactorDecimals, forwarderRegistry) {
        REENTRANCY_ATTACKER = reentrancyAttacker;
    }

    function _computeStake(address staker, bytes memory stakeData) internal virtual override returns (uint256 stakePoints) {
        stakePoints = abi.decode(stakeData, (uint256));
        REENTRANCY_ATTACKER.stake(stakeData);
        emit ComputeStakeCalled(staker, stakeData);
    }

    function _computeWithdraw(address staker, bytes memory withdrawData) internal virtual override returns (uint256 stakePoints) {
        stakePoints = abi.decode(withdrawData, (uint256));
        REENTRANCY_ATTACKER.withdraw(withdrawData);
        emit ComputeWithdrawCalled(staker, withdrawData);
    }

    function _computeClaim(
        address staker,
        uint256 claimable,
        bytes calldata claimData
    ) internal virtual override returns (uint256 claimed, uint256 unclaimed) {
        claimed = claimable;
        unclaimed = 0;
        REENTRANCY_ATTACKER.claim(claimData);
        emit ComputeClaimCalled(staker, claimable, claimData);
    }

    function _computeAddReward(address rewarder, uint256 reward) internal virtual override {
        emit ComputeAddRewardCalled(rewarder, reward);
    }

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
