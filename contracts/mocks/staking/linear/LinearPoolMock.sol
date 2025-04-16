// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LinearPool} from "./../../../staking/linear/LinearPool.sol";
import {LinearPoolReentrancyAttacker} from "./LinearPoolReentrancyAttacker.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";

contract LinearPoolMock is LinearPool {
    LinearPoolReentrancyAttacker public immutable REENTRANCY_ATTACKER;

    event ComputeStakeCalled(address staker, bytes stakeData);
    event ComputeWithdrawCalled(address staker, bytes withdrawData);
    event ComputeClaimCalled(address staker, uint256 reward);
    event ComputeAddRewardCalled(address rewarder, uint256 reward, uint256 dust);

    constructor(LinearPoolReentrancyAttacker reentrancyAttacker, IForwarderRegistry forwarderRegistry) LinearPool(forwarderRegistry) {
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

    function _computeClaim(address staker, uint256 reward) internal virtual override returns (bytes memory claimData) {
        claimData = abi.encode(reward);
        emit ComputeClaimCalled(staker, reward);
    }

    function _computeAddReward(address rewarder, uint256 reward, uint256 dust) internal virtual override {
        emit ComputeAddRewardCalled(rewarder, reward, dust);
    }

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
