// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LinearPool} from "./../../../staking/linear/LinearPool.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";

contract LinearPoolClaimRemainderMock is LinearPool {
    event ClaimTransferred(uint256 totalReward, uint256 transferredReward);

    constructor(uint8 scalingFactorDecimals, IForwarderRegistry forwarderRegistry) LinearPool(scalingFactorDecimals, forwarderRegistry) {}

    function _computeStake(address, bytes memory stakeData) internal virtual override returns (uint256 stakePoints) {
        stakePoints = abi.decode(stakeData, (uint256));
    }

    function _computeWithdraw(address, bytes memory withdrawData) internal virtual override returns (uint256 stakePoints) {
        stakePoints = abi.decode(withdrawData, (uint256));
    }

    function _computeClaim(address, uint256 claimable, bytes calldata) internal virtual override returns (uint256 claimed, uint256 unclaimed) {
        claimed = claimable - 1;
        unclaimed = 1;
    }

    function _computeAddReward(address rewarder, uint256 reward) internal virtual override {}
}
