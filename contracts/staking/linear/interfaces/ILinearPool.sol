// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface ILinearPool {
    function lastTimeRewardApplicable() external view returns (uint256);

    function rewardPerStakePoint() external view returns (uint256);

    function earned(address account) external view returns (uint256);

    function stake(bytes calldata stakeData) external payable;

    function withdraw(bytes calldata withdrawData) external;

    function claim() external;

    function addReward(uint256 reward, uint256 duration) external payable;
}
