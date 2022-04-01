// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/// @title ERC20 Token Standard, Tokens Receiver.
/// @notice Interface for supporting safeTransfers from ERC20 contracts with Safe Transfers extension.
/// @dev See https://eips.ethereum.org/EIPS/eip-20
/// @dev Note: the ERC-165 identifier for this interface is 0x4fc35859.
interface IERC20Receiver {
    /// @notice Handles the receipt of ERC20 tokens.
    /// @param sender The initiator of the transfer.
    /// @param from The account which transferred the tokens.
    /// @param value The amount of tokens transferred.
    /// @param data Optional additional data with no specified format.
    /// @return magicValue `bytes4(keccak256("onERC20Received(address,address,uint256,bytes)"))` (`0x4fc35859`).
    function onERC20Received(
        address sender,
        address from,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4 magicValue);
}
