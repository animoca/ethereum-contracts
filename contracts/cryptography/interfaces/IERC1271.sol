// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/// @title Standard Signature Validation Method for Contracts.
/// @dev See https://eips.ethereum.org/EIPS/eip-1271
/// @dev Note: This interface uses the initial version of ERC1271, which was later updated to use the same function signature as ERC1654.
interface IERC1271 {
    /// @notice Returns whether the signature is valid for the data.
    /// @param data The signed data.
    /// @param signature The signature for `data`.
    /// @return magicValue `0x20c13b0b` if the signature is valid, else any other value.
    function isValidSignature(bytes calldata data, bytes memory signature) external view returns (bytes4 magicValue);
}
