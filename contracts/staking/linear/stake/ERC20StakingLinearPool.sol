// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LinearPool} from "./../LinearPool.sol";
import {ERC20Receiver} from "./../../../token/ERC20/ERC20Receiver.sol";
import {TokenRecoveryBase} from "./../../../security/base/TokenRecoveryBase.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";

/// @title ERC20StakingLinearPool
/// @notice A linear pool that allows staking of ERC20 tokens.
/// @notice WARNING: This contract is not compatible with fee-on-transfer and rebasing tokens.
abstract contract ERC20StakingLinearPool is LinearPool, ERC20Receiver {
    using SafeERC20 for IERC20;

    IERC20 public immutable STAKING_TOKEN;

    error InvalidToken();
    error InvalidRecoveryAmount(uint256 requested, uint256 recoverable);

    constructor(IERC20 stakingToken, IForwarderRegistry forwarderRegistry) LinearPool(forwarderRegistry) {
        STAKING_TOKEN = stakingToken;
    }

    /// @notice Callback called when the contract receives ERC20 tokens via the IERC20SafeTransfers functions.
    /// @dev Reverts  with {InvalidToken} if the sender is not the staking token.
    /// @param from The address of the sender.
    /// @param value The amount of tokens received.
    /// @return bytes4 The function selector of the callback.
    function onERC20Received(address, address from, uint256 value, bytes calldata) external virtual override returns (bytes4) {
        if (msg.sender != address(STAKING_TOKEN)) revert InvalidToken();
        bool requiresTransfer = false;
        _stake(from, abi.encode(requiresTransfer, abi.encode(value)));
        return this.onERC20Received.selector;
    }

    /// @inheritdoc LinearPool
    /// @param stakeData The data to be used for staking, encoded as (uint256 value)
    function stake(bytes calldata stakeData) public payable virtual override {
        bool requiresTransfer = true;
        _stake(_msgSender(), abi.encode(requiresTransfer, stakeData));
    }

    /// @inheritdoc LinearPool
    /// @param stakeData The data to be used for staking, encoded as (bool requiresTransfer, bytes data) where data is (uint256 value).
    function _computeStake(address staker, bytes memory stakeData) internal virtual override returns (uint256 stakePoints) {
        (bool requiresTransfer, bytes memory data) = abi.decode(stakeData, (bool, bytes));
        stakePoints = abi.decode(data, (uint256));
        if (requiresTransfer) {
            STAKING_TOKEN.safeTransferFrom(staker, address(this), stakePoints);
        }
    }

    /// @inheritdoc LinearPool
    /// @param withdrawData The data to be used for withdrawing, encoded as (uint256 value)
    function _computeWithdraw(address staker, bytes memory withdrawData) internal virtual override returns (uint256 stakePoints) {
        stakePoints = abi.decode(withdrawData, (uint256));
        STAKING_TOKEN.safeTransfer(staker, stakePoints);
    }

    /// @inheritdoc TokenRecoveryBase
    /// @dev Reverts with {InvalidRecoveryAmount} if recovering some STAKING_TOKEN in greater quatity than what is recoverable.
    function recoverERC20s(address[] calldata accounts, IERC20[] calldata tokens, uint256[] calldata amounts) public virtual override {
        uint256 stakingTokenRecoveryAmount;
        for (uint256 i; i < tokens.length; ++i) {
            if (tokens[i] == STAKING_TOKEN) {
                stakingTokenRecoveryAmount += amounts[i];
            }
        }
        if (stakingTokenRecoveryAmount != 0) {
            uint256 recoverable = STAKING_TOKEN.balanceOf(address(this)) - totalStaked;
            if (stakingTokenRecoveryAmount > recoverable) {
                revert InvalidRecoveryAmount(stakingTokenRecoveryAmount, recoverable);
            }
        }
        super.recoverERC20s(accounts, tokens, amounts);
    }
}
