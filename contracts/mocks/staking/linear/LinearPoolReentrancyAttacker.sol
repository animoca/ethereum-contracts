// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ILinearPool} from "./../../../staking/linear/interfaces/ILinearPool.sol";

contract LinearPoolReentrancyAttacker {
    ILinearPool public target;

    function setTarget(address targetAddress) external {
        target = ILinearPool(targetAddress);
    }

    function stake(bytes calldata stakeData) external {
        if (address(target) != address(0)) {
            target.stake(stakeData);
        }
    }

    function withdraw(bytes calldata withdrawData) external {
        if (address(target) != address(0)) {
            target.withdraw(withdrawData);
        }
    }
}
