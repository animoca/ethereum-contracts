// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/// @title ERC20 Token Standard, basic interface (events).
/// @dev See https://eips.ethereum.org/EIPS/eip-20
/// @dev Note: The ERC-165 identifier for this interface is 0x36372b07.
interface IERC20Events {
    /// @notice Emitted when tokens are transferred, including zero value transfers.
    /// @param from The account where the transferred tokens are withdrawn from.
    /// @param to The account where the transferred tokens are deposited to.
    /// @param value The amount of tokens being transferred.
    event Transfer(address indexed from, address indexed to, uint256 value);

    /// @notice Emitted when an approval is set.
    /// @param owner The account granting an allowance to `spender`.
    /// @param spender The account being granted an allowance from `owner`.
    /// @param value The allowance amount being granted.
    event Approval(address indexed owner, address indexed spender, uint256 value);
}