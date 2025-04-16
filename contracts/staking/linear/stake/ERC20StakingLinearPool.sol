// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LinearPool} from "./../LinearPool.sol";
import {ERC20Receiver} from "./../../../token/ERC20/ERC20Receiver.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";

abstract contract ERC20StakingLinearPool is LinearPool, ERC20Receiver {
    using SafeERC20 for IERC20;

    IERC20 public immutable STAKING_TOKEN;

    error InvalidToken();

    constructor(IERC20 stakingToken, IForwarderRegistry forwarderRegistry) LinearPool(forwarderRegistry) {
        STAKING_TOKEN = stakingToken;
    }

    function onERC20Received(address, address from, uint256 value, bytes calldata) external virtual override returns (bytes4) {
        if (msg.sender != address(STAKING_TOKEN)) revert InvalidToken();
        bool requiresTransfer = false;
        _stake(from, abi.encode(requiresTransfer, abi.encode(value)));
        return this.onERC20Received.selector;
    }

    function stake(bytes calldata stakeData) public payable virtual override {
        // non-reentrancy check removed
        bool requiresTransfer = true;
        _stake(_msgSender(), abi.encode(requiresTransfer, stakeData));
    }

    function _computeStake(address staker, bytes memory stakeData) internal virtual override returns (uint256 stakePoints) {
        (bool requiresTransfer, bytes memory data) = abi.decode(stakeData, (bool, bytes));
        stakePoints = abi.decode(data, (uint256));
        if (requiresTransfer) {
            STAKING_TOKEN.safeTransferFrom(staker, address(this), stakePoints);
        }
    }

    function withdraw(bytes calldata withdrawData) public virtual override {
        // non-reentrancy check removed
        _withdraw(_msgSender(), withdrawData);
    }

    function _computeWithdraw(address staker, bytes memory withdrawData) internal virtual override returns (uint256 stakePoints) {
        stakePoints = abi.decode(withdrawData, (uint256));
        STAKING_TOKEN.safeTransfer(staker, stakePoints);
    }
}
